import {dict} from '$lib/plugin/i18n/dict.svelte'

export function _(str: string) {
  let trans = dict.translations?.[str]
  if (trans) {
    return trans
  }
  return str
}
