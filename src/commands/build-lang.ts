import { blue, bold, white } from 'std/colors'

import { runBuildLang } from '@lib/liferay'
import { log } from '@lib/utils'

/**
 * Execute buildLang in portal-language-lang module
 */

export async function buildLang() {
	log(
		`${bold(white('Executing buildLang'))} in ${bold(
			blue('portal-language-lang')
		)}\n`
	)

	await runBuildLang()
}
