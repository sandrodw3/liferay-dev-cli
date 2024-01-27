import { join } from 'tools'

/**
 * Goes up from the given path by removing the last item and
 * returns the new path
 */

export function goUp(path: string): string {
	const splits = path.split('/')

	splits.pop()

	return join(...splits)
}
