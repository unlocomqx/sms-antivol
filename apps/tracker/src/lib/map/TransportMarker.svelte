<script lang='ts'>
  import type {GeoGroup} from '$lib/utils/geo'
  import {Fill, Icon as olIcon, Stroke, Style, Text} from 'ol/style'
  import {Feature, Overlay} from 'ol'
  import type {Geometry} from "ol/geom"
  import {LineString} from 'ol/geom'
  import {getContext, onMount} from 'svelte'
  import type Map from 'ol/Map'
  import Point from 'ol/geom/Point'
  import {fromLonLat} from 'ol/proj'
  import {Vector} from 'ol/source'
  import {Vector as VectorLayer} from 'ol/layer'
  import Icon from '@iconify/svelte'
  import {theme} from '$lib/stores/theme'
  import {toast} from "svelte-sonner"
  import {api} from "$lib/api"
  import type MapBrowserEvent from "ol/MapBrowserEvent"
  import type {Coordinate} from "ol/coordinate"
  import AutoComplete from "$lib/components/AutoComplete.svelte"
  import {getVectorContext} from 'ol/render'

  interface Props {
    group: GeoGroup
    onsavelabel?: () => void
  }

  let {group, onsavelabel}: Props = $props()

  let popover: HTMLDivElement | undefined = $state()
  let display_popover = false

  let vectorLayer: VectorLayer<Vector> | null = null
  let iconStyle: Style[] | null = null
  let iconFeature: Feature | null = null
  let routeFeature: Feature | null = null
  let popup: Overlay | null = null

  const mapContext = getContext('map') as {
    instance: Map;
  }

  const styles = {
    'route': new Style({
      stroke: new Stroke({
        width: 6,
        color: [237, 212, 0, 0.8],
      }),
    }),
  }

  onMount(() => {
    if (!location) return

    const map = mapContext.instance

    iconStyle = getStyle()

    iconFeature = new Feature({
      geometry: new Point(fromLonLat([location.x, location.y]))
    })
    iconFeature.setStyle(iconStyle)

    routeFeature = new Feature({
      type: 'route',
      geometry: route,
      style: styles.route
    })

    const vectorSource = new Vector({
      features: [iconFeature, routeFeature]
    })

    vectorLayer = new VectorLayer({
      source: vectorSource,
      opacity: getOpacity(),
    })

    map.addLayer(vectorLayer)

    popup = new Overlay({
      element: popover,
      positioning: 'bottom-center',
      stopEvent: false,
      autoPan: true,
      offset: [0, -50]
    })
    map.addOverlay(popup)

    const handleClick = function (evt: MapBrowserEvent) {
      if (!location || !popup || !popover) return

      const feature = map!.forEachFeatureAtPixel(evt.pixel, function (feature) {
        return feature
      })

      if (!feature || feature !== iconFeature) {
        return
      }

      if (feature === iconFeature) {
        if (!display_popover) {
          displayPopover(evt.coordinate)
        } else {
          hidePopover()
        }
      } else {
        hidePopover()
      }
    }

    map.on("click", handleClick)

    return () => {
      if (vectorLayer) {
        map.removeLayer(vectorLayer)
      }
      if (popup) {
        map.removeOverlay(popup)
      }
      // @ts-expect-error type issue
      map.removeEventListener('click', handleClick)
    }
  })

  function displayPopover(center: Coordinate) {
    const map = mapContext.instance

    if (!map || !location || !popup || !popover) return

    const coords = new Point(fromLonLat([location.x, location.y]))
    popup.setPosition(coords.getCoordinates())
    map.getView().animate({
      center,
      duration: 500
    })
    display_popover = true
    Object.assign(popover.style, {
      opacity: 1,
      display: 'block'
    })
  }

  function hidePopover() {
    display_popover = false
    Object.assign(popover!.style, {
      opacity: 0,
      display: 'none'
    })
  }

  function getStyle(): Style[] {
    const styles = [
      new Style({
        image: new olIcon({
          anchor: [0.5, .85],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          src: icon,
          scale: .5,
          color: group.is_me ? 'lime' : undefined,
        }),
        text: new Text({
          text: group.count.toString(),
          offsetY: -6,
          font: 'bold 16px sans-serif',
          justify: 'center',
          fill: new Fill({
            color: 'red'
          }),
          stroke: new Stroke({
            color: 'white',
            width: 5
          })
        })
      }),
      group.label && new Style({
        text: new Text({
          text: group.label,
          offsetY: -36,
          font: 'bold 16px sans-serif',
          justify: 'center',
          fill: new Fill({
            color: '#1e90ff'
          }),
          stroke: new Stroke({
            color: 'white',
            width: 5
          })
        })
      })
    ].filter(Boolean)

    if (group.heading !== undefined && group.heading !== null) {
      let anchor_y = 1.2
      if (group.heading < 60 || group.heading > 300) {
        anchor_y = 2
      }
      styles.push(new Style({
        image: new olIcon({
          anchor: [0.5, anchor_y],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          src: '/map/arrow-up-fill.png',
          scale: .4,
          rotation: group.heading / 180 * Math.PI
        })
      }))
    }

    return styles as Style[]
  }

  function getOpacity() {
    return group.total_reputation > 0 ? 1 : 0.7
  }

  function updateIcon() {
    if (!location) return

    vectorLayer?.setOpacity(getOpacity())
    // iconFeature?.setGeometry(new Point(fromLonLat([location.x, location.y])))
    iconFeature?.setStyle(getStyle())
  }

  async function updatePopup(popover: HTMLDivElement) {
    if (!popup) return

    const map = mapContext.instance

    map.removeOverlay(popup)
    popup = new Overlay({
      element: popover,
      positioning: 'bottom-center',
      stopEvent: false,
      autoPan: true,
      offset: [0, -50]
    })
    map.addOverlay(popup)

    if (display_popover) {
      Object.assign(popover.style, {
        opacity: 1,
        display: 'block'
      })
    }
  }

  let {location} = $derived(group)
  let icon = $derived(group.mode === 'train' ? '/map/oncoming-train.png' : '/map/oncoming-bus.png')
  let key = $derived(`${group.id}-${location?.y}-${location?.x}-${icon}-${group.count}-${group.total_reputation}`)
  $effect(() => {
    key
    updateIcon()
  })
  $effect(() => {
    $theme
    popover && updatePopup(popover)
  })

  async function upvote() {
    const {data, error} = await api('/api/reaction/upvote', {
      ids: group.ids.join(','),
      mode: group.mode
    })

    if (data.error) {
      toast.error(data.message)
      return
    }

    toast.success(data.message)
  }

  async function downvote() {
    const {data, error} = await api('/api/reaction/downvote', {
      ids: group.ids.join(','),
      mode: group.mode
    })

    if (data.error) {
      toast.error(data.message)
      return
    }

    toast.success(data.message)
  }

  let label = $state(group.label)
  let label_input = $state<HTMLInputElement | undefined>()

  async function saveLabel() {
    if (!label) {
      label_input?.focus()
      toast.error('Please enter a label')
      return
    }

    const {data, error} = await api('/api/label', {
      ids: group.ids.join(','),
      label
    })

    if (data.error) {
      toast.error(data.message)
      return
    }

    toast.success(data.message)
    onsavelabel?.()
  }

  let speed = 500
  let distance = 0
  let lastTime = 0
  let position: Geometry | undefined = undefined
  let route = createRoute([[0, 0], [0, 0]])

  function createRoute(coordinates: Coordinate[]) {
    return new LineString(coordinates)
  }

  function moveFeature(event: any) {
    if (!position) return

    const map = mapContext.instance
    const time = event.frameState.time
    const elapsedTime = time - lastTime
    distance = Math.min((distance + (speed * elapsedTime) / 1e6), 1)
    lastTime = time

    const currentCoordinate = route?.getCoordinateAt(
      distance > 1 ? 2 - distance : distance,
    )

    position?.setCoordinates(currentCoordinate)
    const vectorContext = getVectorContext(event)
    // const style = getStyle()
    // vectorContext.setStyle(style[0])
    vectorContext.drawGeometry(position)
    iconFeature?.setGeometry(position)
    // tell OpenLayers to continue the postrender animation
    map.render()
    if (distance == 1) {
      stopAnimation()
    }
  }

  function startAnimation() {
    lastTime = Date.now()
    vectorLayer?.on('postrender', moveFeature)
    // hide geoMarker and trigger map render through change event
    // iconFeature?.setGeometry(undefined)
  }

  function stopAnimation() {
    // Keep marker at current animation position
    if (position)
      iconFeature?.setGeometry(position)
    vectorLayer?.un('postrender', moveFeature)
    lastTime = 0
    distance = 0
  }

  $effect(() => {
    if (!location) return

    position = iconFeature?.getGeometry()?.clone()
    if (!position) return

    const coords = position.getCoordinates()
    const point = fromLonLat([location.x, location.y])
    if (coords[0] === point[0] && coords[1] === point[1]) {
      stopAnimation()
      return
    }
    route = createRoute([
      [coords[0], coords[1]],
      [point[0], point[1]]
    ])

    routeFeature?.setGeometry(route)

    startAnimation()

    return () => {
      stopAnimation()
    }
  })
