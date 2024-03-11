import { blue, bold, dim, white } from 'std/colors'

import { getConfigEntry } from 'config'
import { getBaseName, join, log, runAsyncFunction, runCommand } from 'tools'

/**
 * Execute buildLang in portal-language-lang module
 */

export async function buildLang() {
	log(
		`${bold(white('Executing buildLang'))} in ${bold(
			blue('portal-language-lang')
		)}\n`
	)

	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')

	const modulePath = join(
		portalPath,
		'/modules/apps/portal-language/portal-language-lang'
	)
	const moduleName = getBaseName(modulePath)

	Deno.chdir(modulePath)

	await runAsyncFunction({
		fn: async () => {
			await runCommand(`${gradlePath} buildLang`)
		},
		text: `${moduleName} ${dim('buildLang')}`,
	})
}
