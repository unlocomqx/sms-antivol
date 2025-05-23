<script lang='ts'>
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
  import type MapBrowserEvent from "ol/MapBrowserEvent"
  import type {Coordinate} from "ol/coordinate"
  import {getVectorContext} from 'ol/render'
  import type {Coords} from "$lib/types.js"
  import type {Device} from "$lib/settings.js"

  interface Props {
    device: Device,
    location: Coords,
  }

  let {device, location}: Props = $props()

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
    if (!latitude || !longitude) return

    const map = mapContext.instance

    iconStyle = getStyle()

    iconFeature = new Feature({
      geometry: new Point(fromLonLat([longitude, latitude]))
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
      source: vectorSource
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

    const coords = new Point(fromLonLat([longitude, latitude]))
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
          src: '/map/location-indicator-red.svg',
          scale: 3
        }),
        text: new Text({
          text: device.name,
          offsetY: -50,
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
      })
    ].filter(Boolean)

    return styles as Style[]
  }

  function updateIcon() {
    if (!location) return

    // iconFeature?.setGeometry(new Point(fromLonLat([longitude, latitude])))
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

  let {latitude, longitude} = $derived(location)

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
    const point = fromLonLat([longitude, latitude])
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
