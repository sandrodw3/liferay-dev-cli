import { blue, bold, dim, red, white, yellow } from 'std/colors'

import { getConfigEntry } from 'config'
import { Info, Warning } from 'exceptions'
import { getCurrentBranch } from 'git'
import {
	ROOT_MODULES,
	getChangedModules,
	getModules,
	isLiferayModule,
} from 'liferay'
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
 * Deploy current module and exit if it's not deployable
 */

async function deployCurrentModule(options: Options) {
	const module = Deno.cwd()

	if (!isLiferayModule(module)) {
		log(`You are not in a ${bold(yellow('deployable'))} module`)

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

	if (!modules.length) {
		log(
			`You have ${bold(
				yellow('no changes')
			)} in any deployable module in this branch`
		)

		return
	}

	const branch = await getCurrentBranch()

	// Calculate and log command description

	const { clean, skipDependencies } = options

	let description = clean
		? `${bold(white('Clean'))} deploying `
		: 'Deploying '

	description += `all modules modified in ${bold(blue(`[${branch}]`))} branch`

	if (skipDependencies) {
		description += bold(white(' without rebuilding dependencies'))
	}

	log(`${description}\n`)

	// Deploy changed modules

	let error = false

	for (const module of modules) {
		try {
			await deployModule({
				module,
				options,
				exitOnFail: false,
				showDescription: options.defaultOutput ? true : false,
			})
		} catch {
			error = true
		}
	}

	if (error) {
		log(`\nSome modules ${bold(red('failed'))} to deploy`)

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

	const modules = await getModules()

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

	if (!isLiferayModule(module)) {
		log(`You are not in a ${bold(yellow('deployable'))} module`)

		return
	}

	await deployModule({ module, options })
}

/**
 * Return the command to deploy a module depending on its type,
 * or blank if the module is skippable
 */

export function getDeployCommand(
	module: string,
	options: Options
): string | null {
	const { clean, skipDependencies } = options

	const moduleName = getBaseName(module)

	if (
		module.includes('test') ||
		module.endsWith('modules') ||
		ROOT_MODULES.some((rootModule) => moduleName.includes(rootModule))
	) {
		return null
	}

	return `${clean ? 'clean ' : ''}deploy${skipDependencies ? ' -a' : ''}`
}

/**
 * Deploy the given module
 */

async function deployModule({
	module,
	options,
	exitOnFail = true,
	showDescription = true,
}: {
	module: string
	options: Options
	exitOnFail?: boolean
	showDescription?: boolean
}) {
	const moduleName = getBaseName(module)

	// Calculate and log command description

	if (showDescription) {
		const { clean, skipDependencies } = options

		let description = clean
			? `${bold(white('Clean'))} deploying `
			: 'Deploying '

		description += bold(blue(moduleName))

		if (skipDependencies) {
			description += bold(white(' without rebuilding dependencies'))
		}

		log(`${description}\n`)
	}

	Deno.chdir(module)

	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')
	const command = getDeployCommand(module, options)

	if (options.defaultOutput) {
		await runCommand(`${gradlePath} ${command}`, { spawn: true })

		return
	}

	let error = false

	await runAsyncFunction({
		fn: async () => {
			if (
				ROOT_MODULES.some((rootModule) =>
					moduleName.includes(rootModule)
				)
			) {
				throw new Warning(`(needs ${bold(yellow('manual'))} deploy)`)
			} else if (!command) {
				throw new Info(`(${bold(blue('skipped'))})`)
			}

			try {
				await runCommand(`${gradlePath} ${command}`)
			} catch ({ message }) {
				if (message.includes('FAILED')) {
					error = true

					throw new Error(`(${bold(red('failed'))} to deploy)`)
				}
			}
		},
		text: command ? `${moduleName} ${dim(command)}` : moduleName,
		exitOnFail,
	})

	// Throw an error if failed

	if (error) {
		throw new Error()
	}
}
