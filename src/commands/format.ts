import { blue, bold, dim, white, yellow } from 'std/colors'

import { getChangedFiles, getCurrentBranch } from 'git'
import {
	CMDS,
	formatBranch,
	formatFile,
	formatModule,
	getModules,
	getPortalPath,
} from 'liferay'
import { execute, fuzzySearch, getBaseName, join, log, run, spawn } from 'tools'

type Props = {
	branch?: boolean
	defaultOutput?: boolean
	file?: string
	module?: boolean
}

/**
 * Formats a js file, a module or a branch, depending on options.
 */

export async function format({ branch, defaultOutput, file, module }: Props) {
	// Check it's a Liferay project

	getPortalPath()

	// No branch and module options, so format current module
	if (!module && !branch && !file) {
		await formatCurrentModule(defaultOutput)
	}
	// Format current branch
	if (branch) {
		await formatCurrentBranch(defaultOutput)
	}
	// Format the given file
	else if (file) {
		await formatGivenFile(file)
	}
	// Allow selecting a specific module to deploy
	else if (module) {
		await formatSelectedModule(defaultOutput)
	}
}

/**
 * Formats the current module
 */

async function formatCurrentModule(defaultOutput?: boolean) {
	await formatGivenModule(Deno.cwd(), defaultOutput)
}

/**
 * Formats the current branch
 */

async function formatCurrentBranch(defaultOutput?: boolean) {
	// Check it's not master

	const branch = await getCurrentBranch()

	if (branch === 'master') {
		log(
			`You are in ${bold(
				blue('[master]')
			)}, please move to another branch`
		)

		Deno.exit(1)
	}

	// Check there are actually changes

	const files = await getChangedFiles()

	if (!files.length) {
		log(`You have ${bold(yellow('no changes'))} in this branch`)

		Deno.exit(1)
	}

	// Let user know they have uncommited changes

	const diff = await execute('git diff')

	if (diff) {
		log(
			`You have ${bold(
				yellow('uncommited changes')
			)}, the results of this analysis may not be conclusive.\n`
		)
	}

	// Format the branch

	const branchName = await getCurrentBranch()

	log(
		`Checking ${bold(white('format'))} in ${bold(
			blue(`[${branchName}]`)
		)} branch\n`
	)

	if (defaultOutput) {
		const portalPath = getPortalPath()

		Deno.chdir(`${portalPath}/portal-impl`)

		await spawn(CMDS.formatBranch)
	} else {
		await run({
			function: () => formatBranch(branchName),
			message: `${branchName} ${dim(CMDS.formatBranch)}`,
			callbacks: {
				error: () => Deno.exit(1),
				warning: () => Deno.exit(1),
			},
		})
	}
}

/**
 * Formats the given file
 */

async function formatGivenFile(file: string) {
	const fileName = getBaseName(file)

	await run({
		function: () => formatFile(file),
		message: `${fileName} ${dim('liferay-npm-scripts prettier')}`,
	})
}

/**
 * Allows selecting a module with fuzzy search and formats it
 */

async function formatSelectedModule(defaultOutput?: boolean) {
	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to format it\n`
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

	await formatGivenModule(module, defaultOutput)
}

/**
 * Formats the given module
 */

async function formatGivenModule(module: string, defaultOutput?: boolean) {
	const moduleName = getBaseName(module)

	log(
		`Checking ${bold(white('format'))} in ${bold(
			blue(`[${moduleName}]`)
		)}\n`
	)

	if (defaultOutput) {
		Deno.chdir(module)

		const gradlePath = join(getPortalPath(), 'gradlew')

		await spawn(`${gradlePath} formatSource`)
	} else {
		await run({
			function: () => formatModule(module),
			message: `${moduleName} ${dim('formatSource')}`,
		})
	}
}
