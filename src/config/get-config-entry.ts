import { ConfigEntry, getConfig } from 'config'

export async function getConfigEntry(entry: ConfigEntry) {
	const config = await getConfig()

	return config[entry]
}
