import { runCommand } from 'sdw3/lab/exec'
import { getBaseName } from 'sdw3/lab/path'
import { blue, bold, white } from 'std/colors'

import { getConfigEntry } from '@lib/config'
import { getModuleType } from '@lib/liferay'
import { log } from '@lib/utils'

type Props = {
	command: string
	currentBranch?: boolean
	global?: boolean
	localChanges?: boolean
}

/**
 * Run a node-scripts command, either globally (from modules) or in the current
 * project
 */

export async function nodeScripts({
	command,
	currentBranch,
	global,
	localChanges,
}: Props) {
	const portalPath = await getConfigEntry('portal.path')

	const module = Deno.cwd()
	const moduleName = getBaseName(module)
	const moduleType = await getModuleType(module)

	if (!moduleType && !global) {
		log(
			`You must either move to a ${bold(white('Liferay module'))} or run the command with ${bold(white('--global'))}`
		)

		Deno.exit(1)
	}

	if (global) {
		Deno.chdir(`${portalPath}/modules`)
	}

	const cmd = `npx node-scripts ${command}${currentBranch ? ' --current-branch' : ''}${localChanges ? ' --local-changes' : ''}`

	let description = `Running ${bold(white(cmd))} command`

	if (global) {
		description = description.concat(
			` globally in ${bold(blue('modules'))}\n`
		)
	} else {
		description = description.concat(` in ${bold(blue(moduleName))}\n`)
	}

	log(description)

	await runCommand(cmd, { spawn: true })

	return
}
