import { Input, Secret, prompt } from 'cliffy/prompt'
import { blue, bold, dim, white, yellow } from 'std/colors'
import { existsSync } from 'std/exists'
import { walkSync } from 'std/walk'

import { cleanLiferayDb, getPortalPath } from 'liferay'
import { getBaseName, goUp, join, log, run, spawn } from 'tools'

type Props = {
	clean?: boolean
}

/**
 * Starts portal with latest tomcat version
 */

export async function start({ clean }: Props) {
	// Check bundles folder exists

	const portalPath = getPortalPath()
	const portalName = getBaseName(getPortalPath())
	const bundlesPath = join(goUp(portalPath), 'bundles')

	checkFolderExists(bundlesPath)

	let description = `${bold(white('Starting'))} ${bold(
		blue(portalName)
	)} with latest tomcat version`

	description = description.concat(
		clean ? ` and ${bold(white('recreating database\n'))}` : '\n'
	)

	log(description)

	// Clean database if specified

	if (clean) {
		const { username, password, database } = await prompt([
			{
				name: 'username',
				message: 'Introduce your mysql username',
				type: Input,
			},
			{
				name: 'password',
				message: 'Introduce your mysql password',
				type: Secret,
			},
			{
				name: 'database',
				message: 'Introduce your liferay portal database name',
				type: Input,
			},
		])

		log('')

		await run({
			function: () => cleanLiferayDb(username, password, database),
			message: `${portalName} ${dim('Recreate database')}`,
			callbacks: {
				error: () => Deno.exit(1),
			},
		})

		log('')
	}

	// Get all tomcat folders

	const folders = walkSync(bundlesPath, {
		includeFiles: false,
		maxDepth: 1,
	})

	const tomcatFolders = []

	for (const folder of folders) {
		if (folder.name.includes('tomcat')) {
			tomcatFolders.push(folder.path)
		}
	}

	// Get latest tomcat folder

	tomcatFolders.sort()

	const latestTomcatFolder = tomcatFolders.pop()

	checkFolderExists(latestTomcatFolder)

	Deno.chdir(join(latestTomcatFolder!, 'bin'))

	await spawn('./catalina.sh jpda run')
}

/**
 * Check folder exists and exit if not
 */

function checkFolderExists(folder?: string) {
	if (!folder || !existsSync(folder)) {
		log(
			`There's ${bold(yellow('no tomcat folder'))}, an ${bold(
				yellow('ant all')
			)} may be required`
		)

		Deno.exit(1)
	}
}
