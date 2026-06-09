import { selectModule } from '@lib/liferay'
import { log } from '@lib/utils'

/**
 * Allow finding a module and getting its path
 */

export async function find() {
	const module = await selectModule()

	if (!module) {
		Deno.exit(0)
	}

	log(module)
}
