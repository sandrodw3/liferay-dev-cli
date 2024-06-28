import { ConfigEntry, initConfig, readConfig, setConfigEntry } from 'config'
import { bold, white } from 'std/colors'
import { log } from 'tools'

type Props = {
	init?: boolean
	entry?: ConfigEntry
	show?: boolean
	value?: string
}

/**
 * Allow setting user configuration
 */

export async function config({ init, entry, show, value }: Props) {
	if (init) {
		// Asks user for the whole configuration

		await initConfig()
	} else if (show) {
		// Show current configuration

		const config = await readConfig()

		log(`Showing ${bold('current')} config\n`)

		for (const [key, value] of Object.entries(config)) {
			log(`${bold(key)}: ${value}`)
		}
	} else if (entry && value) {
		// Set a specific config entry

		try {
			await setConfigEntry(entry, value)

			log(`${bold(white(entry))} set to ${bold(white(value))}`)
		} catch ({ message }) {
			log(message)

			Deno.exit(1)
		}
	}
}
