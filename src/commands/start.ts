import { Confirm } from 'cliffy/prompt'
import { blue, bold, dim, white, yellow } from 'std/colors'
import { existsSync } from 'std/exists'

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
			await Confirm.prompt({
				message: `The database specified in your ${bold(white('portal-ext.properties'))} (${dbData.database}) ${bold(yellow('does not exist'))}, do you want to create it?`,
				prefix: `${yellow('→')} `,
			})
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
		clean
			? ` and ${bold(white('cleaning database and data folders\n'))}`
			: '\n'
	)

	log(description)

	// Clean database if specified

	if (clean) {
		await cleanLiferayDb({ username, password, database, type })

		log('')

		await cleanDataFolders()

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

/**
 * Clean folders with temp data
 */

async function cleanDataFolders() {
	const portalPath = await getConfigEntry('portal.path')
	const portalName = getBaseName(portalPath)

	const bundlesPath = await getBundlesPath()
	const tomcatPath = await getLatestTomcatPath()
	const tomcatName = getBaseName(tomcatPath)

	const removeIfExists = async (path: string) => {
		if (!existsSync(path)) {
			return
		}

		await Deno.remove(path, { recursive: true })
	}

	await runAsyncFunction({
		fn: async () => await removeIfExists(join(bundlesPath, 'data')),
		text: `${portalName} ${dim('Remove bundles/data')}`,
	})

	await runAsyncFunction({
		fn: async () => await removeIfExists(join(bundlesPath, 'work')),
		text: `${portalName} ${dim('Remove bundles/work')}`,
	})

	await runAsyncFunction({
		fn: async () => await removeIfExists(join(bundlesPath, 'osgi/state')),
		text: `${portalName} ${dim('Remove bundles/osgi/state')}`,
	})

	await runAsyncFunction({
		fn: async () => await removeIfExists(join(tomcatPath, 'temp')),
		text: `${portalName} ${dim(`Remove bundles/${tomcatName}/temp`)}`,
	})

	await runAsyncFunction({
		fn: async () => await removeIfExists(join(tomcatPath, 'work')),
		text: `${portalName} ${dim(`Remove bundles/${tomcatName}/work`)}`,
	})
}
