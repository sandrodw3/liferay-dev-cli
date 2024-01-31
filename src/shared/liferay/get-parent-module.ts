import { lookUp } from 'tools'

/**
 * Returns the parent module of a given file
 */

export function getParentModule(file: string): string | null {
	return lookUp('build.gradle', file)
}
