import { execute } from 'tools'

/**
 * Returns the name of the current branch
 */

export async function getCurrentBranch(): Promise<string> {
	return await execute('git rev-parse --abbrev-ref HEAD')
}
