import { Input, Toggle } from 'cliffy/prompt'
import { blue, bold, dim, italic, red, white, yellow } from 'std/colors'

import { getConfigEntry } from 'config'
import { Failure, Warning } from 'exceptions'
import { getBranchCommits, getCurrentBranch, handleRebaseConflict } from 'git'
import { join, log, runAsyncFunction, runCommand } from 'tools'

type Entry = {
	key: string
	phrase: string
}

type Props = {
	buildLang?: boolean
	commitChanges?: boolean
}

/**
 * Generate language keys for the given phrases and add them to Language.properties file
 */

export async function languageKeys(props: Props) {
	const entries: Entry[] = []

	const first: string = await Input.prompt({
		message: 'Introduce a phrase',
		prefix: `${yellow('→')} `,
	})

	if (!first) {
		Deno.exit(0)
	}

	const portalPath = await getConfigEntry('portal.path')

	Deno.chdir(portalPath)

	await saveEntry(first, entries)

	log('')

	let next: string = await Input.prompt({
		message: `Introduce another phrase ${dim(`(or press Enter if finished)`)}`,
		prefix: `${yellow('→')} `,
	})

	while (next) {
		await saveEntry(next, entries)

		log('')

		next = await Input.prompt({
			message: `Introduce another phrase ${dim(`(or press Enter if finished)`)}`,
			prefix: `${yellow('→')} `,
		})
	}

	// Exit if no new phrases are added

	if (!entries.length) {
		log(`\n${bold(white('No new phrases'))} were added`)

		Deno.exit(0)
	}

	log('')

	// Get current changes

	const changes = await runCommand('git status --porcelain')

	// Write entries in Language.properties file

	const modulePath = join(
		portalPath,
		'modules/apps/portal-language/portal-language-lang'
	)

	const filePath = join(
		modulePath,
		'src/main/resources/content/Language.properties'
	)

	await runAsyncFunction({
		fn: async () => {
			// Save local changes if needed

			if (changes) {
				await runCommand('git stash --include-untracked')
			}

			// Write entries

			for (const { key, phrase } of entries) {
				await Deno.writeTextFile(filePath, `\n${key}=${phrase}`, {
					append: true,
				})
			}
		},
		text: `portal-language-lang ${dim('Add keys to Language.properties')}`,
	})

	// Prepare cleanup logic

	const cleanup = async () => {
		// Delete fixup commits if they exist

		const commits = await getBranchCommits({ order: 'descending' })

		let count = 0

		for (const commit of commits) {
			if (commit.content?.startsWith('fixup!')) {
				count++
			} else {
				break
			}
		}

		if (count > 0) {
			await runCommand(`git reset --hard HEAD~${count}`)
		}

		// Restore local changes if needed

		if (changes) {
			await runCommand('git stash pop')
		}
	}

	// Run buildLang if specified, otherwise sort Language.properties by running formatSource

	if (props.buildLang) {
		await buildLang()
	} else {
		await sortFile({ onFail: cleanup })
	}

	// Commit changes if specified

	let conflict = false

	if (props.commitChanges) {
		log('')

		await commitChanges({
			buildLang: props.buildLang,
			onConflict: () => {
				conflict = true
			},
		})
	}

	if (conflict) {
		await handleRebaseConflict({ onAbort: cleanup })
	}

	// Perform cleanup

	await cleanup()
}

/**
 * Execute buildLang in portal-language-lang module
 */

async function buildLang() {
	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')

	const modulePath = join(
		portalPath,
		'modules/apps/portal-language/portal-language-lang'
	)

	Deno.chdir(modulePath)

	await runAsyncFunction({
		fn: async () => {
			await runCommand(`${gradlePath} buildLang`)
		},
		text: `portal-language-lang ${dim('buildLang')}`,
	})
}

/**
 * Commit changes
 */
async function commitChanges({
	buildLang,
	onConflict,
}: {
	buildLang?: boolean
	onConflict?: () => void
}) {
	const LPD = await findLPD()

	if (!LPD) {
		log(
			`No ${bold(white('LPD'))} was found in the commits or in the branch name, so ${bold(white('nothing will be committed'))}`
		)

		return
	}

	const baseBranch = await getConfigEntry('base.branch')

	const branchName = await getCurrentBranch()

	const portalPath = await getConfigEntry('portal.path')

	const folderPath = join(
		portalPath,
		'modules/apps/portal-language/portal-language-lang/src/main/resources/content'
	)

	Deno.chdir(folderPath)

	const commits = await getBranchCommits()

	const keysCommit = commits.find(({ content }) =>
		content.toLowerCase().includes('language keys')
	)

	const buildLangCommit = commits.find(({ content }) =>
		content.toLowerCase().includes('buildlang')
	)

	let description = ''

	if (keysCommit || buildLangCommit) {
		description = `Found ${bold(white('existing'))}`

		if (keysCommit) {
			description += ` language keys commit ("${bold(white(keysCommit.content))}")`
		}

		if (buildLangCommit) {
			description += `${keysCommit ? ' and ' : ' '}buildLang commit ("${bold(white(buildLangCommit.content))}")`
		}

		description += `, will amend ${keysCommit && buildLangCommit ? 'them' : 'it'}`
	}

	if (description) {
		log(`${description}\n`)
	}

	await runAsyncFunction({
		fn: async () => {
			try {
				await runCommand('git add Language.properties')

				if (keysCommit) {
					await runCommand(`git commit --fixup ${keysCommit.sha}`)
				} else {
					await runCommand(`git commit -m "${LPD} Add language keys"`)
				}

				if (!buildLang) {
					return
				}

				await runCommand('git add Language*.properties')

				if (buildLangCommit) {
					await runCommand(
						`git commit --fixup ${buildLangCommit.sha}`
					)
				} else {
					await runCommand(`git commit -m "${LPD} buildLang"`)
				}

				if (keysCommit || buildLangCommit) {
					await runCommand(
						`git rebase -i --autosquash --quiet ${baseBranch}`,
						{ env: { GIT_EDITOR: 'true' } }
					)
				}
			} catch (error) {
				const { message } = error as Error

				if (message.includes('could not apply') && onConflict) {
					onConflict()

					throw new Warning(`(found ${bold(yellow('conflict'))})`)
				}

				throw error
			}
		},
		text: `${branchName} ${dim('Commit changes')}`,
	})
}

