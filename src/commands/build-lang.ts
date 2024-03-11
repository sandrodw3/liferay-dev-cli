import { blue, bold, dim, white } from 'std/colors'

import { getPortalPath, runBuildLang } from 'liferay'
import { log, run } from 'tools'

/**
 * Executes buildLang in portal-language-lang module
 */

export async function buildLang() {
	// Check it's a Liferay project

	getPortalPath()

	log(
		`${bold(white('Executing buildLang'))} in ${bold(
			blue('portal-language-lang')
		)}\n`
	)

	await run({
		function: () => runBuildLang(),
		message: `portal-language-lang ${dim('buildLang')}`,
		callbacks: {
			error: () => Deno.exit(1),
		},
	})
}
