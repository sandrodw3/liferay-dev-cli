import { Confirm } from 'cliffy/prompt'
import { blue, bold, dim, red, white, yellow } from 'std/colors'

import { getConfigEntry } from 'config'
import { Info } from 'exceptions'
import { getCurrentBranch } from 'git'
import { getChangedModules, getModuleType, selectModule } from 'liferay'
import { checkFzf, getBaseName, log, runAsyncFunction, runCommand } from 'tools'

type Props = {
	currentBranch?: boolean
	defaultOutput?: boolean
	module?: boolean
}

/**
 * Run jest tests in a module or a bunch of them, depending on options
 */

export async function jest({ currentBranch, defaultOutput, module }: Props) {
	// No branch and module options, so run tests in current module

	if (!module && !currentBranch) {
		await runTestsInCurrentModule(defaultOutput)
	}
	// Run tests in all modules modified in branch
	else if (currentBranch) {
		await runTestsInBranch(defaultOutput)
	}
	// Allow selecting a specific module to run tests on it
	else if (module) {
		await runTestsInSelectedModule(defaultOutput)
	}
}

async function runTestsInCurrentModule(defaultOutput: Props['defaultOutput']) {
	const module = Deno.cwd()

	const moduleName = getBaseName(module)
	const moduleType = await getModuleType(module)

	if (moduleType !== 'standard-module') {
		log(
			`There are ${bold(yellow('no jest tests'))} in ${bold(blue(moduleName))}`
		)

		return
	}

	await runTests({ module, defaultOutput })
}

/**
 * Run tests in all modules modified in current branch, including
 * uncommited changes
 */

async function runTestsInBranch(defaultOutput: Props['defaultOutput']) {
	// Move to portal

	const portalPath = await getConfigEntry('portal.path')

	Deno.chdir(portalPath)

	// Check there are actually changes

	const modules = await getChangedModules({
		exclude: [
			'playwright',
			'parent-module',
			'test-module',
			'root-module',
			'root',
		],
	})

	// Ask user if there are more than 10 modules with changes

	if (modules.length > 10) {
		if (
			!(await Confirm.prompt({
				message: `You are about to run tests in ${modules.length} modules, do you want to continue?`,
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
			)} in any testable module in this branch`
		)

		return
	}

	// Log description

	const branch = await getCurrentBranch()
	const baseBranch = await getConfigEntry('base.branch')

	log(
		`Running ${bold(white('jest tests'))} in all testable modules modified in ${bold(
			blue(`[${branch}]`)
		)} branch comparing with ${bold(blue(`[${baseBranch}]`))}\n`
	)

	// Run tests in changed modules

	let error = false

	for (const [i, module] of modules.entries()) {
		await runTests({
			module,
			defaultOutput,
			onError: () => {
				error = true
			},
			showDescription: !!defaultOutput,
		})

		if (defaultOutput && i < modules.length - 1) {
			log('')
		}
	}

	if (error) {
		Deno.exit(1)
	}
}

/**
 * Allow selecting a module with fuzzy search to run tests on it
 */

async function runTestsInSelectedModule(defaultOutput: Props['defaultOutput']) {
	await checkFzf()

	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to run tests`
	)

	const module = await selectModule({
		exclude: [
			'playwright',
			'parent-module',
			'test-module',
			'root-module',
			'root',
		],
	})

	if (!module) {
		return
	}

	log('')

	await runTests({ module, defaultOutput })
}

/**
 * Run tests in the given module and exit with error if fails
 */

async function runTests({
	module,
	defaultOutput,
	onError,
	showDescription = true,
}: {
	module: string
	defaultOutput: Props['defaultOutput']
	onError?: () => void
	showDescription?: boolean
}) {
	const moduleName = getBaseName(module)

	// Show description

	if (showDescription) {
		log(
			`Running ${bold(white('jest tests'))} in ${bold(blue(moduleName))}\n`
		)
	}

	// Run tests in module

	Deno.chdir(module)

	if (defaultOutput) {
		await runCommand('npx node-scripts test', { spawn: true })

		return
	}

	await runAsyncFunction({
		fn: async () => {
			let result = ''

			result = await runCommand('npx node-scripts test')

			if (result.includes('failed')) {
				throw new Error(`(${bold(red('failed'))})`)
			}

			// No tests in module

			if (
				result.includes('0 projects') ||
				result.includes('No tests found')
			) {
				throw new Info(`(no tests, ${bold(blue(`skipped`))})`)
			}
		},
		onError,
		text: `${moduleName} ${dim('npx node-scripts test')}`,
	})
}
