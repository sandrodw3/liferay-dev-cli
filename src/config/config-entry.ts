export const CONFIG_ENTRY_KEYS = [
	'portal.path',
	'portal.db',
	'mysql.user',
	'mysql.pw',
] as const

export type ConfigEntry = (typeof CONFIG_ENTRY_KEYS)[number]
