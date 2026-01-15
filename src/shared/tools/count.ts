/**
 * Count the number of appearances of the given char in the given string
 */

export function count(str: string, char: string): number {
	let count = 0

	for (const c of str) {
		if (c === char) {
			count++
		}
	}

	return count
}
