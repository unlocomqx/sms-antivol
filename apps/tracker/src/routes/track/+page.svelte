<script lang="ts">
  import {load, Store} from "@tauri-apps/plugin-store"
  import {onMount, type SvelteComponent} from "svelte"
  import {Button} from "$lib/components/ui/button"
  import {Label} from "$lib/components/ui/label"
  // noinspection ES6UnusedImports
  import * as Select from "$lib/components/ui/select"
  // noinspection ES6UnusedImports
  import * as Alert from "$lib/components/ui/alert"
  // noinspection ES6UnusedImports
  import * as Card from "$lib/components/ui/card"
  // noinspection ES6UnusedImports
  import * as Table from "$lib/components/ui/table"
  import {default_settings, type Settings} from "$lib/settings"
  import {sendSMS} from "$lib/sms"
  import Icon from "@iconify/svelte"
  import Map from "$lib/map/Map.svelte"
  import type {Coords, DeviceLocation} from "$lib/types"
  import DeviceMarker from "$lib/map/DeviceMarker.svelte"
  import {current_location} from "$lib/current-location.svelte"
  import {log} from "$lib/log.svelte"
  import {type UnlistenFn} from "@tauri-apps/api/event"
  import {_} from "$lib/plugin/i18n"
  import {nanoid} from "nanoid"
  import {Input} from "$lib/components/ui/input"
  import deepmerge from 'deepmerge'
  import {getGoogleMapsLink} from "$lib/location"

  let store: Store
  let settings = $state<Settings>(default_settings)
  $inspect(settings)
  onMount(() => {
    load('store.json', {autoSave: true})
      .then(async s => {
        store = s
        settings = deepmerge(
          default_settings,
          (await store.get<Settings>('settings')) || default_settings,
        )
        selected_id = Object.values(settings.devices)[0]?.id
      })
  })

  let selected_id = $state<string>()
  let selected_device = $derived(settings.devices[selected_id || ""])
  let tracking_error = $state<string>()

  async function trackDevice() {
    tracking_error = ''
    if (!selected_id) {
      tracking_error = _('Please select a device')
      return
    }

    const number = settings.devices[selected_id]?.number
    if (!number) {
      tracking_error = _('Please set a number for the selected device')
      return
    }

    log.push(`${_("Sending location request to")} ${number}`)
    const success = await sendSMS(number, `${settings.password} gps`)
    if (!success) {
      tracking_error = _('Unable to send SMS')
      log.push(`${_("Unable to send location request to")} ${number}`)
      return
    }

    log.push(`${_("Location request sent to")} ${number}`)
  }

  let log_div = $state<HTMLPreElement>()
  $effect(() => {
    if (log.messages.length) {
      log_div?.scrollTo(0, log_div.scrollHeight)
    }
  })

  let latitude = $derived(current_location.coords?.latitude)
  let longitude = $derived(current_location.coords?.longitude)

  let devices_markers = $state<Record<string, DeviceLocation>>({})
  let locations: Store | undefined = undefined

  onMount(() => {
    let listener: UnlistenFn
    load('locations.json', {autoSave: true})
      .then(async s => {
        locations = s
        devices_markers = (await locations.get('locations')) || {}
        listener = await locations.onKeyChange('locations', (value) => {
          devices_markers = value as Record<string, DeviceLocation>
        })
      })

    return () => listener?.()
  })

  let mapComp: (SvelteComponent & {
    centerMap: (coords: Coords) => void
  }) | undefined = $state()

  $effect(() => {
    if (!latitude || !longitude) return
    mapComp?.centerMap({latitude, longitude})
  })

  async function saveSettings() {
    await store.set('settings', settings)
    await store.save()
  }
</script>

