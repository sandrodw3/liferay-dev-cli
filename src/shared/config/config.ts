import { ConfigEntry } from 'config'
import { join } from 'tools'

export const CONFIG_PATH = join(Deno.env.get('HOME')!, '.lfr', 'config.json')

type Config = Partial<Record<ConfigEntry, string>>

/**
 * Get config from file
 */

export async function readConfig(): Promise<Config> {
	return JSON.parse(await Deno.readTextFile(CONFIG_PATH))
}

/**
 * Write config in file
 */

export async function writeConfig(config: Config) {
	await Deno.writeTextFile(CONFIG_PATH, JSON.stringify(config, null, '\t'))
}
