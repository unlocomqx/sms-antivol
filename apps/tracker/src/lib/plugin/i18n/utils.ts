import { lang } from '$lib/state/lang';
import { dpa } from '$lib/globals.svelte';

export function fallback(strings: Record<string, string>){
	const current = strings[lang.value];
	if(!current){
		return strings[dpa.id_default_lang];
	}
	return undefined;
}
