import { Confirm, prompt } from 'cliffy/prompt'
import { bold, green, red, underline, yellow } from 'std/colors'

import { getCurrentBranch } from 'git'
import {
	formatBranch,
	getChangedModules,
	getModuleName,
	getPortalRoot,
	runTests,
} from 'liferay'
import { execute, log, run } from 'tools'

/**
 * Analyzes the current branch by passing format source
 * and frontend tests
 */

export async function analyzeBranch() {
	// Check whether it's a Liferay project or not

	getPortalRoot()

	// Check it's not master

	const branch = await getCurrentBranch()

	if (branch === 'master') {
		log(
			`You are in ${bold(
				green('[master]')
			)}, please move to another branch`
		)

		Deno.exit(1)
	}

	// Check there are actually changes

	const modules = await getChangedModules()

	if (!modules.length) {
		log(
			`You have ${bold(
				yellow('no changes')
			)} in any module in this branch`
		)

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

	// Ask user for desired tasks

	const answers = await prompt([
		{
			message: 'Do you want to run format source?',
			name: 'fs',
			type: Confirm,
			default: true,
		},
		{
			message: 'Do you want to run frontend tests?',
			name: 'ft',
			type: Confirm,
			default: true,
		},
	])

	const { fs, ft } = answers

	let error = false

	// Run Format Source

	if (fs) {
		log(`\n${bold(underline('Format Source'))}`)

		await run({
			function: () => formatBranch(),
			indent: 2,
			message: 'Running format-source-current-branch...',
			callbacks: {
				error: () => (error = true),
				warning: () => (error = true),
			},
		})
	}

	// Run Frontend Tests

	if (ft) {
		log(`\n${bold(underline('Frontend tests'))}`)

		for (const module of modules) {
			const moduleName = getModuleName(module)

			await run({
				function: () => runTests(module),
				indent: 2,
				message: moduleName,
				callbacks: {
					error: () => (error = true),
				},
			})
		}
	}

	// Exit if some error was found

	if (error) {
		log(
			`\nSomething went wrong, please fix the ${bold(
				red('errors')
			)} and try again\n`
		)

		Deno.exit(1)
	}

	log('')
}
