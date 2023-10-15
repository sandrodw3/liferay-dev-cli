import { TerminalSpinner } from 'spinners'
import { bold, green, red, white } from 'std/colors'

import { Info, Warning } from 'exceptions'

type Props = {
	fn: () => Promise<void> | void
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
		const start = Date.now()

		await fn()

		const end = Date.now()

		spinner.succeed(
			`${text} (completed ${bold(green('successfully'))} in ${msToTime(
				end - start
			)})`
		)
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

function msToTime(ms: number) {
	const seconds = Math.trunc(ms / 1000)

	if (seconds < 60) {
		return `${bold(white(`${seconds}`))}s`
	}

	const remSeconds = seconds % 60
	const minutes = (seconds - remSeconds) / 60

	if (minutes < 60) {
		return `${bold(white(`${minutes}`))}min ${bold(
			white(`${remSeconds}`)
		)}s`
	}

	const remMinutes = minutes % 60
	const hours = (minutes - remMinutes) / 60

	return `${bold(white(`${hours}`))}h ${bold(
		white(`${remMinutes}`)
	)}min ${bold(white(`${remSeconds}`))}s`
}
