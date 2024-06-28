import { Confirm, Input, Secret, prompt } from 'cliffy/prompt'
import { bold, red, white, yellow } from 'std/colors'
import { existsSync } from 'std/exists'

import {
	CONFIG_PATH,
	ConfigEntry,
	getConfigEntry,
	readConfig,
	writeConfig,
} from 'config'
import { Client, configLogger } from 'mysql'
import { checkDbExists, createDb, join, log } from 'tools'

/**
 * Ask user for config and store it in .lfr/config file
 */

export async function setConfigValues(entries?: ConfigEntry[]) {
	let config

	try {
		config = await readConfig()
	} catch {
		config = {}
	}

	if (!config['portal.path']) {
		log(
			`Introduce data to ${bold(white('initialize'))} config. It will be ${bold(white('saved'))} in ${CONFIG_PATH}\n`
		)
	} else if (!entries?.length) {
		log(`Introduce ${bold(white('new'))} config values\n`)
	}

	const answers = await prompt([
		{
			before: async (_, next) => {
				if (entries?.length && !entries.includes('portal.path')) {
					await next(true)
				} else {
					await next()
				}
			},
			default: config?.['portal.path'],
			name: 'portal.path',
			message: 'Liferay portal path',
			type: Input,
			validate: (value) => {
				// Check it's actually a Liferay project

				if (existsSync(join(value, 'portal-web', 'portal-web.iml'))) {
					return true
				}

				return 'This is not a valid portal path'
			},
		},
		{
			before: async (_, next) => {
				if (entries?.length && !entries.includes('base.branch')) {
					await next(true)
				} else {
					await next()
				}
			},
			default: config?.['base.branch'] || 'master',
			name: 'base.branch',
			message: 'Base branch',
			type: Input,
		},
		{
			before: async (_, next) => {
				if (entries?.length && !entries.includes('mysql.user')) {
					await next(true)
				} else {
					await next()
				}
			},
			default: config?.['mysql.user'],
			name: 'mysql.user',
			message: 'MySQL User',
			minLength: 1,
			type: Input,
		},
		{
			before: async (_, next) => {
				if (entries?.length && !entries.includes('mysql.pw')) {
					await next(true)
				} else {
					await next()
				}
			},
			default: config?.['mysql.pw'],
			name: 'mysql.pw',
			message: 'MySQL Password',
			minLength: 1,
			type: Secret,
			after: async (answers, next) => {
				// Check connection is valid

				try {
					const client = await new Client().connect({
						username: answers['mysql.user'],
						password: answers['mysql.pw'],
					})

					configLogger({ enable: false })

					await client.execute(`SHOW DATABASES`)

					await next()
				} catch {
					log(
						`\n${bold(
							red('Could not connect')
						)} with these credentials, please try again\n`
					)

					await next('mysql.user')
				}
			},
		},
		{
			before: async (_, next) => {
				if (entries?.length && !entries.includes('mysql.db')) {
					await next(true)
				} else {
					await next()
				}
			},
			default: config?.['mysql.db'],
			name: 'mysql.db',
			message: 'Liferay portal database name',
			minLength: 1,
			type: Input,
			after: async (answers, next) => {
				const username =
					answers['mysql.user'] ||
					(await getConfigEntry('mysql.user'))

				const password =
					answers['mysql.pw'] || (await getConfigEntry('mysql.pw'))

				const exists = await checkDbExists({
					username,
					password,
					database: answers['mysql.db']!,
				})

				if (exists) {
					await next()

					return
				}

				if (
					await Confirm.prompt(
						`The database ${bold(yellow('does not exist'))}, do you want to create it?`
					)
				) {
					await createDb({
						username,
						password,
						database: answers['mysql.db']!,
					})
				} else {
					Deno.exit()
				}
			},
		},
	])

	try {
		const nextConfig = { ...config, ...answers }

		await writeConfig(nextConfig)

		log(
			`\nConfiguration was ${bold(white('correctly saved'))} in ${CONFIG_PATH}`
		)
		return nextConfig
	} catch {
		log(`\nConfiguration ${red('could not be saved')}, please try again`)

		Deno.exit(1)
	}
}
