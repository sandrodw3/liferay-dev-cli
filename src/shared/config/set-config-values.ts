import { Input, prompt } from 'cliffy/prompt'
import { bold, red, white } from 'std/colors'
import { existsSync } from 'std/exists'

import { CONFIG_PATH, ConfigEntry, readConfig, writeConfig } from 'config'
import { join, log } from 'tools'

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

				if (!existsSync(join(value, 'portal-web', 'portal-web.iml'))) {
					return 'This is not a valid portal path'
				}

				return true
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
	])

	try {
		await writeConfig({
			...config,
			...answers,
		})

		log(
			`\nConfiguration was ${bold(white('correctly saved'))} in ${CONFIG_PATH}`
		)
	} catch {
		log(`\nConfiguration ${red('could not be saved')}, please try again`)

		Deno.exit(1)
	}
}
