import { walkSync } from 'std/walk'

import { getConfigEntry } from 'config'
import { ModuleType, ROOT_MODULES, getModuleType } from 'liferay'
import { fuzzySearch, getBaseName, join } from 'tools'

const WALK_OPTIONS = {
	includeFiles: false,
	maxDepth: 3,
}

type Props = {
	exclude?: ModuleType[]
	include?: ModuleType[]
}

/**
 * Allow selecting a Liferay module with fuzzy search.
 * Module types can be excluded from the list
 */

export async function selectModule(): Promise<string | null>

export async function selectModule(props: {
	exclude: ModuleType[]
	include?: never
}): Promise<string | null>

export async function selectModule(props: {
	include: ModuleType[]
	exclude?: never
}): Promise<string | null>

export async function selectModule({ exclude, include }: Props = {}): Promise<
	string | null
> {
	const portalPath = await getConfigEntry('portal.path')

	// Add needed modules and sort the list

	const modules = []

	const isIncluded = (type: ModuleType | null) => {
		if (!type) {
			return false
		}

		if (include) {
			return include.includes(type)
		}

		if (exclude) {
			return !exclude.includes(type)
		}

		return true
	}

	if (isIncluded('root')) {
		modules.push(portalPath)
	}

	if (isIncluded('playwright')) {
		modules.push(join(portalPath, 'modules/test/playwright'))
	}

	if (isIncluded('root-module')) {
		modules.push(...ROOT_MODULES.map((module) => join(portalPath, module)))
	}

	const apps = walkSync(join(portalPath, 'modules/apps'), WALK_OPTIONS)
	const dxpApps = walkSync(join(portalPath, 'modules/dxp/apps'), WALK_OPTIONS)
	const utils = walkSync(join(portalPath, 'modules/util'), WALK_OPTIONS)

	for (const module of [...apps, ...dxpApps, ...utils]) {
		const type = await getModuleType(module.path)

		if (isIncluded(type) && !modules.includes(module.path)) {
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
