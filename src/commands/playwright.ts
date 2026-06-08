import { runCommand } from 'sdw3/lab/exec'
import { getBaseName } from 'sdw3/lab/path'
import { fuzzySelect } from 'sdw3/lab/prompt'
import { blue, bold, white, yellow } from 'std/colors'
import { walkSync } from 'std/walk'

import { getConfigEntry } from '@lib/config'
import { folderExists, goUp, join, log } from '@lib/utils'

type Props = {
	module?: boolean
	project?: boolean
	ui?: boolean
}

/**
 * Allow running Playwright tests in a file or module
 */

export async function playwright({ module, project, ui }: Props) {
	if (module) {
		await runTestsInSelectedModule(ui)
	} else if (project) {
		await runTestsInSelectedProject(ui)
	} else {
		await runTestsInSelectedFile(ui)
	}
}

/**
 * Return Playwright folder path
 */

async function getPlaywrightPath() {
	const portalPath = await getConfigEntry('portal.path')

	const playwrightPath = `${portalPath}/modules/test/playwright`

	if (!folderExists(playwrightPath)) {
		log(
			`There is ${bold(yellow('no playwright folder'))} in this ${bold(blue('Liferay'))} project`
		)

		Deno.exit(0)
	}

	return `${portalPath}/modules/test/playwright`
}

/**
 * Allow selecting a test file and run all tests on it
 */

async function runTestsInSelectedFile(ui: Props['ui']) {
	const playwrightPath = await getPlaywrightPath()

	Deno.chdir(playwrightPath)

	// Build the list of files for the fuzzy search and execute it

	const files = [...walkSync(playwrightPath, { exts: ['.spec.ts'] })]

	files.sort((a, b) => a.name.localeCompare(b.name))

	const file = await fuzzySelect({
		message: 'Select a file to test',
		options: files.map((file) => ({
			value: file.path,
			label: file.name,
			description: goUp(file.path).split('playwright/tests/').pop(),
		})),
	})

	// If file is selected, run its tests

	if (file) {
		log()

		await runTestsInPath(file, ui)
	}
}

/**
 * Allow selecting a module and run all tests on it
 */

async function runTestsInSelectedModule(ui: Props['ui']) {
	const playwrightPath = await getPlaywrightPath()

	Deno.chdir(playwrightPath)

	// Build the list of modules for the fuzzy search and execute it

	const modules = [
		...walkSync(join(playwrightPath, 'tests'), {
			maxDepth: 1,
		}),
	].filter(({ name }) => name !== 'tests')

	modules.sort((a, b) => a.name.localeCompare(b.name))

	const module = await fuzzySelect({
		message: 'Select a module to test',
		options: modules.map((module) => ({
			value: module.path,
			label: module.name,
		})),
	})

	// If file is selected, run its tests

	if (module) {
		log()

		await runTestsInPath(module, ui)
	}
}

/**
 * Allow selecting a project and run all tests on it
 */

async function runTestsInSelectedProject(ui: Props['ui']) {
	const playwrightPath = await getPlaywrightPath()

	Deno.chdir(playwrightPath)

	// Build the list of projects for the fuzzy search and execute it

	const configFiles = [...walkSync(playwrightPath, { includeDirs: false })]
		.filter(({ name }) => name === 'config.ts')
		.map(({ path }) => path)

	const projects = configFiles
		.map((path) => {
			const content = Deno.readTextFileSync(path)
			const match = content.match(/name:\s*['\"]([^'\"]+)['\"]/)

			return match?.[1]
		})
		.filter((name): name is string => Boolean(name))

	const project = await fuzzySelect({
		message: 'Select a project to test',
		options: [...new Set(projects)]
			.sort((a, b) => a.localeCompare(b))
			.map((name) => ({
				value: name,
				label: name,
			})),
	})

	if (project) {
		log()

		await runTestsInProject(project, ui)
	}
}

/**
 * Run tests in selected path, whether it is a file or a module
 */

async function runTestsInPath(path: string, ui: Props['ui']) {
	let description = `${bold(white('Running tests'))} in ${bold(blue(getBaseName(path)))}`

	if (ui) {
		description = description.concat(` with ${bold(white('UI mode'))}`)
	}

	log(description)

	await runCommand(`npx playwright test ${path}${ui ? ' --ui' : ''}`, {
		spawn: true,
	})
}

/**
 * Run tests in selected Playwright project
 */

async function runTestsInProject(projectName: string, ui: Props['ui']) {
	let description = `${bold(white('Running tests'))} in project ${bold(blue(projectName))}`

	if (ui) {
		description = description.concat(` with ${bold(white('UI mode'))}`)
	}

	log(description)

	await runCommand(
		`npx playwright test --project=${projectName}${ui ? ' --ui' : ''}`,
		{
			spawn: true,
		}
	)
}
