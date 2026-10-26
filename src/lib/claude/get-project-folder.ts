import { PROJECTS_PATH } from '@lib/claude'
import { folderExists, join } from '@lib/utils'

const MAX_LENGTH = 200

/**
 * Encode a directory the way Claude Code names its project folders
 */

export function encodeDir(dir: string): string {
	return dir.replace(/[^a-zA-Z0-9]/g, '-')
}

/**
 * Return the Claude Code project folder for the given directory, or null
 * if it can't be resolved. Long names get a hash suffix that can't be
 * computed here, so they are only resolved if the folder already exists
 */

export function getProjectFolder(dir: string): string | null {
	const name = encodeDir(dir)

	if (name.length <= MAX_LENGTH) {
		return join(PROJECTS_PATH, name)
	}

	if (!folderExists(PROJECTS_PATH)) {
		return null
	}

	const prefix = `${name.slice(0, MAX_LENGTH)}-`

	const matches = [...Deno.readDirSync(PROJECTS_PATH)].filter(
		(entry) => entry.isDirectory && entry.name.startsWith(prefix)
	)

	return matches.length === 1 ? join(PROJECTS_PATH, matches[0].name) : null
}

/**
 * Return the directory of the given project folder name, or null if it
 * can't be found. The encoding is lossy, so the name is matched against
 * the existing directories, one level at a time
 */

export function getFolderDir(name: string, base = ''): string | null {
	if (!name) {
		return base || null
	}

	let entries: Deno.DirEntry[]

	try {
		entries = [...Deno.readDirSync(base || '/')]
	} catch {
		return null
	}

	for (const entry of entries) {
		if (!entry.isDirectory && !entry.isSymlink) {
			continue
		}

		const part = `-${encodeDir(entry.name)}`

		if (name !== part && !name.startsWith(`${part}-`)) {
			continue
		}

		const dir = getFolderDir(
			name.slice(part.length),
			`${base}/${entry.name}`
		)

		if (dir) {
			return dir
		}
	}

	return null
}
