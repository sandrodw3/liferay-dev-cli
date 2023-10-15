import { blue, bold, dim, red, white, yellow } from 'std/colors'

import { Confirm } from 'cliffy/prompt'
import { getConfigEntry } from 'config'
import { getCurrentBranch } from 'git'
import { getChangedModules, getModules, getModuleType } from 'liferay'
import {
	fuzzySearch,
	getBaseName,
	join,
	log,
	runAsyncFunction,
	runCommand,
} from 'tools'

type Options = {
	clean?: boolean
	defaultOutput?: boolean
	skipDependencies?: boolean
}

type Props = Options & {
	branch?: boolean
	module?: boolean
}

/**
 * Deploy a module or a bunch of them, depending on options
 */

export async function deploy({
	branch,
	clean,
	defaultOutput,
	module,
	skipDependencies,
}: Props) {
	const options = { clean, skipDependencies, defaultOutput }

	// No branch and module options, so deploy current module

	if (!module && !branch) {
		await deployCurrentModule(options)
	}
	// Deploy modules modified in branch
	else if (branch) {
		await deployBranchModules(options)
	}
	// Allow selecting a specific module to deploy
	else if (module) {
		await deploySelectedModule(options)
	}
}

/**
 * Deploy the current module
 */

async function deployCurrentModule(options: Options) {
	const module = Deno.cwd()

	const moduleName = getBaseName(module)
	const moduleType = await getModuleType(module)

	if (moduleType === 'parent-module') {
		log(
			`${bold(blue(moduleName))} contains several modules, please move to one of them to deploy it`
		)

		return
	}

	if (moduleType !== 'module') {
		log(`${bold(blue(moduleName))} is ${bold(yellow(`not deployable`))}`)

		return
	}

	await deployModule({ module, options })
}

/**
 * Deploy all modules modified in current branch, including
 * uncommited changes
 */

async function deployBranchModules(options: Options) {
	// Move to portal

	const portalPath = await getConfigEntry('portal.path')

	Deno.chdir(portalPath)

	// Check there are actually changes

	const modules = await getChangedModules()

	// Ask user if there are more than 10 modules with changes

	if (modules.length > 10) {
		if (
			!(await Confirm.prompt(
				`You are about to deploy ${modules.length} modules, do you want to continue?`
			))
		) {
			return
		}

		log('')
	}

	// Exit if no changes

	if (!modules.length) {
		log(
			`You have ${bold(
				yellow('no changes')
			)} in any deployable module in this branch`
		)

		return
	}

	const branch = await getCurrentBranch()
	const baseBranch = await getConfigEntry('base.branch')

	// Calculate and log description

	const { clean, skipDependencies } = options

	let description = clean
		? `${bold(white('Clean'))} deploying `
		: 'Deploying '

	description += `all deployable modules modified in ${bold(
		blue(`[${branch}]`)
	)} branch comparing with ${bold(blue(`[${baseBranch}]`))}`

	if (skipDependencies) {
		description += bold(white(' without rebuilding dependencies'))
	}

	log(`${description}\n`)

	// Deploy changed modules

	let error = false

	for (const [i, module] of modules.entries()) {
		const type = await getModuleType(module)

		if (type !== 'module') {
			continue
		}

		await deployModule({
			module,
			options,
			onError: () => {
				error = true
			},
			showDescription: !!options.defaultOutput,
		})

		if (options.defaultOutput && i < modules.length - 1) {
			log('')
		}
	}

	if (error) {
		Deno.exit(1)
	}
}

/**
 * Allow selecting a module with fuzzy search and deploy it
 */

async function deploySelectedModule(options: Options) {
	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to deploy it\n`
	)

	const modules = await getModules({
		exclude: [
			'playwright',
			'parent-module',
			'test-module',
			'root-module',
			'root',
		],
	})

	const list = modules.map((module) => ({
		id: module,
		name: getBaseName(module),
	}))

	const module = await fuzzySearch(list)

	if (!module) {
		log(
			`You ${bold(yellow('did not select'))} any ${bold(
				yellow('module')
			)}`
		)

		return
	}

	await deployModule({ module, options })
}

/**
 * Deploy the given module
 */

async function deployModule({
	module,
	options,
	onError,
	showDescription = true,
}: {
	module: string
	options: Options
	onError?: () => void
	showDescription?: boolean
}) {
	const moduleName = getBaseName(module)

	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')

	const { clean, defaultOutput, skipDependencies } = options

	const command = `${clean ? 'clean ' : ''}deploy${skipDependencies ? ' -a' : ''}`

	// Show description

	if (showDescription) {
		let description = clean
			? `${bold(white('Clean'))} deploying `
			: 'Deploying '

		description += bold(blue(moduleName))

		if (skipDependencies) {
			description += bold(white(' without rebuilding dependencies'))
		}

		log(`${description}\n`)
	}

	// Deploy the module

	Deno.chdir(module)

	if (defaultOutput) {
		await runCommand(`${gradlePath} ${command}`, { spawn: true })

		return
	}

	await runAsyncFunction({
		fn: async () => {
			try {
				await runCommand(`${gradlePath} ${command}`)
			} catch ({ message }) {
				if (message.includes('FAILED')) {
					throw new Error(`(${bold(red('failed'))} to deploy)`)
				}
			}
		},
		onError,
		text: command ? `${moduleName} ${dim(command)}` : moduleName,
	})
}
