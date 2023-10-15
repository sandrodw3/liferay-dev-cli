import { getBaseName } from 'tools'

type Props = {
	module: string
	clean?: boolean
	skipDependencies?: boolean
}

/**
 * Returns the command to deploy a module depending on its type,
 * or blank if the module is skippable
 */

export function getDeployCommand({
	module,
	clean,
	skipDependencies,
}: Props): string {
	if (module.includes('test') || module.endsWith('modules')) {
		return ''
	}

	const name = getBaseName(module)

	if (
		['portal-impl', 'portal-kernel', 'portal-web'].some((manualModule) =>
			name.includes(manualModule)
		)
	) {
		return 'manual'
	}

	return `${clean ? 'clean ' : ''}deploy${skipDependencies ? ' -a' : ''}`
}
