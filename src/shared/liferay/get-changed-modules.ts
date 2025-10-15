import { getChangedFiles } from 'git'
import { getModuleType, ModuleType } from 'liferay'
import { lookUp } from 'tools'

type Props = { exclude?: ModuleType[]; include?: ModuleType[] }

/**
 * Return a list with the full path of the modules that have been
 * changed between current branch and base branch. Take into account
 * also uncommited changes
 */

export async function getChangedModules(): Promise<string[]>

export async function getChangedModules(props: {
	exclude: ModuleType[]
	include?: never
}): Promise<string[]>

export async function getChangedModules(props: {
	include: ModuleType[]
	exclude?: never
}): Promise<string[]>

export async function getChangedModules({
	exclude,
	include,
}: Props = {}): Promise<string[]> {
	const files = await getChangedFiles({ includeUncommited: true })

	const modules: string[] = []

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

	for (const file of files) {
		const module = lookUp('build.gradle', file)

		if (!module) {
			continue
		}

		const moduleType = await getModuleType(module)

		if (isIncluded(moduleType) && !modules.includes(module)) {
			modules.push(module)
		}
	}

	modules.sort(compareModules)

	return modules
}

/**
 * Compare two modules depending on the type
 */

function compareModules(moduleA: string, moduleB: string) {
	const weights = {
		test: 8,
		kernel: 7,
		frontend: 6,
		api: 5,
		impl: 4,
		service: 3,
		taglib: 2,
		web: 1,
	} as const

	let moduleAWeight = 0
	let moduleBWeight = 0

	for (const key of Object.keys(weights)) {
		if (moduleA.endsWith(key)) {
			moduleAWeight = weights[key as keyof typeof weights]
		}

		if (moduleB.endsWith(key)) {
			moduleBWeight = weights[key as keyof typeof weights]
		}
	}

	return moduleBWeight - moduleAWeight
}
