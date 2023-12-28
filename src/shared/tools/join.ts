/**
 * Join a list of paths
 */

export function join(...paths: string[]): string {
	return paths.join('/')
}