</script>

<div class='away'
     data-cy='transport-marker'
     data-cy-count='{group.count}'
     data-cy-id='{group.id}'
     data-cy-is_me={group.is_me || null}
     data-cy-label='{group.label}'
     data-cy-mode='{group.mode}'
     data-heading='{group.heading}'
>
  <button
      onclick={() => location && displayPopover((new Point(fromLonLat([location.x, location.y]))).getCoordinates())}>
    open {group.id} - {group.label} - {group.heading}
  </button>
</div>

<div bind:this={popover}
     class='text-center p-4 rounded-sm max-w-xs md:max-w-md bg-base-100 opacity-0 transition-opacity'>
  <div class='text-2xl font-bold px-8'>
    {group.count} passenger{group.count > 1 ? 's' : ''} reported the location of this {group.mode}.
  </div>
  <div class="absolute right-0 top-0 p-4">
    <button class="btn btn-ghost">
      <Icon class='text-2xl' icon='mdi:close' onclick={hidePopover}/>
    </button>
  </div>
  {#if group.is_me && location}
    <div class="mt-4">
      Please enter a name for this marker:

      <div class="flex gap-2 justify-center items-center w-72 m-auto">
        <AutoComplete {location} bind:label/>
        <button class='btn btn-primary' type="button" onclick={saveLabel} data-cy="save-label">
          <Icon icon='ic:baseline-save' class='text-xl'/>
          Save
        </button>
      </div>
    </div>
  {/if}
  <p class='text-2xl mt-4 text-gray-500'>
    Is this marker correct?
  </p>
  <div class='mt-4'>
    <button class='btn btn-success' data-cy='upvote-btn' onclick={upvote} type="button">
      <Icon class='text-2xl' icon='mdi:arrow-up'/>
    </button>
    <button class='btn btn-error' data-cy='downvote-btn' onclick={downvote} type="button">
      <Icon class='text-2xl' icon='mdi:arrow-down'/>
    </button>
  </div>
</div>
