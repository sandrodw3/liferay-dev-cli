import { existsSync } from 'std/exists'

/**
 * Check folder exists or not
 */

export function folderExists(folder?: string) {
	return folder && existsSync(folder)
}
