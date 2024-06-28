import { Input, Secret, prompt } from 'cliffy/prompt'
import { bold, red, white, yellow } from 'std/colors'
import { existsSync } from 'std/exists'

import { readConfig, writeConfig } from 'config'
import { Client, configLogger } from 'mysql'
import { join, log } from 'tools'
import { CONFIG_PATH } from './config.ts'

/**
 * Ask user for config and store it in .lfr/config file
 */

export async function setConfigValues() {
	const config = await readConfig()

	if (!config) {
		log(`Introduce data to ${bold(white('initialize'))} config\n`)
	} else {
		log(`Introduce ${bold(white('new'))} config values\n`)
	}

	const answers = await prompt([
		{
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
			default: config?.['base.branch'] || 'master',
			name: 'base.branch',
			message: 'Base branch',
			type: Input,
			after: async (_, next) => {
				log(
					`\n${bold('MySQL')} data (${bold(
						yellow('Optional')
					)}, press ENTER to skip)\n`
				)

				await next()
			},
		},
		{
			default: config?.['mysql.user'],
			name: 'mysql.user',
			message: 'MySQL User',
			type: Input,
			after: async (values, next) => {
				if (values['mysql.user']) {
					await next()
				} else {
					delete values['mysql.user']
					delete values['mysql.pw']
					delete values['mysql.db']
				}
			},
		},
		{
			default: config?.['mysql.pw'],
			name: 'mysql.pw',
			message: 'MySQL Password',
			type: Secret,
		},
		{
			default: config?.['mysql.db'],
			name: 'mysql.db',
			message: 'Liferay portal database name',
			type: Input,
			after: async (answers, next) => {
				// Check connection is valid

				try {
					const client = await new Client().connect({
						db: answers['mysql.db'],
						username: answers['mysql.user'],
						password: answers['mysql.pw'],
					})

					configLogger({ enable: false })

					await client.execute(`SHOW TABLES`)
				} catch {
					log(
						`\n${bold(
							red('Could not connect')
						)} with these credentials, please try again (press ENTER to skip)\n`
					)

					await next('mysql.user')
				}
			},
		},
	])

	try {
		await writeConfig(answers)

		log(
			`\nConfiguration was ${bold(white('correctly saved'))} in ${CONFIG_PATH}`
		)
	} catch {
		log(`\nConfiguration ${red('could not be saved')}, please try again`)

		Deno.exit(1)
	}
}
