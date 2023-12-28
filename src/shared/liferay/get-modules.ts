import { walk } from 'std/walk'

import { getPortalRoot } from 'liferay'
import { join } from 'tools'

const WALK_OPTIONS = {
	includeFiles: false,
	maxDepth: 2,
}

/**
 * Returns a list with all liferay modules
 */

export async function getModules(): Promise<string[]> {
	const portalRoot = getPortalRoot()

	const modules = [
		portalRoot,
		join(portalRoot, 'portal-web'),
		join(portalRoot, 'portal-impl'),
		join(portalRoot, 'portal-kernel'),
	]

	const apps = walk(join(portalRoot, 'modules/apps'), WALK_OPTIONS)
	const dxpApps = walk(join(portalRoot, 'modules/dxp/apps'), WALK_OPTIONS)

	for await (const module of apps) {
		modules.push(module.path)
	}

	for await (const module of dxpApps) {
		modules.push(module.path)
	}

	return modules
}
