import { bold, red } from 'std/colors'
import { existsSync } from 'std/exists'

import { readConfig, writeConfig } from 'config'
import { join, log } from 'tools'

export const CONFIG_ENTRY_KEYS = [
	'portal.path',
	'base.branch',
	'mysql.user',
	'mysql.pw',
	'mysql.db',
] as const

export type ConfigEntry = (typeof CONFIG_ENTRY_KEYS)[number]

/**
 * Get the value of some config entry
 */

export async function getConfigEntry(entry: ConfigEntry) {
	const config = await readConfig()

	return config[entry] as string
}

/**
 * Set a config entry to the given value
 */

export async function setConfigEntry(entry: ConfigEntry, value: string) {
	const config = await readConfig()

	// In case of setting portal path, check it's valid

	if (
		entry === 'portal.path' &&
		!existsSync(join(value, 'portal-web', 'portal-web.iml'))
	) {
		throw new Error(`This is ${bold(red('not a valid'))} portal path`)
	}

	config[entry] = value

	try {
		await writeConfig(config)
	} catch {
		log(`Configuration ${red('could not be saved')}, please try again`)

		Deno.exit(1)
	}
}
