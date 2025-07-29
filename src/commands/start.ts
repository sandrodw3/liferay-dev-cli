import { blue, bold, dim, white, yellow } from 'std/colors'

import { Confirm } from 'cliffy/prompt'
import { getConfigEntry } from 'config'
import { DBData, getBundlesPath, getDBData, getLatestTomcatPath } from 'liferay'
import {
	checkDbExists,
	cleanDb,
	createDb,
	folderExists,
	getBaseName,
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
	const bundlesPath = await getBundlesPath()
	const tomcatPath = await getLatestTomcatPath()
	const dbData = await getDBData()

	if (!folderExists(bundlesPath)) {
		log(
			`There's ${bold(yellow('no bundles folder'))}, an ${bold(
				yellow('ant all')
			)} may be required`
		)

		Deno.exit(1)
	}

	// Check correct data is set in portal-ext.properties

	const { database, username, password, type } = dbData

	if (!username || !password || !database || !type) {
		log(
			`To start portal you need to ${bold(yellow('set correct database data'))} in your ${bold(
				white('portal-ext.properties')
			)} file inside ${bold(white('bundles'))}`
		)

		Deno.exit(1)
	}

	// Create database if it does not exist

	const dbExists = await checkDbExists(dbData)

	if (!dbExists) {
		if (
			await Confirm.prompt(
				`The database specified in your ${bold(white('portal-ext.properties'))} (${dbData.database}) ${bold(yellow('does not exist'))}, do you want to create it?`
			)
		) {
			log('')

			await runAsyncFunction({
				fn: async () => await createDb(dbData),
				text: `${portalName} ${dim('Create database')}`,
			})

			log('')
		} else {
			Deno.exit(1)
		}
	}

	// Show description

	let description = `${bold(white('Starting'))} ${bold(
		blue(portalName)
	)} with latest tomcat version (${bold(white(getBaseName(tomcatPath)))})`

	description = description.concat(
		clean ? ` and ${bold(white('cleaning database\n'))}` : '\n'
	)

	log(description)

	// Clean database if specified

	if (clean) {
		await cleanLiferayDb({ username, password, database, type })

		log('')
	}

	// Start

	Deno.chdir(join(tomcatPath, 'bin'))

	await runCommand('./catalina.sh jpda run', { spawn: true })
}

/**
 * Clean a Liferay db
 */

async function cleanLiferayDb(dbData: DBData) {
	const portalPath = await getConfigEntry('portal.path')
	const portalName = getBaseName(portalPath)

	await runAsyncFunction({
		fn: async () => await cleanDb(dbData),
		text: `${portalName} ${dim('Clean database')}`,
	})
}
