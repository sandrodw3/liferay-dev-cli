import { runCommand } from '@utils'

/**
 * Return the name of the current branch
 */

export async function getCurrentBranch(): Promise<string> {
	return await runCommand('git rev-parse --abbrev-ref HEAD')
}
