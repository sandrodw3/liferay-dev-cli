import { Client, configLogger } from 'mysql'
import { blue, bold, dim, magenta, red, white, yellow } from 'std/colors'
import { existsSync } from 'std/exists'
import { walkSync } from 'std/walk'

import { getConfigEntry } from 'config'
import {
	getBaseName,
	goUp,
	join,
	log,
	runAsyncFunction,
	runCommand,
} from 'tools'

type Props = {
	clean?: boolean
}

/**
 * Start portal with latest tomcat version
 */

export async function start({ clean }: Props) {
	// Check bundles folder exists

	const portalPath = await getConfigEntry('portal.path')
	const portalName = getBaseName(portalPath)
	const bundlesPath = join(goUp(portalPath), 'bundles')

	if (!folderExists(bundlesPath)) {
		log(
			`There's ${bold(yellow('no bundles folder'))}, an ${bold(
				yellow('ant all')
			)} may be required`
		)
	}

	let description = `${bold(white('Starting'))} ${bold(
		blue(portalName)
	)} with latest tomcat version`

	description = description.concat(
		clean ? ` and ${bold(white('recreating database\n'))}` : '\n'
	)

	log(description)

	// Clean database if specified

	if (clean) {
		await cleanLiferayDb()

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

	if (!folderExists(latestTomcatFolder)) {
		log(
			`There's ${bold(yellow('no tomcat folder'))}, an ${bold(
				yellow('ant all')
			)} may be required`
		)
	}

	Deno.chdir(join(latestTomcatFolder!, 'bin'))

	await runCommand('./catalina.sh jpda run', { spawn: true })
}

/**
 * Check folder exists or not
 */

function folderExists(folder?: string) {
	return folder && existsSync(folder)
}

/**
 * Clean a Liferay db
 */

async function cleanLiferayDb() {
	const portalPath = await getConfigEntry('portal.path')
	const portalName = getBaseName(portalPath)

	const username = await getConfigEntry('mysql.user')
	const password = await getConfigEntry('mysql.pw')
	const database = await getConfigEntry('portal.db')

	await runAsyncFunction({
		fn: async () => {
			try {
				const client = await new Client().connect({
					db: database,
					username,
					password,
				})

				configLogger({ enable: false })

				await client.execute(`DROP DATABASE ${database}`)
				await client.execute(
					`CREATE DATABASE ${database} CHARACTER SET utf8 COLLATE utf8_general_ci`
				)
			} catch (error) {
				if (error.message.includes('Access denied')) {
					throw new Error(
						`(${bold(
							red('access denied')
						)}, please set correct MySQL credentials with ${bold(
							magenta('lfr config')
						)} and try again)`
					)
				} else if (error.message.includes('Unknown database')) {
					throw new Error(
						`(${bold(
							red('unknown database')
						)}, set correct one with ${bold(
							magenta('lfr config')
						)} and try again)`
					)
				}

				throw new Error()
			}
		},
		text: `${portalName} ${dim('Recreate database')}`,
	})
}
