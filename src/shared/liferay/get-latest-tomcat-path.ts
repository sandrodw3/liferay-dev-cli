import { getBundlesPath } from 'liferay'
import { bold, yellow } from 'std/colors'
import { walkSync } from 'std/walk'
import { folderExists, log } from 'tools'

/**
 * Return the path of the latest tomcat
 */

export async function getLatestTomcatPath(): Promise<string> {
	const bundlesPath = await getBundlesPath()

	// Get all tomcat folders

	const folders = walkSync(bundlesPath, {
		includeFiles: false,
		maxDepth: 1,
		match: [/tomcat/],
	})

	// Get latest

	const paths = [...folders]
		.map((folder) => folder.path)
		.sort((a, b) => {
			const versionA = Number(a.slice(a.lastIndexOf('.') + 1))
			const versionB = Number(b.slice(b.lastIndexOf('.') + 1))

			return versionA - versionB
		})

	const latest = paths.pop()

	if (!latest || !folderExists(latest)) {
		log(
			`There's ${bold(yellow('no tomcat folder'))}, an ${bold(
				yellow('ant all')
			)} may be required`
		)

		Deno.exit(1)
	}

	return latest
}
