import { Client as MySQLClient, configLogger } from 'mysql'
import { Client as PostgreSQLClient } from 'postgres'
import { bold, red, white } from 'std/colors'

import { DBData } from 'liferay'
import { processDbError } from 'tools'

/**
 * Clean (delete and create) the given database
 */

export async function cleanDb({ username, password, database, type }: DBData) {
	try {
		if (type === 'mysql') {
			await cleanMySQLDb({ username, password, database })
		} else if (type === 'postgresql') {
			await cleanPostgreSQLDb({
				username,
				password,
				database,
			})
		}
	} catch (error) {
		const dbError = processDbError(error as Error)

		if (dbError === 'access-denied') {
			throw new Error(
				`(${bold(
					red('access denied')
				)}, please set correct database credentials in your ${bold(
					white('portal-ext.properties')
				)} and try again)`
			)
		} else if (dbError === 'unknown-database') {
			throw new Error(
				`(${bold(red('unknown database'))}, set correct one in your ${bold(
					white('portal-ext.properties')
				)} and try again)`
			)
		}

		throw new Error()
	}
}

/**
 * Clean a MySQL database
 */

async function cleanMySQLDb({ database, password, username }: Partial<DBData>) {
	// Connect, drop database and recreate it

	const client = await new MySQLClient().connect({
		username,
		password,
	})

	configLogger({ enable: false })

	await client.execute(`DROP DATABASE ${database}`)

	await client.execute(
		`CREATE DATABASE ${database} CHARACTER SET utf8 COLLATE utf8_general_ci`
	)
}

/**
 * Clean a PostgreSQL database
 */

async function cleanPostgreSQLDb({
	database,
	password,
	username,
}: Partial<DBData>) {
	// Connect, drop database and recreate it

	const client = new PostgreSQLClient({
		hostname: 'localhost',
		user: username,
		database: 'postgres',
		password,
		tls: { enabled: false },
	})

	await client.connect()

	await client.queryArray(`DROP DATABASE ${database}`)

	await client.queryArray(`CREATE DATABASE ${database}`)

	await client.end()
}
