import { getChangedFiles } from 'git'
import { getParentModule } from 'liferay'

/**
 * Return a list with the full path of the modules that have been
 * changed between current branch and base branch. Take into account
 * also uncommited changes
 */

export async function getChangedModules(): Promise<string[]> {
	const files = await getChangedFiles({ includeUncommited: true })

	const modules: string[] = []

	for (const file of files) {
		const module = getParentModule(file)

		if (module && !modules.includes(module)) {
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
		if (moduleA.includes(key)) {
			moduleAWeight = weights[key as keyof typeof weights]
		}

		if (moduleB.includes(key)) {
			moduleBWeight = weights[key as keyof typeof weights]
		}
	}

	return moduleBWeight - moduleAWeight
}
