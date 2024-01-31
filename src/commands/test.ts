import { blue, bold, dim, white, yellow } from 'std/colors'

import { getCurrentBranch } from 'git'
import { getChangedModules, getModules, getPortalPath, runTests } from 'liferay'
import { fuzzySearch, getBaseName, log, run, spawn } from 'tools'

type Props = {
	branch?: boolean
	defaultOutput?: boolean
	module?: boolean
}

/**
 * Runs frontend tests in a module or a bunch of them,
 * depending on options
 */

export async function test({ branch, defaultOutput, module }: Props) {
	// Check it's a Liferay project

	getPortalPath()

	// No branch and module options, so run tests in current module
	if (!module && !branch) {
		await runTestsInCurrentModule(defaultOutput)
	}
	// Run tests in all modules modified in branch
	else if (branch) {
		await runTestsInBranch()
	}
	// Allow selecting a specific module to run tests on it
	else if (module) {
		await runTestsInSelectedModule(defaultOutput)
	}
}

/**
 * Runs tests in current module and exits if fails
 */

async function runTestsInCurrentModule(defaultOutput?: boolean) {
	const module = Deno.cwd()

	await runTestsInGivenModule(module, defaultOutput)
}

/**
 * Run tests in all modules modified in current branch, including
 * uncommited changes
 */

async function runTestsInBranch() {
	// Move to portal

	const portalPath = getPortalPath()

	Deno.chdir(portalPath)

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

	// Log command description

	const branch = await getCurrentBranch()

	log(
		`Running ${bold(
			white('frontend tests')
		)} in all modules modified in ${bold(blue(`[${branch}]`))} branch\n`
	)

	// Run tests in changed modules

	let error = false

	for (const module of modules) {
		const moduleName = getBaseName(module)

		await run({
			function: () => runTests(module),
			message: `${moduleName} ${dim('liferay-npm-scripts test')}`,
			callbacks: {
				error: () => (error = true),
			},
		})
	}

	if (error) {
		Deno.exit(1)
	}
}

/**
 * Allows selecting a module with fuzzy search to run tests on it
 */

async function runTestsInSelectedModule(defaultOutput?: boolean) {
	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to run tests\n`
	)

	const modules = getModules()

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

		Deno.exit(1)
	}

	await runTestsInGivenModule(module, defaultOutput)
}

/**
 * Runs tests in the given module and exits with error if fails
 */

async function runTestsInGivenModule(module: string, defaultOutput?: boolean) {
	const moduleName = getBaseName(module)

	log(
		`Running ${bold(white('frontend tests'))} in ${bold(
			blue(moduleName)
		)}\n`
	)

	if (defaultOutput) {
		Deno.chdir(module)

		await spawn('npx liferay-npm-scripts test')
	} else {
		await run({
			function: () => runTests(module),
			message: `${moduleName} ${dim('liferay-npm-scripts test')}`,
			callbacks: {
				error: () => Deno.exit(1),
			},
		})
	}
}
