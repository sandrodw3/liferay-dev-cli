import { bold, dim, green, red } from 'std/colors'

import { getPortalPath } from 'liferay'
import { execute, getBaseName, join } from 'tools'
import { Result } from 'types'

export async function runBuildLang(): Promise<Result> {
	const portalPath = getPortalPath()

	const modulePath = join(
		portalPath,
		'/modules/apps/portal-language/portal-language-lang'
	)
	const moduleName = getBaseName(modulePath)

	Deno.chdir(modulePath)

	try {
		const gradlePath = join(getPortalPath(), 'gradlew')

		await execute(`${gradlePath} buildLang`)
	} catch {
		return {
			status: 'error',
			message: `${moduleName} ${dim('buildLang')} (${bold(
				red('error')
			)} occurred)`,
		}
	}

	return {
		status: 'success',
		message: `${moduleName} ${dim('buildLang')} (completed ${bold(
			green('successfully')
		)})`,
	}
}
