import { existsSync } from 'std/exists'

import { getConfigEntry } from 'config'
import { ROOT_MODULES } from 'liferay'
import { getBaseName, join } from 'tools'

export type ModuleType =
	| 'standard-module'
	| 'parent-module'
	| 'test-module'
	| 'service-module'
	| 'root'
	| 'root-module'
	| 'playwright'

/**
 * Return type of the given module
 */

export async function getModuleType(
	module: string
): Promise<ModuleType | null> {
	const portalPath = await getConfigEntry('portal.path')

	if (module === portalPath) {
		return 'root'
	} else if (isRootModule(module)) {
		return 'root-module'
	} else if (module.endsWith('test/playwright')) {
		return 'playwright'
	} else if (
		existsSync(join(module, 'build.gradle')) &&
		module.endsWith('test')
	) {
		return 'test-module'
	} else if (
		existsSync(join(module, 'service.xml')) &&
		module.endsWith('service')
	) {
		return 'service-module'
	} else if (isParentModule(module)) {
		return 'parent-module'
	} else if (existsSync(join(module, 'build.gradle'))) {
		return 'standard-module'
	}

	return null
}

/**
 * Check whether a module is a parent module or not
 */

function isParentModule(module: string) {
	const moduleName = getBaseName(module)

	for (const entry of Deno.readDirSync(module)) {
		if (entry.name.startsWith(`${moduleName}-`) && !entry.isFile) {
			return true
		}
	}

	return false
}

/**
 * Check whether a module is a root module or not
 */

function isRootModule(module: string) {
	return ROOT_MODULES.some((rootModule) => module.includes(rootModule))
}
