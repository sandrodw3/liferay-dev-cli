import { blue, bold, dim, red, white, yellow } from 'std/colors'

import { Confirm } from 'cliffy/prompt'
import { getConfigEntry } from 'config'
import { Info } from 'exceptions'
import { getCurrentBranch } from 'git'
import { CMDS, getChangedModules, getModules, isLiferayModule } from 'liferay'
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

export async function test({ branch, defaultOutput, module }: Props) {
	// No branch and module options, so run tests in current module

	if (!module && !branch) {
		await runTests({ module: Deno.cwd(), defaultOutput })
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
				'You are about to run tests in more than 10 modules, do you want to continue?'
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

	// Log command description

	const branch = await getCurrentBranch()

	log(
		`Running ${bold(white('jest tests'))} in all modules modified in ${bold(
			blue(`[${branch}]`)
		)} branch\n`
	)

	// Run tests in changed modules

	let error = false

	for (const module of modules) {
		try {
			await runTests({
				module,
				defaultOutput,
				exitOnFail: false,
				showDescription: defaultOutput ? true : false,
			})
		} catch {
			error = true
		}
	}

	if (error) {
		log(`\nSome tests are ${bold(red('failing'))}, please fix them`)

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
		log(
			`You are not in a ${bold(
				blue('Liferay')
			)} testable module, please select another one`
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
	exitOnFail = true,
	showDescription = true,
}: {
	module: string
	defaultOutput?: boolean
	exitOnFail?: boolean
	showDescription?: boolean
}) {
	if (showDescription) {
		const moduleName = getBaseName(module)

		log(
			`Running ${bold(white('jest tests'))} in ${bold(
				blue(moduleName)
			)}\n`
		)
	}

	Deno.chdir(module)

	if (defaultOutput) {
		await runCommand(CMDS.test, { spawn: true })

		return
	}

	const moduleName = getBaseName(module)

	let error = false

	await runAsyncFunction({
		fn: async () => {
			let result = ''

			try {
				result = await runCommand(CMDS.test)
			} catch ({ message }) {
				// No tests in module

				if (message.includes('No versions available')) {
					throw new Info(`(no tests, ${bold(blue(`skipped`))})`)
				}

				// Tests fail
				else if (message.includes('failed')) {
					error = true

					throw new Error(`(${bold(red('failed'))})`)
				}
			}

			// No tests in module

			if (result.includes('0 projects')) {
				throw new Info(`(no tests, ${bold(blue(`skipped`))})`)
			}
		},
		text: `${moduleName} ${dim(CMDS.test)}`,
		exitOnFail,
	})

	// Throw an error if failed

	if (error) {
		throw new Error()
	}

	// Log empty line if showing description

	if (showDescription) {
		log('')
	}
}
