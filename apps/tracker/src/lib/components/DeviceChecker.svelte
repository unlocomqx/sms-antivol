<script lang="ts">
  import {
    checkPermissions as checkSmsPermissions,
    getState,
    invokeAction,
    onResume,
    requestPermissions as requestSmsPermissions
  } from "tauri-plugin-sms-api"
  // noinspection ES6UnusedImports
  import * as Card from "$lib/components/ui/card"
  import {Button} from "$lib/components/ui/button"
  import {Badge} from "$lib/components/ui/badge"
  import Icon from "@iconify/svelte"
  import {load} from "@tauri-apps/plugin-store"
  import {
    checkPermissions as checkLocationPermissions,
    requestPermissions as requestLocationPermissions
  } from "@tauri-apps/plugin-geolocation"
  import type {Settings} from "$lib/settings"
  import {onMount} from "svelte"
  import type {PluginListener} from "@tauri-apps/api/core"
  import {_} from "$lib/plugin/i18n"

  let rerender_key = $state(0)

  function checkAgain() {
    rerender_key++
  }

  async function getPassword() {
    let store = await load('store.json', {autoSave: true})
    return store.get<Settings>('settings').then(settings => {
      return settings?.password
    })
  }

  async function hasRestrictedNumbers() {
    let store = await load('store.json', {autoSave: true})
    return store.get<Settings>('settings').then(settings => {
      return !!settings?.from
    })
  }

  async function hasLocationAccess() {
    const {location} = await checkLocationPermissions()
    return location === 'granted'
  }

  async function hasSmsAccess() {
    const {sms} = await checkSmsPermissions()
    return sms === 'granted'
  }

  async function isBatteryUnrestricted() {
    const {state} = await getState("battery_unrestricted")
    return state
  }

  onMount(() => {
    let listener: PluginListener
    onResume(() => {
      checkAgain()
    })
      .then((l: PluginListener) => {
        listener = l
      })
    return () => listener?.unregister()
  })
</script>

{#snippet spinner()}
  <Badge variant="outline" class="h-8 w-8"
  >
    <Icon icon="svg-spinners:180-ring"/>
  </Badge>
{/snippet}

{#snippet state_badge(state: boolean)}
  <Badge variant="outline"
         class="text-white h-8 w-8 {state ? 'bg-green-500' : 'bg-red-500'}"
         onclick={checkAgain}
  >
    <Icon icon={state ? 'mdi:check-bold' : 'mdi:close-thick'}/>
  </Badge>
{/snippet}

<Card.Root class="w-96 max-w-xl">
  <Card.Header>
    <Card.Title>{_('Device Checks')}</Card.Title>
    <Card.Description>
      {_('Necessary device checks to ensure the app is running correctly.')}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="flex flex-col gap-4">
      {#key rerender_key}

        <div class="flex items-center gap-2">
          {#await getState("silent_mode")}
            {@render spinner()}
            {_('Silent mode')}
          {:then {state, data}}
            {@render state_badge(state)}
            {_('Silent mode')}

            {#if data.error}
              ({data.error})
            {/if}
          {/await}
        </div>

        <div class="flex items-center gap-2">
          {#await getState("charging")}
            {@render spinner()}
            {_('Charging state')}
          {:then {state, data}}
            {@render state_badge(state)}
            {_('Charging state')}
            {#if data.error}
              ({data.error})
            {/if}
          {/await}
        </div>

        <div class="flex items-center gap-2">
          {#await getPassword()}
            {@render spinner()}
            {_('Password protected')}
          {:then password}
            {@render state_badge(!!password)}
            {_('Password protected')}
            {#if !password}
              <Button href="/settings" size="sm" variant="ghost">
                <Icon icon="mdi:cog"/>
              </Button>
            {/if}
          {/await}
        </div>

        <div class="flex items-center gap-2">
          {#await hasRestrictedNumbers()}
            {@render spinner()}
            {_('Restricts numbers')}
          {:then state}
            {@render state_badge(state)}
            {_('Restricts numbers')}
            {#if !state}
              <Button href="/settings" size="sm" variant="ghost">
                <Icon icon="mdi:cog"/>
              </Button>
            {/if}
          {/await}
        </div>

        <div class="flex items-center gap-2">
          {#await hasLocationAccess()}
            {@render spinner()}
            {_('Has location access')}
          {:then state}
            {@render state_badge(state)}
            {_('Has location access')}
            {#if !state}
              <Button size="sm" variant="ghost" onclick={async () => {
                await requestLocationPermissions(['location'])
                checkAgain()
              }}>
                <Icon icon="mdi:cog"/>
              </Button>
            {/if}
          {/await}
        </div>

        <div class="flex items-center gap-2">
          {#await hasSmsAccess()}
            {@render spinner()}
            {_('Has SMS access')}
          {:then state}
            {@render state_badge(state)}
            {_('Has SMS access')}
            {#if !state}
              <Button size="sm" variant="ghost" onclick={async () => {
                await requestSmsPermissions()
                checkAgain()
              }}>
                <Icon icon="mdi:cog"/>
              </Button>
            {/if}
          {/await}
        </div>

        <div class="flex items-center gap-2">
          {#await isBatteryUnrestricted()}
            {@render spinner()}
            {_('Is not restricted by battery')}
          {:then state}
            {@render state_badge(state)}
            {_('Is not restricted by battery')}
            {#if !state}
              <Button size="sm" variant="ghost" onclick={async () => {
                await invokeAction("ask_ignore_optimizations")
                checkAgain()
              }}>
                <Icon icon="mdi:cog"/>
              </Button>
            {/if}
          {/await}
        </div>

      {/key}
    </div>
  </Card.Content>
  <Card.Footer class="flex justify-between">
    <div>
      <Button onclick={checkAgain}>{_('Check again')}</Button>
    </div>
  </Card.Footer>
</Card.Root>
