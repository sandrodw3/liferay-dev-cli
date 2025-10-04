import { getConfigEntry } from 'config'
import { runCommand } from 'tools'

type Commit = {
	sha: string
	content: string
}

/**
 * Return a list of the commits in the current branch comparing with base branch
 */

export async function getBranchCommits(): Promise<Commit[]> {
	const baseBranch = await getConfigEntry('base.branch')

	const output = await runCommand(
		`git log ${baseBranch}..HEAD "--pretty=format:%H %s"`
	)

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
		.reverse()

	return commits
}
