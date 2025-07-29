import { getConfigEntry } from 'config'
import { findProperty } from 'liferay'
import { folderExists, goUp, join, runCommand } from 'tools'

/**
 * Return the path of the bundles folder
 */

export async function getBundlesPath(): Promise<string> {
	const portalPath = await getConfigEntry('portal.path')

	let bundlesPath: string

	// Try with app.server.[user].properties

	const user = await runCommand('whoami')

	bundlesPath = await findBundlesPath(`app.server.${user}.properties`)

	if (folderExists(bundlesPath)) {
		return bundlesPath
	}

	// Try with default app.server.properties

	bundlesPath = await findBundlesPath(`app.server.properties`)

	if (folderExists(bundlesPath)) {
		return bundlesPath
	}

	// Return default bundles path

	return join(goUp(portalPath), 'bundles')
}

/**
 * Look for bundles path in the given app.server.properties file
 */

async function findBundlesPath(fileName: string) {
	const portalPath = await getConfigEntry('portal.path')

	const path = await findProperty(
		join(portalPath, fileName),
		'app.server.parent.dir'
	)

	return path.replace('${project.dir}', portalPath)
}
