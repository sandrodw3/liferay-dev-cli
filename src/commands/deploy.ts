import { blue, bold, dim, white, yellow } from 'std/colors'
import { existsSync } from 'std/exists'

import { getCurrentBranch } from 'git'
import {
	deployModule,
	getChangedModules,
	getDeployCommand,
	getModules,
	getPortalPath,
} from 'liferay'
import { fuzzySearch, getBaseName, join, log, run, spawn } from 'tools'

type Props = {
	branch?: boolean
	clean?: boolean
	defaultOutput?: boolean
	module?: boolean
	skipDependencies?: boolean
}

/**
 * Deploys a module or a bunch of them, depending on options
 */

export async function deploy({
	branch,
	clean,
	defaultOutput,
	module,
	skipDependencies,
}: Props) {
	// Check it's a Liferay project

	getPortalPath()

	// No branch and module options, so deploy current module
	if (!module && !branch) {
		await deployCurrentModule(clean, skipDependencies, defaultOutput)
	}
	// Deploy modules modified in branch
	else if (branch) {
		await deployBranchModules(clean, skipDependencies)
	}
	// Allow selecting a specific module to deploy
	else if (module) {
		await deploySelectedModule(clean, skipDependencies, defaultOutput)
	}
}

/**
 * Deploys current module and exits if it's not deployable
 */

async function deployCurrentModule(
	clean?: boolean,
	skipDependencies?: boolean,
	defaultOutput?: boolean
) {
	const module = Deno.cwd()

	checkModuleIsDeployable(module)

	await deployGivenModule(module, clean, skipDependencies, defaultOutput)
}

/**
 * Deploys all modules modified in current branch, including
 * uncommited changes
 */

async function deployBranchModules(
	clean?: boolean,
	skipDependencies?: boolean
) {
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

	const branch = await getCurrentBranch()

	// Calculate and log command description

	let description = clean
		? `${bold(white('Clean'))} deploying `
		: 'Deploying '

	description += `all modules modified in ${bold(blue(`[${branch}]`))} branch`

	if (skipDependencies) {
		description += bold(white(' without rebuilding dependencies'))
	}

	log(`${description}\n`)

	// Deploy changed modules

	modules.sort(compareModules)

	for (const module of modules) {
		const moduleName = getBaseName(module)

		const deployCommand = getDeployCommand({
			module,
			clean,
			skipDependencies,
		})

		await run({
			function: () => deployModule(module, deployCommand),
			message: `${moduleName} ${dim(deployCommand)}`,
		})
	}
}

/**
 * Allows selecting a module with fuzzy search and deploys it
 */

async function deploySelectedModule(
	clean?: boolean,
	skipDependencies?: boolean,
	defaultOutput?: boolean
) {
	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to deploy it\n`
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

	checkModuleIsDeployable(module)

	await deployGivenModule(module, clean, skipDependencies, defaultOutput)
}

/**
 * Checks whether a module is deployable or not
 * and exit if not
 */

function checkModuleIsDeployable(module: string) {
	Deno.chdir(module)

	if (!existsSync('build.gradle')) {
		log(`You are not in a ${bold(yellow('deployable'))} module`)

		Deno.exit(1)
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

/**
 * Deploys the given module
 */

async function deployGivenModule(
	module: string,
	clean?: boolean,
	skipDependencies?: boolean,
	defaultOutput?: boolean
) {
	const moduleName = getBaseName(module)

	// Calculate and log command description

	let description = clean
		? `${bold(white('Clean'))} deploying `
		: 'Deploying '

	description += bold(blue(moduleName))

	if (skipDependencies) {
		description += bold(white(' without rebuilding dependencies'))
	}

	log(`${description}\n`)

	const deployCommand = getDeployCommand({
		module,
		clean,
		skipDependencies,
	})

	if (defaultOutput) {
		const gradlePath = join(getPortalPath(), 'gradlew')

		await spawn(`${gradlePath} ${deployCommand}`)
	} else {
		await run({
			function: () => deployModule(module, deployCommand),
			message: `${moduleName} ${dim(deployCommand)}`,
		})
	}
}
