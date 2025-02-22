import { blue, bold, white } from 'std/colors'

import { getConfigEntry } from 'config'
import { getModuleType } from 'liferay'
import { getBaseName, log, runCommand } from 'tools'

const GLOBAL_CMDS = ['help', 'check:ci', 'generate:tsconfig']

type Props = {
	all?: boolean
	command: string
	currentBranch?: boolean
	global?: boolean
	localChanges?: boolean
}

/**
 * Allow regenerating outdated tsconfig.json files
 */

export async function nodeScripts({
	all,
	command,
	currentBranch,
	global,
	localChanges,
}: Props) {
	const portalPath = await getConfigEntry('portal.path')

	const module = Deno.cwd()
	const moduleName = getBaseName(module)
	const moduleType = await getModuleType(module)

	const isGlobalCommand = global || GLOBAL_CMDS.includes(command)

	if (!moduleType && !isGlobalCommand) {
		log(
			`You must either move to a ${bold(white('Liferay module'))} or run the command with ${bold(white('--global'))}`
		)

		return
	}

	if (isGlobalCommand) {
		Deno.chdir(`${portalPath}/modules`)
	}

	const cmd = `npx node-scripts ${command}${all ? ' --all' : ''}${currentBranch ? ' --current-branch' : ''}${localChanges ? ' --local-changes' : ''}`

	let description = `Running ${bold(white(cmd))} command`

	if (isGlobalCommand) {
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
