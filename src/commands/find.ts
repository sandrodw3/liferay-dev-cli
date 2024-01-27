import { selectModule } from 'liferay'
import { log } from 'tools'

/**
 * Allow finding a module and getting its path
 */

export async function find() {
	const module = await selectModule()

	if (!module) {
		return
	}

	log(module)
}
