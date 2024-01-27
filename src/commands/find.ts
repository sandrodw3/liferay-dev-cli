import { getModules } from 'liferay'
import { fuzzySearch, getBaseName, log } from 'tools'

/**
 * Look for a module in the whole project and return its path
 */

export async function find() {
	const modules = await getModules()

	const list = modules.map((module) => ({
		id: module,
		name: getBaseName(module),
	}))

	const module = await fuzzySearch(list)

	if (!module) {
		Deno.exit(1)
	}

	log(module)
}
