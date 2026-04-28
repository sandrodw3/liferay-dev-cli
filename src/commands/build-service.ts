import { Confirm } from 'cliffy/prompt'
import { runAsyncFunction, runCommand } from 'sdw3/lab/exec'
import { checkFzf } from 'sdw3/lab/fzf'
import { getBaseName } from 'sdw3/lab/path'
import { blue, bold, dim, green, red, white, yellow } from 'std/colors'

import { getConfigEntry } from '@lib/config'
import { getCurrentBranch } from '@lib/git'
import { getChangedModules, getModuleType, selectModule } from '@lib/liferay'
import { join, log } from '@lib/utils'

type Props = {
	currentBranch?: boolean
	defaultOutput?: boolean
	module?: boolean
}

/**
 * Run buildService on a module or a bunch of them, depending on options
 */

export async function buildService({
	currentBranch,
	defaultOutput,
	module,
}: Props) {
	// No branch and module options, so run buildService on current module

	if (!module && !currentBranch) {
		await buildServiceCurrentModule(defaultOutput)
	}
	// Run buildService on all modules modified in branch
	else if (currentBranch) {
		await buildServiceBranchModules(defaultOutput)
	}
	// Allow selecting a specific module to run buildService
	else if (module) {
		await buildServiceSelectedModule(defaultOutput)
	}
}

/**
 * Run buildService on the current module
 */

async function buildServiceCurrentModule(defaultOutput?: boolean) {
	const module = Deno.cwd()

	const moduleName = getBaseName(module)
	const moduleType = await getModuleType(module)

	if (moduleType !== 'service-module') {
		log(
			`${bold(blue(moduleName))} is ${bold(yellow('not a service module'))}`
		)

		Deno.exit(1)
	}

	await buildServiceModule({ module, defaultOutput })
}

/**
 * Run buildService on all modules modified in current branch, including
 * uncommited changes
 */

async function buildServiceBranchModules(defaultOutput?: boolean) {
	// Move to portal

	const portalPath = await getConfigEntry('portal.path')

	Deno.chdir(portalPath)

	// Check there are actually changes

	const modules = await getChangedModules({
		include: ['service-module'],
	})

	// Ask user if there are more than 10 modules with changes

	if (modules.length > 10) {
		if (
			!(await Confirm.prompt({
				message: `You are about to run buildService on ${modules.length} modules, do you want to continue?`,
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
			)} in any service module in this branch`
		)

		Deno.exit(0)
	}

	const branch = await getCurrentBranch()
	const baseBranch = await getConfigEntry('base.branch')

	// Log description

	log(
		`Executing ${bold(white('buildService'))} on all service modules modified in ${bold(
			blue(`[${branch}]`)
		)} branch comparing with ${bold(blue(`[${baseBranch}]`))}\n`
	)

	// Execute buildService on changed modules

	const result: Array<{ module: string; status: 'failed' | 'passed' }> = []

	for (const [i, module] of modules.entries()) {
		if (i > 0 && result[i - 1].status === 'failed') {
			log()
		}

		const passed = await buildServiceModule({
			module,
			defaultOutput,
			showDescription: !!defaultOutput,
		})

		if (defaultOutput && i < modules.length - 1) {
			log()
		}

		result.push({ module, status: passed ? 'passed' : 'failed' })
	}

	if (result.some(({ status }) => status === 'failed')) {
		log(bold(white('\nSummary:\n')))

		for (const { module, status } of result) {
			if (status === 'passed') {
				log(
					`${bold(green('√'))} ${getBaseName(module)}: completed ${bold(green('successfully'))}`
				)
			} else if (status === 'failed') {
				log(
					`${bold(red('X'))} ${getBaseName(module)}: ${bold(red('failed'))} to run buildService`
				)
			}
		}

		Deno.exit(1)
	}
}

/**
 * Allow selecting a module with fuzzy search and run buildService on it
 */

async function buildServiceSelectedModule(defaultOutput?: boolean) {
	await checkFzf()

	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to run buildService on it`
	)

	const module = await selectModule({
		include: ['service-module'],
	})

	if (!module) {
		Deno.exit(0)
	}

	log()

	await buildServiceModule({ module, defaultOutput })
}

/**
 * Run buildService on the given module
 */

async function buildServiceModule({
	module,
	defaultOutput,
	showDescription = true,
}: {
	module: string
	defaultOutput?: boolean
	showDescription?: boolean
}) {
	const moduleName = getBaseName(module)

	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')

	// Show description

	if (showDescription) {
		log(
			`Executing ${bold(white('buildService'))} on ${bold(blue(moduleName))}\n`
		)
	}

	// Run buildService on module

	Deno.chdir(module)

	if (defaultOutput) {
		await runCommand(`${gradlePath} buildService`, { spawn: true })

		return true
	}

	return await runAsyncFunction({
		fn: async () => {
			await runCommand(`${gradlePath} buildService`)
		},
		text: `${moduleName} ${dim('buildService')}`,
	})
}
