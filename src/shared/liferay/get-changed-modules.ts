import { getChangedFiles } from 'git'
import { lookUp } from 'tools'

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
		const module = lookUp('build.gradle', file)

		if (module && !modules.includes(module)) {
			modules.push(module)
		}
	}

	return modules
}
