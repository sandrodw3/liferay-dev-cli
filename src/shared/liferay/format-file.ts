import { bold, dim, green, red, yellow } from 'std/colors'

import { getParentModule } from 'liferay'
import { execute, getBaseName } from 'tools'
import { Result } from 'types'

/**
 * Formats the given file with liferay-npm-scripts prettier
 */

export async function formatFile(file: string): Promise<Result> {
	const fileName = getBaseName(file)
	const module = getParentModule(file)

	const command = 'liferay-npm-scripts prettier'

	if (!module) {
		return {
			status: 'warning',
			message: `${fileName} ${dim(
				'liferay-npm-scripts prettier'
			)} (not in a ${bold(yellow('Liferay'))} project)`,
		}
	}

	Deno.chdir(module)

	try {
		const result = await execute(`npx ${command} --write ${file}`)

		if (result.includes('UndefinedParserError')) {
			return {
				status: 'warning',
				message: `${fileName} ${dim(command)} (${bold(
					yellow('can not be formatted')
				)} with prettier)`,
			}
		}

		return {
			status: 'success',
			message: `${fileName} ${dim(command)} (formatted ${bold(
				green('successfully')
			)})`,
		}
	} catch {
		return {
			status: 'error',
			message: `${fileName} ${dim(command)} (${bold(
				red('could not be formatted')
			)})`,
		}
	}
}
