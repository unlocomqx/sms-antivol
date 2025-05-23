<script lang="ts">
  import {type Snippet} from 'svelte'
  import Icon from "@iconify/svelte"

  let {
    children,
    loading,
    require_click = true,
    delay = 150,
    class: className,
  }: {
    children?: Snippet
    loading: boolean
    require_click?: boolean
    delay?: number
    class?: string
  } = $props()

  let spinner: HTMLSpanElement
  let clicked = $state(false)
  $effect(() => {
    const button = spinner.closest('button') ?? spinner.closest('a')
    if (!button) return

    button.addEventListener('click', handleClick)

    function handleClick() {
      setTimeout(() => {
        clicked = true
      }, delay)
    }

    return () => {
      button.removeEventListener('click', handleClick)
    }
  })

  $effect(() => {
    if (!loading) {
      clicked = false
    }
  })

  let spin = $derived((clicked || !require_click) && loading)
</script>

<span
    bind:this={spinner}
    class="relative flex items-center justify-center w-4 h-4 {className}"
    class:hidden={!children && !spin}
>
	<span
      class="absolute loading loading-spinner loading-sm transition-opacity duration-200 opacity-0 w-full h-full"
      class:!opacity-100={spin}
  ></span>
	<Icon icon="svg-spinners:180-ring"
        class="absolute transition-opacity duration-200 opacity-0 {spin ? 'opacity-100!' : 'opacity-0'}"/>
	<span
      class="opacity-100 transition-opacity duration-200"
      class:!opacity-0={spin}
  >
		{#if children}
			{@render children()}
		{/if}
	</span>
</span>
