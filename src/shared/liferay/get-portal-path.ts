import { blue, bold, yellow } from 'std/colors'

import { log, lookUp } from 'tools'

/**
 * Returns Liferay portal's path and exits with error code
 * if it's not found
 */

export function getPortalPath(): string {
	// Check if user is currently in a Liferay project and returns the path
	const portalPath = lookUp('portal-web/docroot/WEB-INF/liferay-web.xml')

	if (portalPath) {
		return portalPath
	}

	// Check LIFERAY_PORTAL_PATH env variable and returns it
	const envPortalPath = Deno.env.get('LIFERAY_PORTAL_PATH')

	if (envPortalPath) {
		return envPortalPath
	}

	// No Liferay project nor env variable
	log(
		`You ${bold(yellow('are not'))} in a ${bold(
			blue('Liferay')
		)} project and do not have a ${bold(
			blue('LIFERAY_PORTAL_PATH')
		)} env variable either`
	)

	Deno.exit(1)
}
