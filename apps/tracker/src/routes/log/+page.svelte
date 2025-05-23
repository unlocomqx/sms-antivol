<script lang="ts">
  // noinspection ES6UnusedImports
  import * as Card from "$lib/components/ui/card"
  import {log} from "$lib/log.svelte"
  import {_} from "$lib/plugin/i18n"

  let log_div = $state<HTMLPreElement>()
  $effect(() => {
    if (log.messages.length) {
      log_div?.scrollTo(0, log_div.scrollHeight)
    }
  })
</script>

<Card.Root class="w-96 max-w-xl">
  <Card.Header>
    <Card.Title>{_('Logs')}</Card.Title>
    <Card.Description>
      {_('View app logs.')}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <pre bind:this={log_div}>{log.messages.join('\n') || _('SMS logs will appear here.')}</pre>
  </Card.Content>
</Card.Root>
