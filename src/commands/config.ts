import {
	ConfigEntry,
	readConfig,
	setConfigEntry,
	setConfigValues,
} from 'config'
import { bold, white } from 'std/colors'
import { log } from 'tools'
import { CONFIG_PATH } from '../shared/config/config.ts'

type Props = {
	entry?: ConfigEntry
	modify?: boolean
	show?: boolean
	value?: string
}

/**
 * Allow setting user configuration
 */

export async function config({ entry, modify, show, value }: Props) {
	if (modify) {
		// Allow modifying current config values

		await setConfigValues()
	} else if (show) {
		// Show current configuration

		const config = await readConfig()

		log(`Showing ${bold('current')} config (stored in ${CONFIG_PATH})\n`)

		for (const [key, value] of Object.entries(config)) {
			log(`${bold(key)}: ${value}`)
		}
	} else if (entry && value) {
		// Set a specific config entry

		try {
			await setConfigEntry(entry, value)

			log(`${bold(white(entry))} set to ${bold(white(value))}`)
		} catch (error) {
			const { message } = error as Error

			log(message)

			Deno.exit(1)
		}
	}
}
