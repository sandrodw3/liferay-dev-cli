import { Input, Secret, prompt } from 'cliffy/prompt'
import { bold, red, white, yellow } from 'std/colors'
import { existsSync } from 'std/exists'

import { CONFIG_PATH } from 'config'
import { Client, configLogger } from 'mysql'
import { join, log } from 'tools'

/**
 * Ask user for config and store it in .lfrconfig file
 */

export async function initConfig() {
	log(`Introduce data to ${bold(white('initialize'))} config\n`)

	const { mysqlPw, mysqlUser, portalPath, portalDb } = await prompt([
		{
			name: 'portalPath',
			message: 'Liferay portal path',
			type: Input,
			validate: (value) => {
				// Check it's actually a Liferay project

				if (existsSync(join(value, 'portal-web', 'portal-web.iml'))) {
					return true
				}

				return 'This is not a valid portal path'
			},
			after: async (_, next) => {
				log(
					`\n${bold('MySQL')} data (${bold(
						yellow('Optional')
					)}, press Enter to skip)\n`
				)

				await next()
			},
		},
		{
			name: 'mysqlUser',
			message: 'MySQL User',
			type: Input,
			after: async ({ mysqlUser }, next) => {
				if (mysqlUser) {
					await next()
				}
			},
		},
		{
			name: 'mysqlPw',
			message: 'MySQL Password',
			type: Secret,
		},
		{
			name: 'portalDb',
			message: 'Liferay portal database name',
			type: Input,
			after: async ({ mysqlUser, mysqlPw, portalDb }, next) => {
				// Check connection is valid

				try {
					const client = await new Client().connect({
						db: portalDb,
						username: mysqlUser,
						password: mysqlPw,
					})

					configLogger({ enable: false })

					await client.execute(`SHOW TABLES`)
				} catch {
					log(
						`\n${bold(
							red('Could not connect')
						)} with these credentials, please try again\n`
					)

					await next('mysqlUser')
				}
			},
		},
	])

	try {
		await Deno.writeTextFile(
			CONFIG_PATH,
			JSON.stringify({
				'portal.path': portalPath,
				'portal.db': portalDb,
				'mysql.user': mysqlUser,
				'mysql.pw': mysqlPw,
			})
		)

		log(`\nConfiguration was ${bold(white('correctly saved'))}`)
	} catch {
		log(`\nConfiguration ${red('could not be saved')}, please try again`)

		Deno.exit(1)
	}
}
