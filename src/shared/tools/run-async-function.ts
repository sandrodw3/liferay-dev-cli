import { blue, bold, green, red, white, yellow } from 'std/colors'
import { Spinner } from 'std/unstable-spinner'

import { Info, Warning } from 'exceptions'
import { log } from 'tools'

type Props = {
	fn: () => Promise<void> | void
	onError?: () => void
	text: string
}

/**
 * Run an async function and display the result with the
 * corresponding log level using a spinner
 */

export async function runAsyncFunction({
	fn,
	onError = () => Deno.exit(1),
	text,
}: Props) {
	const spinner = new Spinner({ message: text })

	spinner.start()

	try {
		const start = Date.now()

		await fn()

		const end = Date.now()

		spinner.stop()

		succeed(
			`${text} (completed ${bold(green('successfully'))} in ${msToTime(
				end - start
			)})`
		)
	} catch (exception) {
		spinner.stop()

		if (exception instanceof Info) {
			info(`${text} ${exception.message}`)
		} else if (exception instanceof Warning) {
			warn(`${text} ${exception.message}`)
		} else if (exception instanceof Error) {
			const message =
				exception.message || `(${bold(red('error'))} occurred)`

			fail(`${text} ${message}`)

			onError()
		}
	}
}

/**
 * Log success result
 */

function succeed(text: string) {
	log(`${bold(green('√'))} ${text}`)
}

/**
 * Log fail result
 */

function fail(text: string) {
	log(`${bold(red('X'))} ${text}`)
}

/**
 * Log warning result
 */

function warn(text: string) {
	log(`${bold(yellow('!'))} ${text}`)
}

/**
 * Log info result
 */

function info(text: string) {
	log(`${bold(blue('i'))} ${text}`)
}

/**
 * Transform time in ms to formatted time
 */

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
