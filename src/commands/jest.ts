import { blue, bold, dim, red, white, yellow } from 'std/colors'

import { Confirm } from 'cliffy/prompt'
import { getConfigEntry } from 'config'
import { Info } from 'exceptions'
import { getCurrentBranch } from 'git'
import { getChangedModules, getModules, getModuleType } from 'liferay'
import {
	fuzzySearch,
	getBaseName,
	log,
	runAsyncFunction,
	runCommand,
} from 'tools'

type Props = {
	branch?: boolean
	defaultOutput?: boolean
	module?: boolean
}

/**
 * Run jest tests in a module or a bunch of them, depending on options
 */

export async function jest({ branch, defaultOutput, module }: Props) {
	// No branch and module options, so run tests in current module

	if (!module && !branch) {
		await runTestsInCurrentModule(defaultOutput)
	}
	// Run tests in all modules modified in branch
	else if (branch) {
		await runTestsInBranch(defaultOutput)
	}
	// Allow selecting a specific module to run tests on it
	else if (module) {
		await runTestsInSelectedModule(defaultOutput)
	}
}

async function runTestsInCurrentModule(defaultOutput?: boolean) {
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

async function runTestsInBranch(defaultOutput?: boolean) {
	// Move to portal

	const portalPath = await getConfigEntry('portal.path')

	Deno.chdir(portalPath)

	// Check there are actually changes

	const modules = await getChangedModules()

	// Ask user if there are more than 10 modules with changes

	if (modules.length > 10) {
		if (
			!(await Confirm.prompt(
				`You are about to run tests in ${modules.length} modules, do you want to continue?`
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
		const type = await getModuleType(module)

		if (type !== 'standard-module') {
			continue
		}

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

async function runTestsInSelectedModule(defaultOutput?: boolean) {
	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to run tests\n`
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
				yellow('standard-module')
			)}`
		)

		return
	}

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
	defaultOutput?: boolean
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

			try {
				result = await runCommand('npx node-scripts test')
			} catch ({ message }) {
				// Tests fail

				if (message.includes('failed')) {
					throw new Error(`(${bold(red('failed'))})`)
				}
			}

			// No tests in module

			if (result.includes('0 projects')) {
				throw new Info(`(no tests, ${bold(blue(`skipped`))})`)
			}
		},
		onError,
		text: `${moduleName} ${dim('npx node-scripts test')}`,
	})
}
