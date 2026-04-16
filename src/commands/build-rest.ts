import { Confirm } from 'cliffy/prompt'
import { blue, bold, dim, green, red, white, yellow } from 'std/colors'

import { getConfigEntry } from '@lib/config'
import { Failure, Info } from '@lib/exceptions'
import { getCurrentBranch } from '@lib/git'
import { getChangedModules, getModuleType, selectModule } from '@lib/liferay'
import {
	checkFzf,
	getBaseName,
	join,
	log,
	runAsyncFunction,
	runCommand,
} from '@lib/utils'

type Options = {
	defaultOutput?: boolean
}

type Props = Options & {
	currentBranch?: boolean
	module?: boolean
}

/**
 * Run buildRest on a module or a bunch of them, depending on options
 */

export async function buildRest({
	currentBranch,
	defaultOutput,
	module,
}: Props) {
	const options = { defaultOutput }

	// No branch and module options, so run buildRest on current module

	if (!module && !currentBranch) {
		await buildRestCurrentModule(options)
	}
	// Run buildRest on modules modified in branch
	else if (currentBranch) {
		await buildRestBranchModules(options)
	}
	// Allow selecting a specific module to run buildRest
	else if (module) {
		await buildRestSelectedModule(options)
	}
}

/**
 * Run buildRest on the current module
 */

async function buildRestCurrentModule(options: Options) {
	const module = Deno.cwd()

	const moduleName = getBaseName(module)
	const moduleType = await getModuleType(module)

	if (
		!moduleType ||
		[
			'playwright',
			'test-module',
			'root',
			'parent-module',
			'root-module',
		].includes(moduleType)
	) {
		log(
			`${bold(blue(moduleName))} does ${bold(yellow('not support buildRest'))}`
		)

		Deno.exit(1)
	}

	await buildRestModule({ module, options })
}

/**
 * Run buildRest on all modules modified in current branch, including
 * uncommited changes
 */

async function buildRestBranchModules(options: Options) {
	// Move to portal

	const portalPath = await getConfigEntry('portal.path')

	Deno.chdir(portalPath)

	// Check there are actually changes

	const modules = await getChangedModules({
		exclude: [
			'playwright',
			'parent-module',
			'test-module',
			'root',
			'root-module',
		],
	})

	// Ask user if there are more than 10 modules with changes

	if (modules.length > 10) {
		if (
			!(await Confirm.prompt({
				message: `You are about to run buildRest on ${modules.length} modules, do you want to continue?`,
				prefix: `${yellow('→')} `,
			}))
		) {
			Deno.exit(0)
		}

		log()
	}

	// Exit if no changes

	if (!modules.length) {
		log(
			`You have ${bold(
				yellow('no changes')
			)} in any module that supports buildRest in this branch`
		)

		Deno.exit(0)
	}

	const branch = await getCurrentBranch()
	const baseBranch = await getConfigEntry('base.branch')

	// Log description

	log(
		`Running ${bold(white('buildRest'))} on all modules modified in ${bold(
			blue(`[${branch}]`)
		)} branch comparing with ${bold(blue(`[${baseBranch}]`))}\n`
	)

	// Run buildRest on changed modules

	const result: Array<{ module: string; status: 'failed' | 'passed' }> = []

	for (const [i, module] of modules.entries()) {
		if (i > 0 && result[i - 1].status === 'failed') {
			log()
		}

		let failed = false

		await buildRestModule({
			module,
			options,
			onError: () => {
				failed = true
			},
			showDescription: !!options.defaultOutput,
		})

		if (options.defaultOutput && i < modules.length - 1) {
			log()
		}

		result.push({ module, status: failed ? 'failed' : 'passed' })
	}

	if (result.some(({ status }) => status === 'failed')) {
		log(bold(white('\nSummary:\n')))

		for (const { module, status } of result) {
			if (status === 'passed') {
				log(
					`${bold(green('√'))} ${getBaseName(module)}: buildRest ${bold(green('successful'))}`
				)
			} else if (status === 'failed') {
				log(
					`${bold(red('X'))} ${getBaseName(module)}: buildRest ${bold(red('failed'))}`
				)
			}
		}

		Deno.exit(1)
	}
}

/**
 * Allow selecting a module with fuzzy search and run buildRest on it
 */

async function buildRestSelectedModule(options: Options) {
	await checkFzf()

	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to run buildRest on it`
	)

	const module = await selectModule({
		exclude: [
			'playwright',
			'parent-module',
			'test-module',
			'root',
			'root-module',
		],
	})

	if (!module) {
		Deno.exit(0)
	}

	log()

	await buildRestModule({ module, options })
}

/**
 * Run buildRest on the given module
 */

async function buildRestModule({
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

	const { defaultOutput } = options

	// Show description

	if (showDescription) {
		log(`Running ${bold(white('buildRest'))} on ${bold(blue(moduleName))}\n`)
	}

	// Run buildRest on the module

	Deno.chdir(module)

	const command = `${gradlePath} buildRest`

	if (defaultOutput) {
		await runCommand(command, { spawn: true })

		return
	}

	await runAsyncFunction({
		fn: async () => {
			try {
				if (!supportsBuildRest(module)) {
					throw new Info(
						`(does not support buildRest, ${bold(blue(`skipped`))})`
					)
				}

				await runCommand(command)
			} catch (error) {
				const { message } = error as Error

				if (message.includes('FAILED')) {
					throw new Failure({
						message: `(${bold(red('failed'))})`,
						trace: message,
					})
				}

				throw error
			}
		},
		onError,
		text: `${moduleName} ${dim('buildRest')}`,
	})
}

/**
 * Checks whether the module supports buildRest or not
 */

function supportsBuildRest(module: string): boolean {
	try {
		Deno.statSync(join(module, 'rest-config.yaml'))

		return true
	} catch {
		return false
	}
}
