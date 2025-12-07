import { assertEquals } from 'std/assert'

import { processCommand } from 'tools'

Deno.test('simple command', () => {
	const result = processCommand('git status')

	assertEquals(result.cmd, 'git')
	assertEquals(result.args, ['status'])
})

Deno.test('command with multiple arguments', () => {
	const result = processCommand('git commit -m test -b papa')

	assertEquals(result.cmd, 'git')
	assertEquals(result.args, ['commit', '-m', 'test', '-b', 'papa'])
})

Deno.test('command with double quotes word', () => {
	const result = processCommand('gh pr create -t "My PR"')

	assertEquals(result.cmd, 'gh')
	assertEquals(result.args, ['pr', 'create', '-t', 'My PR'])
})

Deno.test('command with double quotes and complex characters', () => {
	const result = processCommand('git log "--pretty=format:%H %s"')

	assertEquals(result.cmd, 'git')
	assertEquals(result.args, ['log', '--pretty=format:%H %s'])
})

Deno.test('command with single quotes', () => {
	const result = processCommand("gh api user --jq '.login'")

	assertEquals(result.cmd, 'gh')
	assertEquals(result.args, ['api', 'user', '--jq', '.login'])
})

Deno.test('command with single quotes and complex characters', () => {
	const result = processCommand("git log -1 --pretty '%B'")

	assertEquals(result.cmd, 'git')
	assertEquals(result.args, ['log', '-1', '--pretty', '%B'])
})

Deno.test('command with multiple quotes words', () => {
	const result = processCommand(
		'git commit -m "fix: test" --author "John Doe"'
	)

	assertEquals(result.cmd, 'git')
	assertEquals(result.args, [
		'commit',
		'-m',
		'fix: test',
		'--author',
		'John Doe',
	])
})

Deno.test('command with flags and options', () => {
	const result = processCommand('git push -u -f origin feature/test')

	assertEquals(result.cmd, 'git')
	assertEquals(result.args, ['push', '-u', '-f', 'origin', 'feature/test'])
})

Deno.test('command with equals character', () => {
	const result = processCommand('git config user.name=John')

	assertEquals(result.cmd, 'git')
	assertEquals(result.args, ['config', 'user.name=John'])
})

Deno.test('command with path containing spaces', () => {
	const result = processCommand('ls "/Users/sandro/My Documents"')

	assertEquals(result.cmd, 'ls')
	assertEquals(result.args, ['/Users/sandro/My Documents'])
})
