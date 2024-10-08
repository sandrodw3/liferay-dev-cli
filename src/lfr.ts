import { Command, EnumType, ValidationError } from 'cliffy/command'
import { blue, bold, cyan, green, red, white } from 'std/colors'

import {
	antAll,
	buildLang,
	config,
	deploy,
	find,
	format,
	jest,
	start,
	stop,
	upgrade,
} from 'commands'
import { CONFIG_ENTRY_KEYS, initConfig, readConfig } from 'config'
import { PROFILES } from 'liferay'
import { folderExists, join, log } from 'tools'
import { checkUpdate, getLastCheckDate } from 'version'

// Create command

const VERSION = '1.0.0'

const command = new Command()
	.name('lfr')
	.version(VERSION)
	.description(
		`Command line framework to work with a ${bold(
			blue('Liferay')
		)} portal project`
	)

	// Customize help and version options
	.helpOption('-h, --help', 'Show this help', function (this: Command) {
		showHelp(this)
	})
	.versionOption('-v, --version', 'Show current version of lfr', () =>
		log(`lfr ${bold(cyan(VERSION))}`)
	)

	// Show help if no args are passed
	.action(function (this) {
		if (!Deno.args.length) {
			showHelp(this)

			return
		}
	})

	// Handle validation errors
	.error((error) => {
		if (error instanceof ValidationError && error.cmd) {
			showHelp(error.cmd)

			console.error(red(`\n${bold('Error')}: ${error.message}`))
		}

		Deno.exit(1)
	})

	// Ant all command
	.command('ant-all', `Run ant all in the current Liferay portal project`)
	.type('profile', new EnumType(PROFILES))
	.option(
		'-c, --clean',
		'Remove bundles folder (except properties files) and untracked files from repository before the ant all'
	)
	.option('-d, --default-output', 'Log the default gradle output')
	.option('-p, --profile <profile:profile>', 'Set the given profile')
	.action(({ clean, defaultOutput, profile }) =>
		antAll({ clean, defaultOutput, profile })
	)

	// Build Lang command
	.command('build-lang', 'Execute buildLang in portal-language-lang module')
	.action(() => buildLang())

	// Config command
	.command(
		'config',
		`Allow setting user configuration\n${bold(
			white('[entry]')
		)} options are: ${CONFIG_ENTRY_KEYS.map((entry) => green(entry)).join(
			' | '
		)}`
	)
	.type('config-entry', new EnumType(CONFIG_ENTRY_KEYS))
	.option('-i, --init', 'Ask user for the whole configuration', {
		conflicts: ['show'],
	})
	.option('-s, --show', 'Show current configuration', {
		conflicts: ['init'],
	})
	.arguments('[entry:config-entry] [value:string]')

	.action(({ init, show }, entry, value) => {
		if (!init && !show && (!entry || !value)) {
			throw new ValidationError(
				'Please specify an option or valids config entry and value'
			)
		}

		config({ init, entry, value, show })
	})

	// Deploy command
	.command(
		'deploy',
		'Deploy a module or a bunch of them, depending on options. If no passing options, deploy current module'
	)
	.option(
		'-a, --skip-dependencies',
		'Do not rebuild project dependencies (`gradlew deploy -a`)'
	)
	.option('-b, --branch', 'Deploy all modules modified in current branch', {
		conflicts: ['module'],
	})
	.option(
		'-c, --clean',
		'Clean everything from previous builds (`gradlew clean deploy`)'
	)
	.option('-d, --default-output', 'Log the default gradle output')
	.option('-m, --module', 'Allow selecting a specific module to deploy', {
		conflicts: ['branch'],
	})
	.action(({ branch, clean, defaultOutput, module, skipDependencies }) =>
		deploy({ branch, clean, defaultOutput, module, skipDependencies })
	)

	// Find command
	.command(
		'find',
		'Allow finding a module and getting its path. fzf needs to be installed for this command to work'
	)
	.action(() => find())

	// Format command
	.command(
		'format',
		'Format a module or a branch, depending on options. If no passing options, format current module'
	)
	.option(
		'-b, --branch',
		`Format the current branch by running \`ant format-source-current-branch\` and \`npx node-scripts check:tsc --current-branch\``,
		{
			conflicts: ['module'],
		}
	)
	.option('-d, --default-output', 'Log the default output')
	.option(
		'-m, --module',
		`Allow selecting a specific module to format with \`gradlew formatSource\``,
		{
			conflicts: ['branch'],
		}
	)
	.action(({ branch, defaultOutput, module }) =>
		format({ branch, defaultOutput, module })
	)

	// Jest command
	.command(
		'jest',
		'Run jest tests in a module or a bunch of them, depending on options. If no passing options, run tests in current module'
	)
	.option(
		'-b, --branch',
		'Run tests in all modules modified in current branch',
		{
			conflicts: ['module'],
		}
	)
	.option('-d, --default-output', 'Log the default output')
	.option(
		'-m, --module',
		'Allow selecting a specific module to run tests on it',
		{
			conflicts: ['branch'],
		}
	)
	.action(({ branch, defaultOutput, module }) =>
		jest({ branch, defaultOutput, module })
	)

	// Start command
	.command('start', 'Start portal with latest tomcat version')
	.option('-c, --clean', 'Clean database before starting')
	.action(({ clean }) => start({ clean }))

	// Stop command
	.command('stop', 'Stop portal instance that is currently running')
	.action(() => stop())

	// Upgrade command
	.command('upgrade', 'Upgrade lfr to latest version')
	.action(() => upgrade(VERSION))

/**
 * Show command help
 */

function showHelp(command: Command) {
	log(command.getHelp().trim())
}

/**
 * Main CLI logic
 */

async function lfr() {
	// Create .lfr folder if does not exist

	const folderPath = join(Deno.env.get('HOME')!, '.lfr')

	if (!folderExists(folderPath)) {
		Deno.mkdir(folderPath)
	}

	// Check updates if not upgrading and at least one hour has passed since last check

	const lastCheck = await getLastCheckDate()

	if (
		!Deno.args.includes('upgrade') &&
		Date.now() - lastCheck > 60 * 60 * 1000
	)
		await checkUpdate(VERSION)

	// Init config if it does not exist

	if (!(await readConfig())) {
		await initConfig()
	}

	// Parse args

	command.parse(Deno.args)
}

// Run CLI

await lfr()
