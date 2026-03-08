import { blue, bold, white, yellow } from 'std/colors'
import { walkSync } from 'std/walk'

import { getConfigEntry } from '@lib/config'
import {
	checkFzf,
	folderExists,
	fuzzySearch,
	getBaseName,
	join,
	log,
	runCommand,
} from '@lib/utils'

type Props = {
	module?: boolean
	project?: boolean
	ui?: boolean
}

/**
 * Allow running Playwright tests in a file or module
 */

export async function playwright({ module, project, ui }: Props) {
	await checkFzf()

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

	const list = files.map((file) => ({
		id: file.path,
		name: file.name,
	}))

	const formatPreview = `echo "{}" | sed 's|.*/tests/||; s| .*||'`

	log(
		`Please ${bold(white('select a file'))} and press ${bold(
			blue('ENTER')
		)} to run all tests on it`
	)

	const file = await fuzzySearch(list, formatPreview)

	log('')

	// If file is selected, run its tests

	if (file) {
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

	const list = modules.map((module) => ({
		id: module.path,
		name: module.name,
	}))

	log(
		`Please ${bold(white('select a module'))} and press ${bold(
			blue('ENTER')
		)} to run all tests on it\n`
	)

	const module = await fuzzySearch(list)

	// If file is selected, run its tests

	if (module) {
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

	const list = [...new Set(projects)]
		.sort((a, b) => a.localeCompare(b))
		.map((name) => ({
			id: name,
			name,
		}))

	log(
		`Please ${bold(white('select a project'))} and press ${bold(
			blue('ENTER')
		)} to run all tests on it\n`
	)

	const project = await fuzzySearch(list)

	if (project) {
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
