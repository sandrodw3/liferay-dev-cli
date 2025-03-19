import { getConfigEntry } from 'config'
import { runCommand } from 'tools'

type Props = {
	test: string
}

/**
 * Allow setting user configuration
 */

export async function poshi({ test }: Props) {
	const portalPath = await getConfigEntry('portal.path')

	Deno.chdir(portalPath)

	await runCommand(
		`ant -f build-test.xml run-selenium-test -Dtest.class=${test}`,
		{ spawn: true }
	)
}
