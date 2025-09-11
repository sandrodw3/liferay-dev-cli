import { selectModule } from 'liferay'
import { blue, bold, yellow } from 'std/colors'
import { log, runCommand } from 'tools'

/**
 * Open a specific module with VS Code if it's installed
 */

export async function code({ newWindow }: { newWindow?: boolean }) {
	const output = await runCommand('which code')

	if (!output) {
		log(
			`${bold(blue('code'))} command for VS Code is not installed, please ${bold(
				yellow('install it')
			)} to use this command`
		)

		Deno.exit(1)
	}

	const module = await selectModule()

	if (!module) {
		return
	}

	await runCommand(`code ${module} ${newWindow ? '' : '-r'}`)
}
