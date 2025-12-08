import { Client as MySQLCLient, configLogger } from 'mysql'
import { Client as PostgreSQLClient } from 'postgres'
import { bold, red, white } from 'std/colors'

import { DBData } from 'liferay'
import { log, processDbError } from 'tools'

/**
 * Check if the given database exists and
 * ask the user if they want to create it
 */

export async function checkDbExists({
	username,
	password,
	database,
	type,
}: DBData) {
	try {
		if (type === 'mysql') {
			return await checkMySQLDatabase({ database, password, username })
		} else if (type === 'postgresql') {
			return await checkPostgreSQLDatabase({
				database,
				password,
				username,
			})
		}
	} catch (error) {
		const dbError = processDbError(error as Error)

		if (dbError === 'access-denied') {
			log(
				`${bold(white('Database credentials'))} in your ${bold(white('portal-ext.properties'))} are ${bold(
					red('incorrect')
				)}, please set correct ones and try again`
			)

			Deno.exit(1)
		}

		return false
	}
}

/**
 * Check whether a MySQL database exists or not
 */

async function checkMySQLDatabase({
	database,
	password,
	username,
}: Partial<DBData>) {
	const client = await new MySQLCLient().connect({
		username,
		password,
		db: database,
	})

	configLogger({ enable: false })

	await client.execute(`SHOW TABLES`)

	return true
}

/**
 * Check whether a PostgreSQL database exists or not
 */

async function checkPostgreSQLDatabase({
	database,
	password,
	username,
}: Partial<DBData>) {
	const client = new PostgreSQLClient({
		database,
		hostname: 'localhost',
		password,
		tls: { enabled: false },
		user: username,
	})

	await client.connect()

	await client.queryArray('SELECT 1')

	await client.end()

	return true
}
