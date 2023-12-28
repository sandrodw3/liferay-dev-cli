import { walkSync } from 'std/walk'

import { getPortalPath } from 'liferay'
import { join } from 'tools'

const WALK_OPTIONS = {
	includeFiles: false,
	maxDepth: 2,
}

/**
 * Returns a list with all liferay modules sorted alphabetically
 */

export function getModules(): string[] {
	const portalPath = getPortalPath()

	const modules = [portalPath, join(portalPath, 'modules/test/playwright')]

	const apps = walkSync(join(portalPath, 'modules/apps'), WALK_OPTIONS)
	const dxpApps = walkSync(join(portalPath, 'modules/dxp/apps'), WALK_OPTIONS)

	for (const module of [...apps, ...dxpApps]) {
		if (!module.path.endsWith('apps')) {
			modules.push(module.path)
		}
	}

	modules.sort()

	return modules
}
