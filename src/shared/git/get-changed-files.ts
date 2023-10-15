import { join, runCommand } from 'tools'

/**
 * Return the list of files changed comparing to master.
 * Include also uncommited changes if includeUncommited
 * is true
 */

export async function getChangedFiles(
	{
		includeUncommited,
	}: {
		includeUncommited?: boolean
	} = { includeUncommited: false }
): Promise<string[]> {
	// Get commited files

	const commited = (await runCommand(`git diff --name-only HEAD master`))
		.split('\n')
		.filter(Boolean)

	// Return commited files if not including uncommited

	if (!includeUncommited) {
		return await prefix(commited)
	}

	// Get uncommited files and returns both lists

	const uncommited = (await runCommand('git status --porcelain'))
		.split('\n')
		.filter(Boolean)
		.map((file) => file.split(' ').pop()) as string[]

	return await prefix([...uncommited, ...commited])
}

/**
 * Prefix files with the current repository absolute path and
 * return a new array
 */

async function prefix(files: string[]) {
	const prefix = await runCommand('git rev-parse --show-toplevel')

	return files.map((file) => join(prefix, file))
}
