import { bold, red } from 'std/colors'
import { existsSync } from 'std/exists'

import { CONFIG_PATH, ConfigEntry, getConfig } from 'config'
import { join, log } from 'tools'

export async function setConfigEntry(entry: ConfigEntry, value: string) {
	const config = await getConfig()

	// In case of setting portal path, check it's valid

	if (
		entry === 'portal.path' &&
		!existsSync(join(value, 'portal-web', 'portal-web.iml'))
	) {
		throw new Error(`This is ${bold(red('not a valid'))} portal path`)
	}

	config[entry] = value

	try {
		await Deno.writeTextFile(CONFIG_PATH, JSON.stringify(config))
	} catch {
		log(`Configuration ${red('could not be saved')}, please try again`)

		Deno.exit(1)
	}
}
