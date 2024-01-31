import { lookUp } from 'tools'

/**
 * Return the parent module of a given file
 */

export function getParentModule(file: string): string | null {
	return lookUp('build.gradle', file)
}
