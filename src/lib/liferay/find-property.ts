/**
 * Look for teh given property in the given file
 */

export async function findProperty(file: string, property: string) {
	try {
		const properties = await Deno.readTextFile(file)

		const line = properties
			.split('\n')
			.find(
				(line) =>
					!line.includes('#') &&
					!line.includes('!') &&
					line.includes(`${property}=`)
			)

		if (!line) {
			return ''
		}

		const [, value] = line.split('=')

		return value
	} catch {
		return ''
	}
}
