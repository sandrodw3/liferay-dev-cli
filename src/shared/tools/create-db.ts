import { Client, configLogger } from 'mysql'
import { bold, magenta, red, white } from 'std/colors'
import { log } from 'tools'

type Props = {
	username: string
	password: string
	database: string
}

/**
 * Creates a MySQL database with the given name
 */

export async function createDb({ username, password, database }: Props) {
	try {
		const client = await new Client().connect({ username, password })

		configLogger({ enable: false })

		await client.execute(
			`CREATE DATABASE ${database} CHARACTER SET utf8 COLLATE utf8_general_ci`
		)
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

		log(
			`\nAn ${bold(red('error'))} occurred while ${bold(white('creating the database'))}, please try again later`
		)

		Deno.exit(1)
	}
}
