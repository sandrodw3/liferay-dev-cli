import { Failure, Info, Warning } from './exceptions.ts'
import { blue, bold, green, red, rgb24, white, yellow } from 'std/colors'
import { Spinner as UnstableSpinner } from 'std/unstable-spinner'

import { log } from '@lib/utils'

type Level = 'success' | 'fail' | 'warn' | 'info'

type Spinner = {
	frames?: string[]
	color?: number
	silent?: boolean
	interval?: number
}

type Props = {
	fn: (spinner: UnstableSpinner) => Promise<void> | void
	timed?: boolean
	text: string
	spinner?: Spinner
}

/**
 * Run an async function with a spinner and log the result.
 */

export async function runAsyncFunction({
	fn,
	timed = true,
	text,
	spinner: config,
}: Props): Promise<boolean> {
	const customColor = config?.color
	const silent = config?.silent ?? false

	const paint = (s: string) =>
		customColor !== undefined ? rgb24(s, customColor) : s

	const spinner = new UnstableSpinner({
		message: text,
		...(config?.frames ? { spinner: config.frames.map(paint) } : {}),
		...(config?.interval !== undefined
			? { interval: config.interval }
			: {}),
	})

	spinner.start()

	try {
		const start = Date.now()

		await fn(spinner)

		const end = Date.now()

		spinner.stop()

		if (!silent) {
			succeed({ text, ms: timed ? end - start : undefined, config })
		}

		return true
	} catch (exception) {
		spinner.stop()

		if (exception instanceof Info) {
			if (!silent) {
				info({ text: `${text} ${exception.message}`, config })
			}

			return true
		}

		if (exception instanceof Warning) {
			if (!silent) {
				warn({ text: `${text} ${exception.message}`, config })
			}

			return true
		}

		if (exception instanceof Failure) {
			const { exit, message, trace } = exception

			if (!silent) {
				fail({ text, message, config })

				if (trace) {
					log(`\nError ${white(bold('trace'))}:\n\n${trace}`)
				}
			}

			if (exit) {
				Deno.exit(1)
			}

			return false
		}

		if (exception instanceof Error) {
			if (!silent) {
				fail({ text, message: exception.message, config })
			}

			Deno.exit(1)
		}

		return false
	}
}

/**
 * Pick the colorizer for the icon: a custom color (if provided) wins
 * over the level's standard color
 */

function color(level: Level, config?: Spinner) {
	const custom = config?.color

	if (custom !== undefined) {
		return (s: string) => rgb24(s, custom)
	}

	if (level === 'success') {
		return green
	}

	if (level === 'fail') {
		return red
	}

	if (level === 'warn') {
		return yellow
	}

	return blue
}

/**
 * Log a successful run with the optional timed flair
 */

function succeed({
	text,
	ms,
	config,
}: {
	text: string
	ms: number | undefined
	config?: Spinner
}) {
	const icon = bold(color('success', config)('√'))

	if (ms === undefined) {
		log(`${icon} ${text}`)

		return
	}

	log(
		`${icon} ${text} (completed ${bold(green('successfully'))} in ${msToTime(ms)})`
	)
}

/**
 * Log a failure, with the inline `error` flair when no specific message
 * was provided
 */

function fail({
	text,
	message,
	config,
}: {
	text: string
	message: string | undefined
	config?: Spinner
}) {
	const icon = bold(color('fail', config)('X'))

	if (message) {
		log(`${icon} ${text} ${message}`)

		return
	}

	log(`${icon} ${text} (${bold(red('error'))} occurred)`)
}

/**
 * Log a warn-level result
 */

function warn({ text, config }: { text: string; config?: Spinner }) {
	const icon = bold(color('warn', config)('!'))

	log(`${icon} ${text}`)
}

/**
 * Log an info-level result
 */

function info({ text, config }: { text: string; config?: Spinner }) {
	const icon = bold(color('info', config)('i'))

	log(`${icon} ${text}`)
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
