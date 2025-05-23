<script lang='ts'>
  import Map from 'ol/Map'
  import Point from 'ol/geom/Point'
  import {fromLonLat} from 'ol/proj'
  import TileLayer from 'ol/layer/Tile'
  import View from 'ol/View'
  import {setContext} from 'svelte'
  import type {Coords} from '$lib/types'
  import {OSM} from 'ol/source'

  interface Props {
    map?: Map | null;
    center?: Coords;
    onmapready?: (map: Map) => void;
    children?: import('svelte').Snippet;
  }

  let {map = $bindable(null), center = {latitude: 0, longitude: 0}, onmapready, children}: Props = $props()
  export const centerMap = (center: Coords) => {
    if (!map) return
    map.getView().setCenter(fromLonLat([center.longitude, center.latitude]))
  }

  setContext('map', {
    get instance() {
      return map
    }
  })

  function initMap(div: HTMLDivElement) {
    const {latitude, longitude} = center
    const point = new Point(fromLonLat([longitude, latitude]))
    const tileLayer = new TileLayer({
      source: new OSM()
    })
    map = new Map({
      target: div,
      layers: [
        tileLayer
      ],
      view: new View({
        center: point.getCoordinates(),
        zoom: 18
      })
    })

    // change mouse cursor when over marker
    map.on('pointermove', function (e) {
      if (!map) return
      const pixel = map.getEventPixel(e.originalEvent)
      const hit = map.hasFeatureAtPixel(pixel)
      const target = map.getTarget()
      if (target instanceof HTMLElement) {
        target.style.cursor = hit ? 'pointer' : ''
      }
    })

    onmapready?.(map)

    return {
      destroy() {
        map?.setTarget(undefined)
        map = null
      }
    }
  }
</script>

<div class="w-full h-96" use:initMap>
  {#if map}
    {@render children?.()}
  {/if}
</div>
