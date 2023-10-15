import { getChangedFiles } from 'git'
import { getParentModule } from 'liferay'

/**
 * Returns a list with the full path of the modules that have been
 * changed between current branch and master.It takes into account
 * also uncommited changes if includeUncommited is true
 */

export async function getChangedModules(
	includeUncommited = false
): Promise<string[]> {
	const files = await getChangedFiles(includeUncommited)

	const modules: string[] = []

	for (const file of files) {
		const module = getParentModule(file)

		if (module && !modules.includes(module)) {
			modules.push(module)
		}
	}

	return modules
}
