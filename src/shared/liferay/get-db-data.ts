import { findProperty, getBundlesPath } from 'liferay'
import { join } from 'tools'

export type DBData = {
	database: string
	username: string
	password: string
	type: 'mysql' | 'postgresql' | null
}

/**
 * Get database data from portal-ext.properties file
 */

export async function getDBData(): Promise<DBData> {
	const bundlesPath = await getBundlesPath()

	const propertiesPath = join(bundlesPath, 'portal-ext.properties')

	const driver = await findProperty(
		propertiesPath,
		'jdbc.default.driverClassName'
	)

	const type = driver.includes('mysql')
		? 'mysql'
		: driver.includes('postgresql')
			? 'postgresql'
			: null

	const username = await findProperty(propertiesPath, 'jdbc.default.username')
	const password = await findProperty(propertiesPath, 'jdbc.default.password')

	const url = await findProperty(propertiesPath, 'jdbc.default.url')
	const database = getDatabaseName(url)

	return { database, password, type, username }
}

/**
 * Get database name from jdbc url
 */

function getDatabaseName(url: string) {
	const slashIndex = url.lastIndexOf('/')

	const queryIndex = url.indexOf('?', slashIndex)

	if (queryIndex === -1) {
		return url.substring(slashIndex + 1)
	}

	return url.substring(slashIndex + 1, queryIndex)
}
