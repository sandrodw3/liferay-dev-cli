import { CONFIG_PATH } from 'config'

export async function getConfig() {
	try {
		return JSON.parse(await Deno.readTextFile(CONFIG_PATH))
	} catch {
		return null
	}
}
