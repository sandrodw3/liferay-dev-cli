import { runAsyncFunction, runCommand } from 'sdw3/lab/exec'
import { dim } from 'std/colors'

import { getConfigEntry } from '@lib/config'
import { join } from '@lib/utils'

/**
 * Execute buildLang in portal-language-lang module
 */

export async function runBuildLang() {
	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')

	const modulePath = join(
		portalPath,
		'modules/apps/portal-language/portal-language-lang'
	)

	Deno.chdir(modulePath)

	await runAsyncFunction({
		fn: async () => {
			await runCommand(`${gradlePath} buildLang`)
		},
		text: `portal-language-lang ${dim('buildLang')}`,
	})
}
