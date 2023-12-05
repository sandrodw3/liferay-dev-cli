import { Command, EnumType, ValidationError } from 'cliffy/command'
import { blue, bold, green, red, white } from 'std/colors'

import {
	antAll,
	buildLang,
	config,
	deploy,
	find,
	format,
	start,
	test,
} from 'commands'
import { CONFIG_ENTRY_KEYS, getConfig, initConfig } from 'config'
import { CMDS, PROFILES } from 'liferay'
import { log } from 'tools'

const Profile = new EnumType(PROFILES)
const ConfigEntry = new EnumType(CONFIG_ENTRY_KEYS)

// Create command

const command = new Command()
	.name('lfr')
	.description(
		`Command line framework to work with a ${bold(
			blue('Liferay')
		)} portal project`
	)
	.error((error) => {
		if (error instanceof ValidationError) {
			error.cmd?.showHelp()
		}

		console.error(red(`${bold('Error')}: ${error.message}`))

		Deno.exit(1)
	})

	// Ant all command
	.command('ant-all', `Runs ant all in the current Liferay portal project`)
	.type('profile', Profile)
	.option(
		'-c, --clean',
		'Cleans untracked files from repository before the ant all'
	)
	.option('-d, --default-output', 'Logs the default gradle output')
	.option('-p, --profile <profile:profile>', 'Sets the given profile')
	.action(({ clean, defaultOutput, profile }) =>
		antAll({ clean, defaultOutput, profile })
	)

	// Build Lang command
	.command('build-lang', 'Executes buildLang in portal-language-lang module')
	.action(() => buildLang())

	// Config command
	.command(
		'config',
		`Allows setting user configuration\n${bold(
			white('[entry]')
		)} options are: ${CONFIG_ENTRY_KEYS.map((entry) => green(entry)).join(
			' | '
		)}`
	)
	.type('config-entry', ConfigEntry)
	.option('-i, --init', 'Asks user for the whole configuration', {
		conflicts: ['show'],
	})
	.option('-s, --show', 'Shows current configuration', {
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
		'Deploys a module or a bunch of them, depending on options'
	)
	.option('-a, --skip-dependencies', 'Does not rebuild project dependencies')
	.option('-b, --branch', 'Deploys all modules modified in current branch', {
		conflicts: ['module'],
	})
	.option('-c, --clean', 'Cleans everything from previous builds')
	.option('-d, --default-output', 'Logs the default gradle output')
	.option('-m, --module', 'Allows selecting a specific module to deploy', {
		conflicts: ['branch'],
	})
	.action(({ branch, clean, defaultOutput, module, skipDependencies }) =>
		deploy({ branch, clean, defaultOutput, module, skipDependencies })
	)

	// Find command
	.command('find', 'Allows finding a module and getting its path')
	.action(() => find())

	// Format command
	.command(
		'format',
		'Formats a js file, a module or a branch, depending on options'
	)
	.option(
		'-b, --branch',
		`Formats the current branch with '${CMDS.formatBranch}'.`,
		{
			conflicts: ['file', 'module'],
		}
	)
	.option('-d, --default-output', 'Logs the default output', {
		conflicts: ['file'],
	})
	.option(
		'-f, --file <file>',
		'Formats the given file with `liferay-npm-scripts prettier` and replace its content',
		{
			conflicts: ['branch', 'module'],
		}
	)
	.option(
		'-m, --module',
		'Allows selecting a specific module to format with `gradlew formatSource`',
		{
			conflicts: ['branch', 'file'],
		}
	)
	.action(({ branch, defaultOutput, file, module }) =>
		format({ branch, defaultOutput, file, module })
	)

	// Start command
	.command('start', 'Starts portal with latest tomcat version')
	.option('-c, --clean', 'Cleans database before starting')
	.action(({ clean }) => start({ clean }))

	// Test command
	.command(
		'test',
		'Runs jest tests in a module or a bunch of them, depending on options'
	)
	.option(
		'-b, --branch',
		'Runs tests in all modules modified in current branch',
		{
			conflicts: ['module'],
		}
	)
	.option('-d, --default-output', 'Logs the default output')
	.option(
		'-m, --module',
		'Allows selecting a specific module to run tests on it',
		{
			conflicts: ['branch'],
		}
	)
	.action(({ branch, defaultOutput, module }) =>
		test({ branch, defaultOutput, module })
	)

// Init config if it does not exist

if (!(await getConfig())) {
	await initConfig()

	log('')
}

// Parse args or show help if no args are passed

if (Deno.args.length) {
	command.parse(Deno.args)
} else {
	command.showHelp()
}
