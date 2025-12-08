import { Select } from 'cliffy/prompt'
import { bold, yellow } from 'std/colors'

import { log, runCommand } from 'tools'

/**
 * Handle a rebase conflict by prompting the user to abort or continue
 */

export async function handleRebaseConflict({
	onAbort,
}: {
	onAbort: () => Promise<void>
}) {
	log('')

	const selection: string = await Select.prompt({
		prefix: `${yellow('→')} `,
		message: 'Found conflict! What do you want to do?\n',
		options: [
			{
				name: 'Abort',
				value: 'abort',
			},
			{
				name: 'I already solved the conflict, please continue',
				value: 'continue',
			},
		],
	})

	if (selection === 'abort') {
		await runCommand('git rebase --abort')

		await onAbort()

		log(`\nOperation was ${bold(yellow('aborted'))}`)

		Deno.exit()
	} else if (selection === 'continue') {
		try {
			await runCommand('git rebase --continue')

			log('')
		} catch {
			await handleRebaseConflict({ onAbort })
		}
	}
}
