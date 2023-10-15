import { TerminalSpinner } from 'spinners'
import { bold, green, red } from 'std/colors'

import { Info, Warning } from 'exceptions'

type Props = {
	fn: () => Promise<void>
	text: string
	exitOnFail?: boolean
}

/**
 * Run an async function and display the result with the
 * corresponding log level using a TerminalSpinner
 */

export async function runAsyncFunction({ fn, text, exitOnFail = true }: Props) {
	const spinner = new TerminalSpinner({ text })

	spinner.start()

	try {
		await fn()

		spinner.succeed(`${text} (completed ${bold(green('successfully'))})`)
	} catch (exception) {
		if (exception instanceof Info) {
			spinner.info(`${text} ${exception.message}`)
		} else if (exception instanceof Warning) {
			spinner.warn(`${text} ${exception.message}`)
		} else {
			const message =
				exception.message || `(${bold(red('error'))} occurred)`

			spinner.fail(`${text} ${message}`)

			if (exitOnFail) {
				Deno.exit(1)
			}
		}
	}
}
