import { Confirm } from 'cliffy/prompt'
import { Failure, Info, runAsyncFunction, runCommand } from 'sdw3/lab/exec'
import { checkFzf } from 'sdw3/lab/fzf'
import { getBaseName } from 'sdw3/lab/path'
import { blue, bold, dim, green, red, white, yellow } from 'std/colors'

import { getConfigEntry } from '@lib/config'
import { getCurrentBranch } from '@lib/git'
import { getChangedModules, getModuleType, selectModule } from '@lib/liferay'
import { join, log } from '@lib/utils'

type Options = {
	defaultOutput?: boolean
}

type Props = Options & {
	currentBranch?: boolean
	module?: boolean
}

/**
 * Run baseline on a module or a bunch of them, depending on options
 */

export async function baseline({
	currentBranch,
	defaultOutput,
	module,
}: Props) {
	const options = { defaultOutput }

	// No branch and module options, so run baseline on current module

	if (!module && !currentBranch) {
		await baselineCurrentModule(options)
	}
	// Run baseline on modules modified in branch
	else if (currentBranch) {
		await baselineBranchModules(options)
	}
	// Allow selecting a specific module to run baseline
	else if (module) {
		await baselineSelectedModule(options)
	}
}

/**
 * Run baseline on the current module
 */

async function baselineCurrentModule(options: Options) {
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
			`${bold(blue(moduleName))} does ${bold(yellow('not support baseline'))}`
		)

		Deno.exit(1)
	}

	await baselineModule({ module, options })
}

/**
 * Run baseline on all modules modified in current branch, including
 * uncommited changes
 */

async function baselineBranchModules(options: Options) {
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
				message: `You are about to run baseline on ${modules.length} modules, do you want to continue?`,
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
			)} in any module that supports baseline in this branch`
		)

		Deno.exit(0)
	}

	const branch = await getCurrentBranch()
	const baseBranch = await getConfigEntry('base.branch')

	// Log description

	log(
		`Running ${bold(white('baseline'))} on all modules modified in ${bold(
			blue(`[${branch}]`)
		)} branch comparing with ${bold(blue(`[${baseBranch}]`))}\n`
	)

	// Run baseline on changed modules

	const result: Array<{ module: string; status: 'failed' | 'passed' }> = []

	for (const [i, module] of modules.entries()) {
		if (i > 0 && result[i - 1].status === 'failed') {
			log()
		}

		const passed = await baselineModule({
			module,
			options,
			showDescription: !!options.defaultOutput,
		})

		if (options.defaultOutput && i < modules.length - 1) {
			log()
		}

		result.push({ module, status: passed ? 'passed' : 'failed' })
	}

	if (result.some(({ status }) => status === 'failed')) {
		log(bold(white('\nSummary:\n')))

		for (const { module, status } of result) {
			if (status === 'passed') {
				log(
					`${bold(green('√'))} ${getBaseName(module)}: baseline ${bold(green('successful'))}`
				)
			} else if (status === 'failed') {
				log(
					`${bold(red('X'))} ${getBaseName(module)}: baseline ${bold(red('failed'))}`
				)
			}
		}

		Deno.exit(1)
	}
}

/**
 * Allow selecting a module with fuzzy search and run baseline on it
 */

async function baselineSelectedModule(options: Options) {
	await checkFzf()

	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to run baseline on it`
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

	await baselineModule({ module, options })
}

/**
 * Run baseline on the given module
 */

async function baselineModule({
	module,
	options,
	showDescription = true,
}: {
	module: string
	options: Options
	showDescription?: boolean
}) {
	const moduleName = getBaseName(module)

	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')

	const { defaultOutput } = options

	// Show description

	if (showDescription) {
		log(`Running ${bold(white('baseline'))} on ${bold(blue(moduleName))}\n`)
	}

	// Run baseline on the module

	Deno.chdir(module)

	const baselineCommand = 'baseline'
	const command = `${gradlePath} ${baselineCommand}`

	if (defaultOutput) {
		await runCommand(command, { spawn: true })

		return true
	}

	return await runAsyncFunction({
		fn: async () => {
			try {
				if (!supportsBaseline(moduleName)) {
					throw new Info(
						`(does not support baseline, ${bold(blue(`skipped`))})`
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
		text: `${moduleName} ${dim(baselineCommand)}`,
	})
}

/**
 * Checks whether de module supports baseline or not
 */

function supportsBaseline(moduleName: string): boolean {
	return (
		moduleName.endsWith('-api') ||
		moduleName.endsWith('-spi') ||
		moduleName.endsWith('-test-util') ||
		moduleName.endsWith('-taglib')
	)
}
