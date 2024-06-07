import { existsSync } from 'std/exists'

/**
 * Check whether a path is a Liferay module or not
 */

export function isLiferayModule(module: string) {
	Deno.chdir(module)

	return existsSync('build.gradle')
}
