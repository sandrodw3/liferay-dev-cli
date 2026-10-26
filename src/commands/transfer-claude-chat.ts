import { Confirm } from 'cliffy/prompt'
import { runAsyncFunction } from 'sdw3/lab/exec'
import { getBaseName } from 'sdw3/lab/path'
import { fuzzySelect } from 'sdw3/lab/prompt'
import { blue, bold, red, white, yellow } from 'std/colors'
import { existsSync } from 'std/exists'

import {
	Session,
	encodeDir,
	getOpenSessions,
	getProjectFolder,
	getSessions,
} from '@lib/claude'
import { getConfigEntry } from '@lib/config'
import { selectModule } from '@lib/liferay'
import { join, log } from '@lib/utils'

/**
 * Move a Claude Code chat to the selected module, so it can be
 * resumed from there
 */

export async function transferClaudeChat() {
	// Get portal sessions

	const portalPath = await getConfigEntry('portal.path')

	const sessions = (await getSessions(encodeDir(portalPath))).filter(
		(session) => isInside({ dir: session.dir, parent: portalPath })
	)

	if (!sessions.length) {
		log(`There are ${bold(yellow('no chats'))} to transfer`)

		Deno.exit(0)
	}

	const open = await getOpenSessions()

	const options = sessions.map((session) => ({
		value: session.path,
		label: session.title ?? '(untitled)',
		description: [
			formatDate(session.date),
			getBaseName(session.dir!),
			open?.has(session.id) ? bold(yellow('open')) : '',
		]
			.filter(Boolean)
			.join(' '),
	}))

	const path = await fuzzySelect({
		message: 'Select a chat to transfer',
		options,
	})

	const session = sessions.find((session) => session.path === path)

	if (!session) {
		Deno.exit(0)
	}

	// Refuse to transfer open sessions, ask if it can't be checked

	if (!open) {
		const confirmed = await Confirm.prompt({
			message: `Open chats ${bold(yellow('could not be checked'))}, make sure this one is closed. Do you want to continue?`,
			prefix: `${yellow('→')} `,
		})

		if (!confirmed) {
			Deno.exit(0)
		}
	}

	const process = open?.get(session.id)

	if (process) {
		log()

		log(
			`The chat is ${bold(yellow('open'))} in process ${bold(white(String(process.pid)))} (${process.entrypoint ?? 'unknown'}), close it first`
		)

		Deno.exit(1)
	}

	// Get the target module and its Claude project folder

	const target = await selectModule({ message: 'Select the target module' })

	if (!target) {
		Deno.exit(0)
	}

	log()

	const folder = getProjectFolder(target)

	if (!folder) {
		log(
			`Claude project folder for ${bold(white(target))} ${bold(red('could not be resolved'))}, open Claude Code there once and try again`
		)

		Deno.exit(1)
	}

	if (folder === session.folder) {
		log(`The chat is ${bold(yellow('already'))} in ${bold(white(target))}`)

		Deno.exit(0)
	}

	// Transfer it, merging both parts if it already exists in the target

	const merge = existsSync(join(folder, `${session.id}.jsonl`))

	await runAsyncFunction({
		fn: () => transfer({ folder, session }),
		text: `${merge ? 'Merging' : 'Moving'} ${bold(blue(session.title ?? session.id))} into ${bold(white(target))}`,
		timed: false,
	})
}

/**
 * Move the session file and its sibling folder to the given
 * project folder. If the session already exists there, append the
 * new lines to it (Claude recreates the file in the origin if the
 * session was written after being moved)
 */

async function transfer({
	folder,
	session,
}: {
	folder: string
	session: Session
}) {
	await Deno.mkdir(folder, { recursive: true })

	await place(session.path, join(folder, `${session.id}.jsonl`))

	const siblings = join(session.folder, session.id)

	if (existsSync(siblings)) {
		await place(siblings, join(folder, session.id))
	}
}

/**
 * Move a file or folder, merging it with the existing one if
 * needed. JSONL files are appended, the rest are replaced
 */

async function place(from: string, to: string) {
	if (!existsSync(to)) {
		await Deno.rename(from, to)

		return
	}

	const { isDirectory } = await Deno.stat(from)

	if (isDirectory) {
		for await (const entry of Deno.readDir(from)) {
			await place(join(from, entry.name), join(to, entry.name))
		}
	} else if (from.endsWith('.jsonl')) {
		const source = await Deno.open(from)
		const target = await Deno.open(to, { append: true })

		await source.readable.pipeTo(target.writable)
	} else {
		await Deno.copyFile(from, to)
	}

	await Deno.remove(from, { recursive: true })
}

/**
 * Check whether the given directory is the parent one or inside it
 */

function isInside({ dir, parent }: { dir: string | null; parent: string }) {
	return dir === parent || !!dir?.startsWith(`${parent}/`)
}

/**
 * Format a date as dd/mm HH:MM
 */

function formatDate(date: Date) {
	const pad = (value: number) => String(value).padStart(2, '0')

	return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
