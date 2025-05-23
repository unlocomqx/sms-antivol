<script lang="ts">
  import {type Position} from "@tauri-apps/plugin-geolocation"
  // noinspection ES6UnusedImports
  import * as Alert from "$lib/components/ui/alert"
  // noinspection ES6UnusedImports
  import * as Card from "$lib/components/ui/card"
  import {Button} from "$lib/components/ui/button"
  import Icon from "@iconify/svelte"
  import Spinner from "$lib/components/Spinner.svelte"
  import type {Coords} from "$lib/types"
  import type {SvelteComponent} from "svelte"
  import CenterMarker from "$lib/map/CenterMarker.svelte"
  import Map from "$lib/map/Map.svelte"
  import {getCurrentLocation} from "$lib/location"
  import {_} from "$lib/plugin/i18n"

  let current_pos_state = $state('idle')
  let current_pos_error = $state('')
  let current_pos = $state<Position>()

  let mapComp: (SvelteComponent & {
    centerMap: (coords: Coords) => void
  }) | undefined = $state()

  async function testGetLocation() {
    try {
      current_pos_error = ''
      current_pos_state = 'loading'
      current_pos = undefined
      current_pos = await getCurrentLocation()
      current_pos_state = 'idle'
    } catch (e) {
      console.error(e)
      current_pos_state = 'error'
      current_pos_error = _("Unable to get location")
      current_pos = undefined
    } finally {
      current_pos_state = 'idle'
    }
  }
</script>

<Card.Root class="w-96 max-w-xl">
  <Card.Header>
    <Card.Title>{_('Location test')}</Card.Title>
    <Card.Description>
      {_('Check if location is working correctly.')}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    {#if current_pos_error}
      <Alert.Root variant="destructive">
        <Icon icon="mdi:alert-circle" class="h-4 w-4"/>
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>
          {current_pos_error}
        </Alert.Description>
      </Alert.Root>
    {/if}

    {#if current_pos}
      {@const {latitude, longitude} = current_pos.coords}
      <div class="relative">
        <Map bind:this={mapComp} center={{ latitude, longitude }}>
          <CenterMarker coords={{ latitude, longitude }}/>
        </Map>
        <Button class="absolute bottom-4 left-4" onclick={() => mapComp?.centerMap(current_pos.coords)}>
          <Icon icon="mdi:crosshairs-gps"/>
        </Button>
      </div>
    {/if}
  </Card.Content>
  <Card.Footer>
    <div>
      <Button onclick={testGetLocation}>
        <Spinner loading={current_pos_state !== 'idle'}>
          <Icon icon="mdi:location"/>
        </Spinner>
        {_('Get current location')}
      </Button>
    </div>
  </Card.Footer>
</Card.Root>

