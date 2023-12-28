import { walkSync } from 'std/walk'

import { getConfigEntry } from 'config'
import { ModuleType, ROOT_MODULES, getModuleType } from 'liferay'
import { join } from 'tools'

const WALK_OPTIONS = {
	includeFiles: false,
	maxDepth: 3,
}

type Props = {
	exclude: ModuleType[]
}

/**
 * Return a list with all liferay modules sorted alphabetically
 */

export async function getModules(
	{ exclude }: Props = {
		exclude: [],
	}
): Promise<string[]> {
	const portalPath = await getConfigEntry('portal.path')

	// Add needed modules

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

	return modules
}
