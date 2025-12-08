import { getConfigEntry } from 'config'
import { runCommand } from 'tools'

type Commit = {
	sha: string
	content: string
}

/**
 * Return a list of the commits in the current branch comparing with base branch
 */

export async function getBranchCommits(
	{ order }: { order: 'ascending' | 'descending' } = { order: 'ascending' }
): Promise<Commit[]> {
	const baseBranch = await getConfigEntry('base.branch')

	let cmd = `git log ${baseBranch}..HEAD "--pretty=format:%H %s"`

	if (order === 'ascending') {
		cmd += ' --reverse'
	}

	const output = await runCommand(cmd)

	const commits: Commit[] = output
		.split('\n')
		.filter(Boolean)
		.map((line) => {
			const [sha, ...rest] = line.trim().split(' ')

			const content = rest.join(' ').trim()

			return {
				sha: sha.trim(),
				content,
			}
		})

	return commits
}
