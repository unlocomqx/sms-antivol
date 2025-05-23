<script lang="ts">
  import {load, type Store} from "@tauri-apps/plugin-store"
  import {onMount} from "svelte"
  import {Button} from "$lib/components/ui/button"
  import {Input} from "$lib/components/ui/input"
  import {Label} from "$lib/components/ui/label"
  import Icon from "@iconify/svelte"
  // noinspection ES6UnusedImports
  import * as Card from "$lib/components/ui/card"
  import {default_settings, type Settings} from "$lib/settings"
  import {_} from "$lib/plugin/i18n"

  let store: Store
  let settings = $state<Settings>(default_settings)
  let show_password = $state(false)
  onMount(() => {
    load('store.json', {autoSave: true})
      .then(async s => {
        store = s
        settings = (await store.get<Settings>('settings') || settings)
      })
  })

  async function saveSettings() {
    settings.from = settings.from.replace(/\s/g, '')
    await store.set('settings', settings)
    await store.save()
  }
</script>

<div>

  <Card.Root class="w-96 max-w-xl">
    <Card.Header>
      <Card.Title>{_('App Settings')}</Card.Title>
      <Card.Description>
        {_('Configure app settings')}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form>
        <div class="grid w-full items-center gap-4">

          <div class="flex flex-col space-y-1.5">
            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <Label for="password">{_('Password')}</Label>
              <div class="flex gap-2">
                <Input bind:value={settings.password} id="password" name="password" onblur={saveSettings}
                       required
                       type={show_password ? 'text' : 'password'}
                />
                <Button onclick={() => show_password = !show_password} type="button">
                  <Icon
                      icon={show_password ? 'mdi:eye-off' : 'mdi:eye'}
                  />
                </Button>
              </div>
            </div>
          </div>

          <div class="flex flex-col space-y-1.5">
            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <Label for="from">{_('Allow from numbers (comma separated)')}</Label>
              <Input type="tel" bind:value={settings.from} id="from" name="from" onblur={saveSettings}
                     placeholder="22222222,33333333"/>
              <p class="text-muted-foreground text-sm">{_('Leave empty to allow from any numbers (not recommended).')}</p>
            </div>
          </div>
        </div>
      </form>
    </Card.Content>
  </Card.Root>
</div>
