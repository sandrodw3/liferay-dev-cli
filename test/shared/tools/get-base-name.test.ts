import { assertEquals } from 'std/assert'

import { getBaseName } from 'tools'

Deno.test('extracts filename from full path', () => {
	assertEquals(getBaseName('/path/to/file.txt'), 'file.txt')
	assertEquals(getBaseName('/Users/sandro/Projects/domo'), 'domo')
	assertEquals(getBaseName('/home/user/.config'), '.config')
})

Deno.test('works with URLs', () => {
	assertEquals(getBaseName('https://github.com/user/repo.git'), 'repo.git')
	assertEquals(getBaseName('git@github.com:user/repo'), 'repo')
})

Deno.test('handles edge cases', () => {
	assertEquals(getBaseName('file.txt'), 'file.txt')
	assertEquals(getBaseName('single'), 'single')
	assertEquals(getBaseName('/path/with/trailing/slash/'), '')
})

Deno.test('handles different characters', () => {
	assertEquals(getBaseName('/path/to/my_file.txt'), 'my_file.txt')
	assertEquals(getBaseName('/path/to/repo-2024.git'), 'repo-2024.git')
})
