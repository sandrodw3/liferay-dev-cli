import { runCommand } from 'sdw3/lab/exec'
import { bold, cyan, dim, red, white } from 'std/colors'

import { log } from '@lib/utils'
import { getLatestVersion } from '@lib/version'

/**
 * Upgrade lfr to latest version
 */

export async function upgrade(current: string) {
	// Get latest version and check if it's the one installed

	log(`Current lfr version: ${bold(cyan(current))}\n`)

	log(dim(`Looking up latest version...\n`))

	const latest = await getLatestVersion()

	if (!latest) {
		log(
			`An ${bold(red('error'))} occurred while ${bold(white('checking updates'))}, please try again later`
		)

		Deno.exit(1)
	}

	if (latest === current) {
		log(
			`Installed lfr version ${bold(cyan(current))} is the latest version`
		)

		Deno.exit(0)
	}

	// Upgrade to latest version

	log(`Found latest version ${bold(cyan(latest))}\n`)

	log(dim(`Installing it...\n`))

	const tmp = await Deno.makeTempDir()

	let failed = false

	try {
		// Download the source tarball and extract it into the temp dir

		const tarball = `https://codeload.github.com/sandrodw3/liferay-dev-cli/tar.gz/refs/tags/${latest}`

		const response = await fetch(tarball)

		const archive = `${tmp}/source.tar.gz`

		await Deno.writeFile(archive, response.body!)

		await runCommand(`tar xzf ${archive} -C ${tmp} --strip-components=1`, {
			spawn: true,
		})

		// Compile and install lfr from the downloaded source

		Deno.chdir(tmp)

		const cmd =
			'deno install --allow-env --allow-net --allow-read --allow-run --allow-write --compile --config deno.json src/lfr.ts -f -g -r'

		await runCommand(cmd, { spawn: true })
	} catch {
		failed = true
	} finally {
		await Deno.remove(tmp, { recursive: true })
	}

	if (failed) {
		log(
			`\nAn ${bold(red('error'))} occurred while ${bold(white('installing'))} version ${bold(cyan(latest))}`
		)

		Deno.exit(1)
	}

	log(`\nUpgraded successfully to lfr ${bold(cyan(latest))}`)
}
