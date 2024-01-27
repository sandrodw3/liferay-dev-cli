import { bold, white, yellow } from 'std/colors'

import { log, runCommand } from 'tools'

const ACCENT_COLOR = '#3B919B'

type ListItem = {
	id: string
	name: string
}

/**
 * Allow user to find an item in a list with a fuzzy search.
 * A bash string to format the preview of each line can also be passed
 */

export async function fuzzySearch(items: ListItem[], formatPreview?: string) {
	// Create fzf command with desired options

	const args = [
		`--color=bg:-1,bg+:-1,gutter:-1,pointer:${ACCENT_COLOR},preview-fg:${ACCENT_COLOR},prompt:-1`,
		'--height=12',
		'--no-info',
		'--reverse',
		'--with-nth=2',
	]

	if (formatPreview) {
		args.push(
			'--preview-window',
			'top:10%:noborder:wrap',
			'--preview',
			formatPreview
		)
	}

	const fzf = new Deno.Command('fzf', {
		args,
		stdin: 'piped',
		stdout: 'piped',
		stderr: 'inherit',
	})

	// Spawn process, exit if fzf is not installed

	await checkFzf()

	const process = fzf.spawn()

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

/**
 * Check fzf is installed
 */

export async function checkFzf() {
	const output = await runCommand('which fzf')

	if (!output) {
		log(
			`${bold(yellow('fzf'))} is not installed, please ${bold(
				yellow('install it')
			)} to use this command (${bold(white('https://github.com/junegunn/fzf'))})`
		)

		Deno.exit(1)
	}
}
