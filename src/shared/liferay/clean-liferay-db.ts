import { Client, configLogger } from 'mysql'
import { bold, dim, green, red } from 'std/colors'

import { getPortalPath } from 'liferay'
import { getBaseName } from 'tools'
import { Result } from 'types'

export async function cleanLiferayDb(
	username?: string,
	password?: string,
	database?: string
): Promise<Result> {
	const portalName = getBaseName(getPortalPath())

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
			return {
				status: 'error',
				message: `${portalName} ${dim('Recreate database')} (${bold(
					red('access denied')
				)}, please try again with correct config)`,
			}
		} else if (error.message.includes('Unknown database')) {
			return {
				status: 'error',
				message: `${portalName} ${dim('Recreate database')} (${bold(
					red('unknown database')
				)}, please create it and try again)`,
			}
		}

		return {
			status: 'error',
			message: `${portalName} ${dim('Recreate database')} (${bold(
				red('error')
			)} occurred, please try again)`,
		}
	}

	return {
		status: 'success',
		message: `${portalName} ${dim('Recreate database')} (completed ${bold(
			green('successfully')
		)})`,
	}
}
