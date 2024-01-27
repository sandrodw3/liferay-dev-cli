import { join } from 'tools'

/**
 * Go up from the given path by removing the last item and
 * return the new path
 */

export function goUp(path: string): string {
	const splits = path.split('/')

	splits.pop()

	return join(...splits)
}