/**
 * Find the working LPD number
 */

async function findLPD() {
	const commits = await getBranchCommits()

	// If there's only one LPD, return it

	const LPDs = [
		...new Set(
			commits
				.map(({ content }) => {
					const [first] = content.split(' ')

					return first.startsWith('LPD') ? first : null
				})
				.filter((LPD) => LPD)
		),
	]

	if (LPDs.length === 1) {
		return LPDs[0]
	}

	// Take buildLang commits

	const buildLangCommits = commits.filter(({ content }) =>
		content.toLowerCase().includes('buildlang')
	)

	// If there's only one buildLang commit, return its LPD

	if (buildLangCommits.length === 1) {
		const [first] = buildLangCommits[0].content.split(' ')

		if (first.startsWith('LPD')) {
			return first
		}
	}

	// If there's more than one, return the last one

	if (buildLangCommits.length) {
		return buildLangCommits.at(-1)
	}

	// If there's any commit, return last LPD

	if (LPDs.length) {
		return LPDs.at(-1)
	}

	// Try to extract LPD from branch name, otherwise return null

	const branchName = await getCurrentBranch()

	const match = branchName.match(/LPD-\d+/)

	return match ? match[0] : null
}

/**
 * Check whether a long phrase has a placeholder after first dot or not
 */

function hasPlaceholderAfterDot(phrase: string) {
	const firstDotIndex = phrase.indexOf('.')

	return /\{\d+\}/.test(phrase.slice(firstDotIndex + 1))
}

/**
 * Check whether a key already exists or not
 */

async function keyExists(key: Entry['key']) {
	const portalPath = await getConfigEntry('portal.path')

	const modulePath = join(
		portalPath,
		'modules/apps/portal-language/portal-language-lang'
	)

	const filePath = join(
		modulePath,
		'src/main/resources/content/Language.properties'
	)

	const content = await Deno.readTextFile(filePath)

	const lines = content.split('\n')

	for (const line of lines) {
		if (line.trim().startsWith(`${key}=`)) {
			return true
		}
	}

	return false
}

/**
 * Generate key for the given phrase and save entry
 */

async function saveEntry(phrase: string, entries: Entry[]) {
	let shorten = false

	if (
		phrase.length > 100 &&
		phrase.includes('.') &&
		!hasPlaceholderAfterDot(phrase)
	) {
		shorten = await Toggle.prompt({
			prefix: `${yellow('→')} `,
			default: true,
			message: `This phrase is long, do you want to use only the first part for the key? In this case: "${italic(blue(shortenPhrase(phrase)))}". Translation will include the whole text.`,
		})
	}

	const entry = toEntry(phrase, shorten)

	if (await keyExists(entry.key)) {
		log(`${blue('i')} ${bold('This phrase already exists, will skip it')}`)

		return
	}

	entries.push(entry)
}

/**
 * Shorten a phrase and return the short version
 */

function shortenPhrase(phrase: string) {
	const parts = phrase.split('.')

	return parts[0]
}

/**
 * Sort Language.properties file by running formatSource in portal-language-lang
 */

async function sortFile({ onFail }: { onFail?: () => Promise<void> } = {}) {
	const portalPath = await getConfigEntry('portal.path')
	const gradlePath = join(portalPath, 'gradlew')

	const modulePath = join(
		portalPath,
		'modules/apps/portal-language/portal-language-lang'
	)

	Deno.chdir(modulePath)

	let fail = false

	await runAsyncFunction({
		fn: async () => {
			try {
				await runCommand(`${gradlePath} formatSource`)
			} catch {
				throw new Failure({
					message: `(found ${bold(red('errors'))})`,
				})
			}
		},
		onError: () => {
			fail = true
		},
		text: `portal-language-lang ${dim('Run formatSource to sort Language.properties')}`,
	})

	if (fail) {
		if (onFail) {
			await onFail()
		}

		log(
			`\nOperation was ${bold(yellow('aborted'))} due to ${bold(red('format errors'))}`
		)

		Deno.exit(1)
	}
}

/**
 * Transform a phrase to a entry that contains both the key and the phrase
 */

function toEntry(phrase: string, shorten: boolean): Entry {
	const text = shorten ? shortenPhrase(phrase) : phrase

	// Replace placeholders {0}, {1}, ... with "x"
	let key = text.replace(/\{\d+\}/g, 'x')

	// Convert to lowercase
	key = key.toLowerCase()

	// Remove the final dot if it exists
	key = key.replace(/\.$/, '')

	// Replace spaces with hyphens
	key = key.replace(/\s+/g, '-')

	// Remove special characters
	key = key.replace(/[^a-z0-9\-.]+/g, '')

	const entry = {
		key,
		phrase,
	}

	return entry
}
