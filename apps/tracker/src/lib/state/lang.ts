import {LocalStore} from './persist.svelte'

export const lang = new LocalStore<string>('lang', '')

export function initLangStore(id_lang: string) {
  lang.value = id_lang
}
