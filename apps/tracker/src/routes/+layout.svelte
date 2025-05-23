<script lang="ts">
  import '../app.css'
  import {Separator} from "$lib/components/ui/separator"
  import {Button} from "$lib/components/ui/button"
  import Icon from "@iconify/svelte"
  import {ModeWatcher, toggleMode} from "mode-watcher"
  import {onMount} from "svelte"
  import type {PluginListener} from "@tauri-apps/api/core"
  import {getSmsCommand, normalizeNumber, sendSMS, validateSms} from "$lib/sms"
  import type {Settings} from "$lib/settings"
  import {getCurrentLocation, getGoogleMapsLink} from "$lib/location"
  import {onSmsReceived, type Sms} from "tauri-plugin-sms-api"
  import {load, type Store} from "@tauri-apps/plugin-store"
  import {log} from "$lib/log.svelte"
  import {current_location} from "$lib/current-location.svelte"
  import type {DeviceLocation} from "$lib/types"
  import {initLangStore, lang} from "$lib/state/lang"
  // noinspection ES6UnusedImports
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js"
  import {dict} from "$lib/plugin/i18n/dict.svelte"
  import {page} from "$app/state"

  let {children} = $props()

  onMount(() => {
    let listener: PluginListener
    let store: Store
    let locations: Store
    load('store.json', {autoSave: true})
      .then(async s => {
        store = s
      })
    load('locations.json', {autoSave: true})
      .then(async s => {
        locations = s
      })
    onSmsReceived(async (sms: Sms) => {
      const {body, from} = sms
      const from_number = normalizeNumber(from)
      const settings = await store.get<Settings>('settings')

      if (!settings) {
        log.push(`No settings found, please set a password then try again.`)
        return
      }

      const clean_body = body.replace(settings.password, 'password')

      const {valid, reason} = validateSms(sms, settings)

      if (!valid) {
        log.push(`Received invalid SMS from ${from_number} - ${clean_body}: ${reason}`)
        return
      }

      log.push(`Received SMS: from ${from_number} - ${clean_body}`)

      const command = getSmsCommand(body)

      if (!command) {
        log.push('No sms command found: use this format: password command')
        return
      }

      log.push('Received command: ' + command)

      switch (command) {
        case 'gps':
          log.push(`Getting location...`)
          const location = await getCurrentLocation()
          if (!location) {
            log.push(`Unable to get location`)
            return
          }
          const {latitude, longitude} = location.coords

          log.push(`Location: ${latitude},${longitude}`)
          log.push(`Sending location...`)
          log.push(`password gps: [${latitude},${longitude}] ${getGoogleMapsLink(location.coords)}`)

          const success = await sendSMS(from_number, `${settings.password} gps: [${latitude},${longitude}] ${getGoogleMapsLink(location.coords)}`)
          if (success) {
            log.push(`Location sent to ${from_number}`)
          } else {
            log.push(`Unable to send location`)
          }
          break

        case 'gps:':
          log.push('Reading received location...')
          const new_location: Array<string> = body.split(' ')[2]?.replace('[', '')?.replace(']', '')?.split(',') ?? []
          const device = Object.values(settings.devices).find(d => d.number === from_number)
          const devices_locations: Record<string, DeviceLocation> = (await locations.get('locations')) || {}
          if (device) {
            devices_locations[device.id] = {
              id: device.id,
              location: {
                latitude: Number(new_location?.[0]),
                longitude: Number(new_location?.[1])
              },
              device
            }
            await locations.set('locations', devices_locations)
          } else {
            log.push(`No device found for number ${from_number}`)
            devices_locations["device"] = {
              id: "device",
              location: {
                latitude: Number(new_location?.[0]),
                longitude: Number(new_location?.[1])
              },
              device: {
                id: "device",
                name: "device",
                number: from_number
              }
            }
            await locations.set('locations', devices_locations)
          }

          current_location.set({
            latitude: Number(new_location?.[0]),
            longitude: Number(new_location?.[1])
          })

          log.push(`Location: ${new_location?.[0]}, ${new_location?.[1]}`)
          break
      }
    }).then(l => listener = l)

    return () => listener?.unregister()
  })

  initLangStore(lang.value || "ar")

  $effect(() => {
    try {
      import((`$lib/plugin/i18n/output/dict.${lang.value}.js`))
        .then(({default: translations}) => {
          dict.translations = translations
        })
    } catch (e) {
      console.error(e)
      console.error(`No translations found for ${lang.value}`)
      dict.translations = {}
    }
  })

  let lang_label: Record<string, string> = {
    en: "En",
    fr: "Fr",
    ar: "؏"
  }
  let lang_dir: Record<string, "ltr" | "rtl"> = {
    en: "ltr",
    fr: "ltr",
    ar: "rtl"
  }
  let dir = $derived(lang_dir[lang.value])

  $effect(() => {
    document.dir = dir
  })

</script>

<ModeWatcher/>
<div>
  <div
      class="flex items-start justify-between p-2"
  >
    {#if page.url.pathname !== '/'}
      <Button variant="outline" onclick={() => window.history.back()}>
        {#if dir === "rtl"}
          <Icon icon="mdi:arrow-right"/>
        {:else}
          <Icon icon="mdi:arrow-left"/>
        {/if}
        <span class="sr-only">Back</span>
      </Button>
    {/if}
    <h2 class="text-lg font-semibold">
      <Button href="/" variant="ghost">SMS Antivol</Button>
    </h2>

    <div class="ml-auto flex gap-2 items-center">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button variant="outline">
            {lang_label[lang.value]}
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Group>
            <DropdownMenu.Item onclick={() => lang.value = "ar"}>العربية</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => lang.value = "en"}>English</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => lang.value = "fr"}>Français</DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <Button onclick={toggleMode} size="icon" variant="outline">
        <Icon
            class="absolute dark:opacity-0"
            icon="mdi:weather-night"
        />
        <Icon
            class="absolute opacity-0 dark:opacity-100"
            icon="mdi:weather-sunny"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
      <Button href="/settings">
        <Icon icon="mdi:cog"/>
      </Button>
    </div>
  </div>
  <Separator/>
  <div class="p-4 flex justify-center">
    {@render children()}
  </div>
</div>
