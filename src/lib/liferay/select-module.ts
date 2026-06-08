import { getBaseName } from 'sdw3/lab/path'
import { fuzzySelect } from 'sdw3/lab/prompt'
import { walkSync } from 'std/walk'

import { getConfigEntry } from '@lib/config'
import { ModuleType, ROOT_MODULES, getModuleType } from '@lib/liferay'
import { goUp, join } from '@lib/utils'

const WALK_OPTIONS = {
	includeFiles: false,
	maxDepth: 3,
}

type Props = {
	exclude?: ModuleType[]
	include?: ModuleType[]
	message?: string
}

/**
 * Allow selecting a Liferay module with fuzzy search.
 * Module types can be excluded from the list
 */

export async function selectModule(props?: {
	message?: string
}): Promise<string | null>

export async function selectModule(props: {
	exclude: ModuleType[]
	include?: never
	message?: string
}): Promise<string | null>

export async function selectModule(props: {
	include: ModuleType[]
	exclude?: never
	message?: string
}): Promise<string | null>

export async function selectModule({
	exclude,
	include,
	message = 'Select a module',
}: Props = {}): Promise<string | null> {
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

	// Search by base name, show the parent path to disambiguate repeated names

	const options = modules.map((module) => ({
		value: module,
		label: getBaseName(module),
		description: goUp(module).split('/modules/').pop(),
	}))

	return fuzzySelect({
		message,
		options,
	})
}
