import { getGradleCommand, getModuleName } from 'liferay'

const ANT_MODULES = ['portal-impl', 'portal-kernel', 'portal-web']

type Props = {
	module: string
	clean?: boolean
	skipDependencies?: boolean
}

/**
 * Returns the command to deploy a module depending on its type,
 * or blank if the module is skippable
 */

export async function getDeployCommand({
	module,
	clean,
	skipDependencies,
}: Props): Promise<string> {
	const name = getModuleName(module)

	if (name.includes('test') || name.endsWith('modules')) {
		return ''
	}

	if (ANT_MODULES.some((antModule) => name.includes(antModule))) {
		return 'ant deploy'
	}

	const deployCommand = await getGradleCommand()

	return `${deployCommand}${clean ? ' clean' : ''} deploy${
		skipDependencies ? ' -a' : ''
	}`
}
