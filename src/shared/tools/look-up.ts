import { existsSync } from 'std/exists'

import { goUp, join } from 'tools'

/**
 * Look up to find a folder that contains the given subpath
 * starting from the given start (current directory if no start
 * is given). If it's found, return it, otherwise return null
 */

export function lookUp(subpath: string, start = Deno.cwd()): string | null {
	let path = start

	while (true) {
		// If it's a file, go up and try again

		if (existsSync(path, { isFile: true })) {
			path = goUp(path)

			continue
		}

		// Create a candidate

		const candidate = join(path, subpath)

		if (existsSync(candidate)) {
			// Return this path if candidate exists

			return path
		} else if (!path) {
			// Return null if can't go any higher

			return null
		} else {
			// Go up and try again

			path = goUp(path)
		}
	}
}
