import { Command, EnumType, ValidationError } from 'cliffy/command'
import { bold, red } from 'std/colors'

import { antAll, buildLang, deploy, find, format, start, test } from 'commands'
import { CMDS } from 'liferay'

const Profile = new EnumType(['dxp', 'portal'])

// Create command

const command = await new Command()
	.name('lfr')
	.description(
		'Command line framework to work with a Liferay Portal project.'
	)
	.error((error) => {
		if (error instanceof ValidationError) {
			error.cmd?.showHelp()
		}

		console.error(red(`${bold('Error')}: ${error.message}`))

		Deno.exit(1)
	})

	// Ant all command
	.command('ant-all', 'Runs ant all in the current Liferay project.')
	.type('profile', Profile)
	.option(
		'-c, --clean',
		'Cleans untracked files from repository before the ant all.'
	)
	.option('-d, --default-output', 'Logs the default gradle output.')
	.option('-p, --profile <profile:profile>', 'Sets the given profile.')
	.action(({ clean, defaultOutput, profile }) =>
		antAll({ clean, defaultOutput, profile })
	)

	// Build Lang command
	.command('build-lang', 'Executes buildLang in portal-language-lang module.')
	.action(() => buildLang())

	// Deploy command
	.command(
		'deploy',
		'Deploys a module or a bunch of them, depending on options.'
	)
	.option('-a, --skip-dependencies', 'Does not rebuild project dependencies.')
	.option('-b, --branch', 'Deploys all modules modified in current branch.', {
		conflicts: ['module'],
	})
	.option('-c, --clean', 'Cleans everything from previous builds.')
	.option('-d, --default-output', 'Logs the default gradle output.')
	.option('-m, --module', 'Allows selecting a specific module to deploy.', {
		conflicts: ['branch'],
	})
	.action(({ branch, clean, defaultOutput, module, skipDependencies }) =>
		deploy({ branch, clean, defaultOutput, module, skipDependencies })
	)

	// Find command
	.command('find', 'Allows finding a module and getting its path.')
	.action(() => find())

	// Format command
	.command(
		'format',
		'Formats a js file, a module or a branch, depending on options.'
	)
	.option(
		'-b, --branch',
		`Formats the current branch with '${CMDS.formatBranch}'.`,
		{
			conflicts: ['file', 'module'],
		}
	)
	.option('-d, --default-output', 'Logs the default output.', {
		conflicts: ['file'],
	})
	.option(
		'-f, --file <file>',
		'Formats the given file with `liferay-npm-scripts prettier` and replace its content.',
		{
			conflicts: ['branch', 'module'],
		}
	)
	.option(
		'-m, --module',
		'Allows selecting a specific module to format with `gradlew formatSource`.',
		{
			conflicts: ['branch', 'file'],
		}
	)
	.action(({ branch, defaultOutput, file, module }) =>
		format({ branch, defaultOutput, file, module })
	)

	// Start command
	.command('start', 'Starts portal with latest tomcat version.')
	.option('-c, --clean', 'Cleans database before starting.')
	.action(({ clean }) => start({ clean }))

	// Test command
	.command(
		'test',
		'Runs frontend tests in a module or a bunch of them, depending on options.'
	)
	.option(
		'-b, --branch',
		'Runs tests in all modules modified in current branch.',
		{
			conflicts: ['module'],
		}
	)
	.option('-d, --default-output', 'Logs the default output.', {
		conflicts: ['branch'],
	})
	.option(
		'-m, --module',
		'Allows selecting a specific module to run tests on it.',
		{
			conflicts: ['branch'],
		}
	)
	.action(({ branch, defaultOutput, module }) =>
		test({ branch, defaultOutput, module })
	)

// Parse args or show help if no args are passed

if (Deno.args.length) {
	command.parse(Deno.args)
} else {
	command.showHelp()
}
