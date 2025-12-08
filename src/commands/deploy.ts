import { Confirm } from 'cliffy/prompt'
import { blue, bold, dim, green, red, white, yellow } from 'std/colors'

import { getConfigEntry } from 'config'
import { Failure } from 'exceptions'
import { getCurrentBranch } from 'git'
import { getChangedModules, getModuleType, selectModule } from 'liferay'
import {
	checkFzf,
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
	currentBranch?: boolean
	module?: boolean
}

/**
 * Deploy a module or a bunch of them, depending on options
 */

export async function deploy({
	currentBranch,
	clean,
	defaultOutput,
	module,
	skipDependencies,
}: Props) {
	const options = { clean, skipDependencies, defaultOutput }

	// No branch and module options, so deploy current module

	if (!module && !currentBranch) {
		await deployCurrentModule(options)
	}
	// Deploy modules modified in branch
	else if (currentBranch) {
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

	if (
		!moduleType ||
		['playwright', 'test-module', 'root'].includes(moduleType)
	) {
		log(`${bold(blue(moduleName))} is ${bold(yellow('not deployable'))}`)

		return
	}

	if (moduleType === 'parent-module') {
		log(
			`${bold(blue(moduleName))} contains several modules, please move to one of them to deploy it`
		)

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

	const modules = await getChangedModules({
		exclude: ['playwright', 'parent-module', 'test-module', 'root'],
	})

	// Ask user if there are more than 10 modules with changes

	if (modules.length > 10) {
		if (
			!(await Confirm.prompt({
				message: `You are about to deploy ${modules.length} modules, do you want to continue?`,
				prefix: `${yellow('→')} `,
			}))
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

	const result: Array<{ module: string; status: 'failed' | 'passed' }> = []

	for (const [i, module] of modules.entries()) {
		if (i > 0 && result[i - 1].status === 'failed') {
			log('')
		}

		let failed = false

		await deployModule({
			module,
			options,
			onError: () => {
				failed = true
			},
			showDescription: !!options.defaultOutput,
		})

		if (options.defaultOutput && i < modules.length - 1) {
			log('')
		}

		result.push({ module, status: failed ? 'failed' : 'passed' })
	}

	if (result.some(({ status }) => status === 'failed')) {
		log(bold(white('\nSummary:\n')))

		for (const { module, status } of result) {
			if (status === 'passed') {
				log(
					`${bold(green('√'))} ${getBaseName(module)}: deployed ${bold(green('successfully'))}`
				)
			} else if (status === 'failed') {
				log(
					`${bold(red('X'))} ${getBaseName(module)}: ${bold(red('failed'))} to deploy`
				)
			}
		}

		Deno.exit(1)
	}
}

/**
 * Allow selecting a module with fuzzy search and deploy it
 */

async function deploySelectedModule(options: Options) {
	await checkFzf()

	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to deploy it`
	)

	const module = await selectModule({
		exclude: ['playwright', 'parent-module', 'test-module', 'root'],
	})

	if (!module) {
		return
	}

	log('')

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
	const moduleType = await getModuleType(module)

	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')

	const { clean, defaultOutput, skipDependencies } = options

	// Show description

	if (showDescription) {
		let description = clean
			? `${bold(white('Clean'))} deploying `
			: 'Deploying '

		description += bold(blue(moduleName))

		if (skipDependencies) {
			description += bold(white(' without rebuilding dependencies'))
		}

		if (moduleType === 'root-module') {
			description = `Deploying ${bold(blue(moduleName))}`
		}

		log(`${description}\n`)
	}

	// Deploy the module

	Deno.chdir(module)

	let deployCommand = `${clean ? 'clean ' : ''}deploy${skipDependencies ? ' -a' : ''}`
	let command = `${gradlePath} ${deployCommand}`

	if (moduleType === 'root-module') {
		deployCommand = command = 'ant deploy'
	}

	if (defaultOutput) {
		await runCommand(command, { spawn: true })

		return
	}

	await runAsyncFunction({
		fn: async () => {
			try {
				await runCommand(command)
			} catch (error) {
				const { message } = error as Error

				if (message.includes('FAILED')) {
					throw new Failure({
						message: `(${bold(red('failed'))} to deploy)`,
						trace: message,
					})
				}
			}
		},
		onError,
		text: `${moduleName} ${dim(deployCommand)}`,
	})
}
