<script lang="ts">
  import DeviceChecker from "$lib/components/DeviceChecker.svelte"
  import LocationChecker from "$lib/components/LocationChecker.svelte"
  import {Button} from "$lib/components/ui/button"
  import Icon from "@iconify/svelte"
  import {_} from "$lib/plugin/i18n"
</script>

<main class="flex flex-col gap-4">

  <Button href="/track" class="bg-green-400 text-black text-xl h-16" size="lg">
    <Icon icon="mdi:target"/>
    {_('Track device')}
  </Button>

  <Button href="/log" class="bg-blue-400 text-black text-xl h-16" size="lg">
    <Icon icon="mdi:text-long"/>
    {_('View logs')}
  </Button>

  <DeviceChecker/>

  <LocationChecker/>

</main>
