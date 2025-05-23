export function hashCode(str: string): string {
	let hash = 0;
	let i;
	let chr;
	if (str.length === 0) {
		return String(hash);
	}
	for (i = 0; i < str.length; i++) {
		chr = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return String(hash);
}
