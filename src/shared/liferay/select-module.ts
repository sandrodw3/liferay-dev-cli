import { walkSync } from 'std/walk'

import { getConfigEntry } from 'config'
import { ModuleType, ROOT_MODULES, getModuleType } from 'liferay'
import { fuzzySearch, getBaseName, join } from 'tools'

const WALK_OPTIONS = {
	includeFiles: false,
	maxDepth: 3,
}

type Props = {
	exclude: ModuleType[]
}

/**
 * Allow selecting a Liferay module with fuzzy search.
 * Module types can be excluded from the list
 */

export async function selectModule(
	{ exclude }: Props = {
		exclude: [],
	}
): Promise<string | null> {
	const portalPath = await getConfigEntry('portal.path')

	// Add needed modules and sort the list

	const modules = []

	if (!exclude.includes('root')) {
		modules.push(portalPath)
	}

	if (!exclude.includes('playwright')) {
		modules.push(join(portalPath, 'modules/test/playwright'))
	}

	if (!exclude.includes('root-module')) {
		modules.push(...ROOT_MODULES.map((module) => join(portalPath, module)))
	}

	const apps = walkSync(join(portalPath, 'modules/apps'), WALK_OPTIONS)
	const dxpApps = walkSync(join(portalPath, 'modules/dxp/apps'), WALK_OPTIONS)
	const utils = walkSync(join(portalPath, 'modules/util'), WALK_OPTIONS)

	for (const module of [...apps, ...dxpApps, ...utils]) {
		const type = await getModuleType(module.path)

		if (
			(type === 'test-module' && !exclude.includes('test-module')) ||
			(type === 'parent-module' && !exclude.includes('parent-module')) ||
			(type === 'standard-module' && !exclude.includes('standard-module'))
		) {
			modules.push(module.path)
		}
	}

	modules.sort()

	// Build the list for the fuzzy search and execute it
	// We are also storing modules with repeated names

	const list = modules.map((module) => ({
		id: module,
		name: getBaseName(module),
	}))

	const formatPreview =
		'echo "{}" | sed "s|.*/\\([^/]*\\)/\\([^/]*\\)/\\([^/]*\\) .*|\\1/\\2/\\3|"'

	const module = await fuzzySearch(list, formatPreview)

	// Return the module or null if no module was selected

	return module || null
}
