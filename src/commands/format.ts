import { blue, bold, dim, red, white, yellow } from 'std/colors'

import { getConfigEntry } from 'config'
import { getChangedFiles, getCurrentBranch } from 'git'
import { CMDS, getModules } from 'liferay'
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

	// Format the branch

	const branchName = await getCurrentBranch()

	log(
		`Checking ${bold(white('format'))} in ${bold(
			blue(`[${branchName}]`)
		)} branch\n`
	)

	const portalPath = await getConfigEntry('portal.path')

	Deno.chdir(`${portalPath}/portal-impl`)

	if (defaultOutput) {
		await runCommand(CMDS.formatBranch, { spawn: true })

		return
	}

	await runAsyncFunction({
		fn: async () => {
			const previousDiff = await runCommand('git diff')

			try {
				await runCommand(CMDS.formatBranch)
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
		text: `${branch} ${dim(CMDS.formatBranch)}`,
	})
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

	await formatModule(module, defaultOutput)
}

/**
 * Format the given module
 */

async function formatModule(module: string, defaultOutput?: boolean) {
	const moduleName = getBaseName(module)

	log(
		`Checking ${bold(white('format'))} in ${bold(
			blue(`[${moduleName}]`)
		)}\n`
	)

	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')

	const command = `${gradlePath} ${CMDS.formatSource}`

	Deno.chdir(module)

	if (defaultOutput) {
		await runCommand(command, { spawn: true })

		return
	}

	await runAsyncFunction({
		fn: async () => {
			const previousDiff = await runCommand('git diff')

			try {
				await runCommand(command)
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
		text: `${moduleName} ${dim(CMDS.formatSource)}`,
	})
}
