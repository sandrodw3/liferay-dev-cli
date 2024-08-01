/**
 * Get latest version of lfr by checking with GitHub API
 */

export async function getLatestVersion() {
	try {
		const response = await fetch(
			'https://api.github.com/repos/sandrodw3/liferay-dev-cli/releases/latest',
			{
				signal: AbortSignal.timeout(2000),
			}
		)

		const { name } = await response.json()

		return name
	} catch {
		return null
	}
}
