import { bold, dim, underline, yellow } from 'std/colors'

import {
	deployModule,
	getChangedModules,
	getDeployCommand,
	getGradleCommand,
	getModuleName,
	getPortalRoot,
} from 'liferay'
import { log, run } from 'tools'

/**
 * Deploys all modules with changes
 */

export async function deploy(clean?: boolean, skipDependencies?: boolean) {
	// Check it's a Liferay project and gradle is installed

	getPortalRoot()
	getGradleCommand()

	// Check there are actually changes

	const modules = await getChangedModules(true)

	if (!modules.length) {
		log(
			`You have ${bold(
				yellow('no changes')
			)} in any module in this branch`
		)

		Deno.exit(1)
	}

	// Deploy changed modules

	log(`${bold(underline('Deploy'))}`)

	modules.sort(compareModules)

	for (const module of modules) {
		const moduleName = getModuleName(module)
		const deployCommand = await getDeployCommand({
			module,
			clean,
			skipDependencies,
		})

		await run({
			function: () => deployModule(module, deployCommand),
			indent: 2,
			message: `${moduleName} ${dim(deployCommand)}`,
		})
	}
}

/**
 * Compares two modules depending on the type
 */

function compareModules(moduleA: string, moduleB: string) {
	const weights = {
		test: 7,
		kernel: 6,
		api: 5,
		impl: 4,
		service: 3,
		taglib: 2,
		web: 1,
	} as const

	let moduleAWeight = 0
	let moduleBWeight = 0

	for (const key of Object.keys(weights)) {
		if (moduleA.endsWith(key)) {
			moduleAWeight = weights[key as keyof typeof weights]
		}

		if (moduleB.endsWith(key)) {
			moduleBWeight = weights[key as keyof typeof weights]
		}
	}

	return moduleBWeight - moduleAWeight
}
