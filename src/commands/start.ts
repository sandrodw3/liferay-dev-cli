import { Client, configLogger } from 'mysql'
import { blue, bold, dim, magenta, red, white, yellow } from 'std/colors'
import { walkSync } from 'std/walk'

import { getConfigEntry, setConfigValues } from 'config'
import {
	checkDbExists,
	folderExists,
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
		clean ? ` and ${bold(white('cleaning database\n'))}` : '\n'
	)

	log(description)

	// Clean database if specified

	if (clean) {
		let username = await getConfigEntry('mysql.user')
		let password = await getConfigEntry('mysql.pw')
		let database = await getConfigEntry('mysql.db')

		if (!username || !password || !database) {
			log(
				`To clean database, first save your ${bold(white('MySQL credentials'))}\n`
			)

			const config = await setConfigValues([
				'mysql.user',
				'mysql.pw',
				'mysql.db',
			])

			if (!config) {
				return
			}

			username = config['mysql.user']!
			password = config['mysql.pw']!
			database = config['mysql.db']!

			log('')
		}

		await cleanLiferayDb(username, password, database)

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
 * Clean a Liferay db
 */

async function cleanLiferayDb(
	username: string,
	password: string,
	database: string
) {
	const portalPath = await getConfigEntry('portal.path')
	const portalName = getBaseName(portalPath)

	const dbExists = await checkDbExists({ username, password, database })

	if (!dbExists) {
		log(`Introduce your Liferay portal ${bold(white('database name'))}\n`)

		await setConfigValues(['mysql.db'])

		log('')
	}

	await runAsyncFunction({
		fn: async () => {
			try {
				// Connect, drop database and recreate it

				const client = await new Client().connect({
					username,
					password,
				})

				configLogger({ enable: false })

				await client.execute(`DROP DATABASE ${database}`)

				await client.execute(
					`CREATE DATABASE ${database} CHARACTER SET utf8 COLLATE utf8_general_ci`
				)
			} catch (error) {
				const { message } = error as Error

				if (message.includes('Access denied')) {
					throw new Error(
						`(${bold(
							red('access denied')
						)}, please set correct MySQL credentials with ${bold(
							magenta('lfr config')
						)} and try again)`
					)
				} else if (message.includes('Unknown database')) {
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
		text: `${portalName} ${dim('Clean database')}`,
	})
}