<div class="flex flex-col gap-4">
  <Card.Root class="w-96 max-w-xl">
    <Card.Header>
      <Card.Title>{_('My devices')}</Card.Title>
      <Card.Description>
        {_('Save the list of your devices for easier tracking.')}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex flex-col space-y-1.5">
        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label for="from">{_('Devices')}</Label>
          <Table.Root>
            <Table.Caption>{_('The list of your devices.')}</Table.Caption>
            <Table.Header>
              <Table.Row>
                <Table.Head>{_('Name')}</Table.Head>
                <Table.Head class="w-[110px]">{_('Number')}</Table.Head>
                <Table.Head class="text-right"></Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each Object.keys(settings.devices) as id (id)}
                <Table.Row>
                  <Table.Cell class="font-medium">
                    <Input bind:value={settings.devices[id].name} onblur={saveSettings}/>
                  </Table.Cell>
                  <Table.Cell>
                    <Input type="tel" bind:value={settings.devices[id].number} onblur={saveSettings}/>
                  </Table.Cell>
                  <Table.Cell class="text-right">
                    <Button variant="destructive" size="icon" onclick={() => {
                          if(confirm('Are you sure you want to delete this device?')) {
                            delete settings.devices[id]
                            saveSettings()
                          }
                        }}>
                      <Icon icon="mdi:delete"/>
                    </Button>
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
            <Table.Footer>
              <Table.Row>
                <Table.Cell colspan={3}>
                  <Button class="bg-green-400 text-black"
                          onclick={() => {
                          const devices = $state.snapshot(settings.devices)
                          const id = nanoid()
                          devices[id] = {
                            id,
                            name: "",
                            number: ""
                          }
                          settings.devices = devices
                          saveSettings()
                        }} size="sm">
                    <Icon icon="mdi:plus"/>
                    {_('Add device')}
                  </Button>
                </Table.Cell>
              </Table.Row>
            </Table.Footer>
          </Table.Root>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root class="w-96 max-w-xl">
    <Card.Header>
      <Card.Title>{_('Track device')}</Card.Title>
      <Card.Description>
        {_('Track your devices using SMS messages.')}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form>
        <div class="grid w-full items-center gap-4">
          <div class="flex flex-col space-y-1.5">
            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <Label for="device">{_('Device')}</Label>
              <div class="flex gap-2">
                <Select.Root bind:value={selected_id} type="single">
                  <Select.Trigger class="w-48">
                    {selected_device?.name || _('Select a device')}
                    {#if selected_device}
                      ({selected_device.number})
                    {/if}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Group id="device">
                      <Select.GroupHeading>Devices</Select.GroupHeading>
                      {#each Object.values(settings.devices) as {id, name, number} (id)}
                        <Select.Item value={id} label={name}>
                          {name} ({number})
                        </Select.Item>
                      {/each}
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
                <Button onclick={trackDevice}>{_('Track')}</Button>
              </div>
              {#if tracking_error}
                <Alert.Root variant="destructive">
                  <Icon icon="mdi:alert-circle" class="h-4 w-4"/>
                  <Alert.Title>{_('Error')}</Alert.Title>
                  <Alert.Description>
                    {tracking_error}
                  </Alert.Description>
                </Alert.Root>
              {/if}
            </div>
          </div>
        </div>
      </form>
    </Card.Content>
    <Card.Footer class="flex flex-col gap-2 items-start">
      {#if log.messages.length}
        <pre bind:this={log_div}>{log.messages.join('\n')}</pre>
      {/if}
    </Card.Footer>
  </Card.Root>

  {#if latitude && longitude}
    <Card.Root class="w-96 max-w-xl">
      <Card.Content>
        <div class="relative">
          <Map bind:this={mapComp} center={{ latitude, longitude }}>
            {#each Object.values(devices_markers) as {id, device, location} (id)}
              <DeviceMarker {device} {location}/>
            {/each}
          </Map>
          <Button class="absolute bottom-4 left-4" onclick={() => mapComp?.centerMap({latitude, longitude})}>
            <Icon icon="mdi:crosshairs-gps"/>
          </Button>
        </div>
      </Card.Content>
      <Card.Footer>
        <Button href={getGoogleMapsLink({latitude, longitude})}
                target="_blank">
          <Icon icon="mdi:crosshairs-gps"/>
          {_('Open in Google Maps')}
        </Button>
      </Card.Footer>
    </Card.Root>
  {/if}
</div>
