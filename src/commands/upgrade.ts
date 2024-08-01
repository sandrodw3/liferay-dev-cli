import { bold, cyan, dim, red, white } from 'std/colors'

import { log, runAsyncFunction } from 'tools'
import { getLatestVersion } from 'version'
import { runCommand } from '../shared/tools/run-command.ts'

/**
 * Upgrade lfr to latest version
 */

export async function upgrade(current: string) {
	// Get latest version and check if it's not the one installed

	const latest = await getLatestVersion()

	if (!latest) {
		log(
			`An ${bold(red('error'))} occurred while ${bold(white('checking updates'))}, please try again later`
		)

		return
	}

	if (latest === current) {
		log(
			`Local lfr version ${bold(cyan(current))} is the most recent release`
		)

		return
	}

	// Build command and install new version

	log(
		`${bold(white('Upgrading'))} lfr: ${bold(cyan(current))} → ${bold(cyan(latest))}\n`
	)

	const repo = `https://raw.githubusercontent.com/sandrodw3/liferay-dev-cli/${latest}`
	const cmd = `deno install ${repo}/src/lfr.ts --import-map ${repo}/deno.json --allow-env --allow-net --allow-read --allow-run --allow-write -f -g -r -q`

	await runAsyncFunction({
		fn: async () => {
			await runCommand(cmd)
		},
		text: `lfr ${dim('Upgrade to latest release')}`,
	})
}
