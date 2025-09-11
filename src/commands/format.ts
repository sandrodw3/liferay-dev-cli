import { blue, bold, dim, magenta, red, white, yellow } from 'std/colors'

import { getConfigEntry } from 'config'
import { Failure } from 'exceptions'
import { getChangedFiles, getCurrentBranch } from 'git'
import { getModuleType, selectModule } from 'liferay'
import {
	checkFzf,
	getBaseName,
	join,
	log,
	runAsyncFunction,
	runCommand,
} from 'tools'

type Props = {
	currentBranch?: boolean
	defaultOutput?: boolean
	module?: boolean
}

/**
 * Format a module or a branch, depending on options
 */

export async function format({ currentBranch, defaultOutput, module }: Props) {
	// No branch and module options, so format current module

	if (!module && !currentBranch) {
		await formatModule(Deno.cwd(), defaultOutput)
	}
	// Format current branch
	else if (currentBranch) {
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

async function formatCurrentBranch(defaultOutput: Props['defaultOutput']) {
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

		log(
			`\nRunning ${bold(white('npx node-scripts check:ci --current-branch'))} in ${bold(
				blue('modules')
			)}\n`
		)

		await runCommand('npx node-scripts check:ci --current-branch', {
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
			} catch (error) {
				if (error instanceof Error) {
					throw new Failure({
						message: `(found ${bold(red('errors'))})`,
						trace: error.message,
					})
				}
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
			try {
				const output = await runCommand(
					'npx node-scripts check:tsc --current-branch'
				)

				if (output.includes('error')) {
					throw new Failure({
						message: `(found ${bold(red('errors'))})`,
						trace: output,
					})
				}
			} catch (error) {
				if (error instanceof Error) {
					throw new Failure({
						message: `(found ${bold(red('errors'))})`,
						trace: error.message,
					})
				}
			}
		},
		onError: () => {
			error = true
		},
		text: `modules ${dim('npx node-scripts check:tsc --current-branch')}`,
	})

	await runAsyncFunction({
		fn: async () => {
			try {
				const output = await runCommand(
					'npx node-scripts check:ci --current-branch'
				)

				if (output.includes('error')) {
					throw new Failure({
						message: `(found ${bold(red('errors'))})`,
						trace: output,
					})
				}
			} catch (error) {
				if (error instanceof Error) {
					throw new Failure({
						message: `(found ${bold(red('errors'))})`,
						trace: error.message,
					})
				}
			}
		},
		onError: () => {
			error = true
		},
		text: `modules ${dim('npx node-scripts check:ci --current-branch')}`,
	})

	if (error) {
		Deno.exit(1)
	}
}

/**
 * Allow selecting a module with fuzzy search and formats it
 */

async function formatSelectedModule(defaultOutput: Props['defaultOutput']) {
	await checkFzf()

	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to format it`
	)

	const module = await selectModule({
		exclude: ['root', 'root-module', 'parent-module', 'playwright'],
	})

	if (!module) {
		return
	}

	log('')

	await formatModule(module, defaultOutput)
}

/**
 * Format the given module
 */

async function formatModule(
	module: string,
	defaultOutput: Props['defaultOutput']
) {
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
			} catch (error) {
				if (error instanceof Error) {
					throw new Failure({
						message: `(found ${bold(red('errors'))})`,
						trace: error.message,
					})
				}
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
				throw new Failure({
					message: `(found ${bold(red('errors'))})`,
					trace: output,
				})
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
