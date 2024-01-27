import { bold, yellow } from 'std/colors'

import { log } from 'tools'

type ListItem = {
	id: string
	name: string
}

/**
 * Allow user to find an item in a list with a fuzzy search
 */
export async function fuzzySearch(items: ListItem[]) {
	// Create fzf command with desired options

	const fzf = new Deno.Command('fzf', {
		args: [
			'--color=bg:-1,bg+:-1,gutter:-1,pointer:39,prompt:-1',
			'--height=10',
			'--no-info',
			'--reverse',
			'--with-nth=2',
		],
		stdin: 'piped',
		stdout: 'piped',
		stderr: 'inherit',
	})

	// Spawn process, exit if fzf is not installed

	let process

	try {
		process = fzf.spawn()
	} catch {
		log(
			`${name} ${bold(yellow('fzf'))} is not installed, please ${bold(
				yellow('install it')
			)} to use this command`
		)

		return
	}

	const decoder = new TextDecoder()
	const encoder = new TextEncoder()

	// Prepare list

	const list = items.map((line) => `${line.id} ${line.name}`).join('\n')

	// Write the list to stdin

	const writer = process.stdin.getWriter()
	writer.write(encoder.encode(list + '\n'))

	// Capture, process and return user selection

	const { stdout } = await process.output()

	const output = decoder.decode(stdout).trim()

	const [item] = output.split(' ')

	return item
}
