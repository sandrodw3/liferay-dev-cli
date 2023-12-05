import { Command } from 'cliffy/command'

import { analyzeBranch, deploy } from 'commands'

// Create command

const command = await new Command()
	.name('lfr')
	.description('Command line framework to work with a Liferay environment.')
	.version('0.1.0')

	// analyze command
	.command(
		'analyze',
		'Analyzes a branch by passing format source and running frontend tests.'
	)
	.action(() => analyzeBranch())

	// deploy command
	.command(
		'deploy',
		'Deploys a module or a bunch of them, depending on options.'
	)
	.option('-a, --skip-dependencies', 'Skip dependencies.')
	.option('-c, --clean', 'Clean everything from previous builds.')
	.action(({ clean, skipDependencies }) => deploy(clean, skipDependencies))

// Parse args or show help if no args are passed
if (Deno.args.length) {
	command.parse(Deno.args)
} else {
	command.showHelp()
}
