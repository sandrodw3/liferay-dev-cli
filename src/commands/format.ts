import { blue, bold, dim, magenta, red, white, yellow } from 'std/colors'

import { getConfigEntry } from 'config'
import { getChangedFiles, getCurrentBranch } from 'git'
import { getModules, getModuleType } from 'liferay'
import {
	fuzzySearch,
	getBaseName,
	join,
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
 * Format a module or a branch, depending on options
 */

export async function format({ branch, defaultOutput, module }: Props) {
	// No branch and module options, so format current module

	if (!module && !branch) {
		await formatModule(Deno.cwd(), defaultOutput)
	}
	// Format current branch
	else if (branch) {
		await formatCurrentBranch(defaultOutput)
	}
	// Allow selecting a specific module to deploy
	else if (module) {
		await formatSelectedModule(defaultOutput)
	}
}

/**
 * Format the current branch
 */

async function formatCurrentBranch(defaultOutput?: boolean) {
	// Check it's not base branch

	const branch = await getCurrentBranch()
	const baseBranch = await getConfigEntry('base.branch')

	if (branch === baseBranch) {
		log(
			`You are in ${bold(
				blue(`[${baseBranch}]`)
			)}, please move to another branch`
		)

		return
	}

	// Check there are actually changes

	const files = await getChangedFiles()

	if (!files.length) {
		log(`You have ${bold(yellow('no changes'))} in this branch`)

		return
	}

	// Check format in the whole branch

	const branchName = await getCurrentBranch()

	log(
		`Checking ${bold(white('format'))} in ${bold(
			blue(`[${branchName}]`)
		)} branch\n`
	)

	const portalPath = await getConfigEntry('portal.path')

	if (defaultOutput) {
		Deno.chdir(`${portalPath}/portal-impl`)

		log(
			`Running ${bold(white('ant format-source-current-branch'))} in ${bold(
				blue('portal-impl')
			)}\n`
		)

		await runCommand('ant format-source-current-branch', { spawn: true })

		Deno.chdir(`${portalPath}/modules`)

		log(
			`\nRunning ${bold(white('npx node-scripts check:tsc --current-branch'))} in ${bold(
				blue('modules')
			)}\n`
		)

		await runCommand('npx node-scripts check:tsc --current-branch', {
			spawn: true,
		})

		return
	}

	Deno.chdir(`${portalPath}/portal-impl`)

	let error = false

	await runAsyncFunction({
		fn: async () => {
			const previousDiff = await runCommand('git diff')

			try {
				await runCommand('ant format-source-current-branch')
			} catch {
				throw new Error(
					`(found ${bold(red('errors'))}, please fix them)`
				)
			}

			const diff = await runCommand('git diff')

			if (diff && previousDiff !== diff) {
				throw new Error(
					`(generated ${bold(red('changes'))}, please commit them)`
				)
			}
		},
		onError: () => {
			error = true
		},
		text: `portal-impl ${dim('ant format-source-current-branch')}`,
	})

	Deno.chdir(`${portalPath}/modules`)

	await runAsyncFunction({
		fn: async () => {
			const output = await runCommand(
				'npx node-scripts check:tsc --current-branch'
			)

			if (output.includes('error')) {
				throw new Error(`(found ${bold(red('errors'))})`)
			}
		},
		onError: () => {
			error = true
		},
		text: `modules ${dim('npx node-scripts check:tsc --current-branch')}`,
	})

	if (error) {
		Deno.exit(1)
	}
}

/**
 * Allow selecting a module with fuzzy search and formats it
 */

async function formatSelectedModule(defaultOutput?: boolean) {
	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to format it\n`
	)

	const modules = await getModules({
		exclude: ['root', 'root-module', 'parent-module', 'playwright'],
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

	await formatModule(module, defaultOutput)
}

/**
 * Format the given module
 */

async function formatModule(module: string, defaultOutput?: boolean) {
	const moduleName = getBaseName(module)
	const moduleType = await getModuleType(module)

	if (moduleType !== 'standard-module') {
		log(
			`${bold(blue(moduleName))} is ${bold(yellow('not formattable'))}, please run ${bold(
				magenta('lfr format -b')
			)} to format the whole branch`
		)

		return
	}

	log(`Checking ${bold(white('format'))} in ${bold(blue(moduleName))}\n`)

	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')

	Deno.chdir(module)

	if (defaultOutput) {
		log(`Running ${bold(white('formatSource'))}\n`)

		await runCommand(`${gradlePath} formatSource`, { spawn: true })

		log(`\nRunning ${bold(white('npx node-scripts check:tsc'))}\n`)

		const output = await runCommand('npx node-scripts check:tsc')

		log(
			output.includes('No versions available') || !output
				? 'Completed successfully!'
				: output
		)

		return
	}

	let error = false

	await runAsyncFunction({
		fn: async () => {
			const previousDiff = await runCommand('git diff')

			try {
				await runCommand(`${gradlePath} formatSource`)
			} catch {
				throw new Error(`(found ${bold(red('errors'))})`)
			}

			const diff = await runCommand('git diff')

			if (diff && previousDiff !== diff) {
				throw new Error(
					`(generated ${bold(red('changes'))}, please commit them)`
				)
			}
		},
		onError: () => {
			error = true
		},
		text: `${moduleName} ${dim('formatSource')}`,
	})

	await runAsyncFunction({
		fn: async () => {
			const output = await runCommand('npx node-scripts check:tsc')

			if (output) {
				throw new Error(`(found ${bold(red('errors'))})`)
			}
		},
		onError: () => {
			error = true
		},
		text: `${moduleName} ${dim('npx node-scripts check:tsc')}`,
	})

	if (error) {
		Deno.exit(1)
	}
}