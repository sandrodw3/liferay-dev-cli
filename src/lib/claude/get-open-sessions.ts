import { runCommand } from 'sdw3/lab/exec'

import { SESSIONS_PATH } from '@lib/claude'
import { folderExists, join } from '@lib/utils'

export type SessionProcess = {
	pid: number
	entrypoint?: string
}

/**
 * Return the sessions opened by a running Claude Code process, by
 * session id. Return null if the process registry can't be read, as
 * it's an undocumented format
 */

export async function getOpenSessions(): Promise<Map<
	string,
	SessionProcess
> | null> {
	if (!folderExists(SESSIONS_PATH)) {
		return null
	}

	const entries: (SessionProcess & { sessionId: string })[] = []

	for await (const entry of Deno.readDir(SESSIONS_PATH)) {
		if (!entry.isFile || !entry.name.endsWith('.json')) {
			continue
		}

		try {
			const { pid, sessionId, entrypoint } = JSON.parse(
				await Deno.readTextFile(join(SESSIONS_PATH, entry.name))
			)

			if (typeof pid !== 'number' || typeof sessionId !== 'string') {
				return null
			}

			entries.push({ pid, sessionId, entrypoint })
		} catch {
			return null
		}
	}

	const sessions = new Map<string, SessionProcess>()

	if (!entries.length) {
		return sessions
	}

	// Ignore entries whose process is not alive anymore

	const output = await runCommand(
		`ps -o pid= -p ${entries.map(({ pid }) => pid).join(',')}`,
		{ ignoreError: true }
	)

	const alive = output.split('\n').map((line) => Number(line.trim()))

	for (const { pid, sessionId, entrypoint } of entries) {
		if (alive.includes(pid)) {
			sessions.set(sessionId, { pid, entrypoint })
		}
	}

	return sessions
}
