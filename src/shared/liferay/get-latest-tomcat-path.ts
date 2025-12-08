import { bold, yellow } from 'std/colors'
import { walkSync } from 'std/walk'

import { getBundlesPath } from 'liferay'
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
			const versionA = a
				.slice(a.lastIndexOf('-') + 1)
				.split('.')
				.map(Number)

			const versionB = b
				.slice(b.lastIndexOf('-') + 1)
				.split('.')
				.map(Number)

			for (let i = 0; i < versionA.length; i++) {
				if (versionA[i] !== versionB[i]) {
					return versionA[i] - versionB[i]
				}
			}

			return 0
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
