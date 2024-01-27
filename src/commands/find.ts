import { getModules, getPortalPath } from 'liferay'
import { fuzzySearch, getBaseName, log } from 'tools'

/**
 * Looks for a module in the whole project and returns its path
 */

export async function find() {
	// Check it's a Liferay project

	getPortalPath()

	const modules = getModules()

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
