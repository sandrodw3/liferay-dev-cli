/**
 * Return the base name for the given path
 */

export function getBaseName(path: string): string {
	return path.split('/').pop() as string
}
