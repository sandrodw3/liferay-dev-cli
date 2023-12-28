import { walkSync } from 'std/walk'

import { getConfigEntry } from 'config'
import { ROOT_MODULES, isLiferayModule } from 'liferay'
import { join } from 'tools'

const WALK_OPTIONS = {
	includeFiles: false,
	maxDepth: 3,
}

/**
 * Return a list with all liferay modules sorted alphabetically
 */

export async function getModules(): Promise<string[]> {
	const portalPath = await getConfigEntry('portal.path')

	// Add portal root, playwright folder and root modules

	const modules = [
		portalPath,
		join(portalPath, 'modules/test/playwright'),
		...ROOT_MODULES.map((module) => join(portalPath, module)),
	]

	const apps = walkSync(join(portalPath, 'modules/apps'), WALK_OPTIONS)
	const dxpApps = walkSync(join(portalPath, 'modules/dxp/apps'), WALK_OPTIONS)
	const utils = walkSync(join(portalPath, 'modules/util'), WALK_OPTIONS)

	for (const module of [...apps, ...dxpApps, ...utils]) {
		if (isLiferayModule(module.path)) {
			modules.push(module.path)
		}
	}

	modules.sort()

	return modules
}
