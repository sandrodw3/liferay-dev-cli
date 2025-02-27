import { Client, configLogger } from 'mysql'
import { bold, magenta, red, white } from 'std/colors'
import { log } from 'tools'

type Props = {
	username: string
	password: string
	database: string
}

/**
 * Check if the given database exists in MySQL and
 * ask the user if they want to create it
 */

export async function checkDbExists({ username, password, database }: Props) {
	try {
		const client = await new Client().connect({
			username,
			password,
			db: database,
		})

		configLogger({ enable: false })

		await client.execute(`SHOW TABLES`)

		return true
	} catch (error) {
		const { message } = error as Error

		if (message.includes('Access denied')) {
			log(
				`Your ${bold(white('MySQL credentials'))} are ${bold(
					red('incorrect')
				)}, please set correct ones with ${bold(
					magenta('lfr config')
				)} and try again`
			)

			Deno.exit(1)
		}

		return false
	}
}
