import { Client as MySQLClient, configLogger } from 'mysql'
import { Client as PostgreSQLClient } from 'postgres'
import { bold, red, white } from 'std/colors'

import { DBData } from 'liferay'
import { log, processDbError } from 'tools'

/**
 * Creates a database with the given name
 */

export async function createDb({ username, password, database, type }: DBData) {
	try {
		if (type === 'mysql') {
			await createMySQLDb({ username, password, database })
		} else if (type === 'postgresql') {
			await createPostgreSQLDb({ username, password, database })
		}
	} catch (error) {
		const dbError = processDbError(error as Error)

		if (dbError === 'access-denied') {
			log(
				`${bold(white('Database credentials'))} in your ${bold(white('portal-ext.properties'))} are ${bold(
					red('incorrect')
				)}, please set correct ones and try again`
			)
		} else {
			log(
				`An ${bold(red('error'))} occurred while ${bold(white('creating the database'))}, please try again later`
			)
		}

		Deno.exit(1)
	}
}

/**
 * Create a PostgreSQL database
 */

async function createMySQLDb({
	database,
	password,
	username,
}: Partial<DBData>) {
	const client = await new MySQLClient().connect({ username, password })

	configLogger({ enable: false })

	await client.execute(
		`CREATE DATABASE \`${database}\` CHARACTER SET utf8 COLLATE utf8_general_ci`
	)
}

/**
 * Create a PostgreSQL database
 */

async function createPostgreSQLDb({
	database,
	password,
	username,
}: Partial<DBData>) {
	const client = new PostgreSQLClient({
		hostname: 'localhost',
		user: username,
		database: 'postgres',
		password,
		tls: { enabled: false },
	})

	await client.connect()

	await client.queryArray(`CREATE DATABASE "${database}"`)

	await client.end()
}
