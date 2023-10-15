import { blue, bold } from 'std/colors'

import { log, lookUp } from 'tools'

/**
 * Returns Liferay portal's root path and exits with error code
 * if it's not found
 */

export function getPortalRoot(): string {
	const portalRoot = lookUp('portal-web/docroot/WEB-INF/liferay-web.xml')

	if (!portalRoot) {
		log(`You are not in a ${bold(blue('Liferay'))} project 😔`)

		Deno.exit(1)
	}

	return portalRoot
}
