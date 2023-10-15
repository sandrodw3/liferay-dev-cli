import { execute, join } from 'tools'

/**
 * Returns the list of files changed comparing to master.
 * It includes also uncommited changes if includeUncommited
 * is true
 */

export async function getChangedFiles(
	includeUncommited = false
): Promise<string[]> {
	// Get commited files

	const commited = (await execute(`git diff --name-only HEAD master`))
		.split('\n')
		.filter(Boolean)

	// Return commited files if not including uncommited

	if (!includeUncommited) {
		return await prefix(commited)
	}

	// Get uncommited files and returns both lists

	const uncommited = (await execute('git status --porcelain'))
		.split('\n')
		.filter(Boolean)
		.map((file) => file.split(' ').pop()) as string[]

	return await prefix([...uncommited, ...commited])
}

/**
 * Prefixes files with the current repository absolute path and
 * returns a new array
 */

async function prefix(files: string[]) {
	const prefix = await execute('git rev-parse --show-toplevel')

	return files.map((file) => join(prefix, file))
}
