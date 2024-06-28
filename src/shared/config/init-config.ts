import { Input, Secret, prompt } from 'cliffy/prompt'
import { bold, red, white, yellow } from 'std/colors'
import { existsSync } from 'std/exists'

import { writeConfig } from 'config'
import { Client, configLogger } from 'mysql'
import { join, log } from 'tools'

/**
 * Ask user for config and store it in .lfr/config file
 */

export async function initConfig() {
	log(`Introduce data to ${bold(white('initialize'))} config\n`)

	const answers = await prompt([
		{
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
			name: 'base.branch',
			message: 'Base branch',
			default: 'master',
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
			name: 'mysql.pw',
			message: 'MySQL Password',
			type: Secret,
		},
		{
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

		log(`\nConfiguration was ${bold(white('correctly saved'))}`)
	} catch {
		log(`\nConfiguration ${red('could not be saved')}, please try again`)

		Deno.exit(1)
	}
}
