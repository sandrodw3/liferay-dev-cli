import { TerminalSpinner } from 'spinners'

import { Result } from 'types'

type Props = {
	callbacks?: {
		error?: () => void
		info?: () => void
		success?: () => void
		warning?: () => void
	}
	function: () => Promise<Result>
	indent?: number
	message: string
}

/**
 * Runs an async function and displays the result with the
 * corresponding log level. If some callback is passed for
 * the result status, it's executed
 */

export async function run({
	callbacks,
	function: asyncFunction,
	indent,
	message,
}: Props) {
	const spinner = new TerminalSpinner({ indent, text: message })

	spinner.start()

	try {
		const { status, message } = await asyncFunction()

		if (status === 'error') {
			spinner.fail(message)
		} else if (status === 'info') {
			spinner.info(message)
		} else if (status === 'success') {
			spinner.succeed(message)
		} else if (status === 'warning') {
			spinner.warn(message)
		}

		if (callbacks?.[status]) {
			callbacks[status]!()
		}
	} catch {
		throw new Error()
	}
}
