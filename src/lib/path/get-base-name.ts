/**
 * Return the base name for the given path.
 *
 * When `removeExtension` is `true`, every trailing extension is
 * stripped (e.g. `archive.tar.gz` → `archive`). Leading dots are
 * preserved so dotfiles like `.gitignore` are returned unchanged.
 */

export function getBaseName(
	path: string,
	{
		removeExtension,
	}: {
		removeExtension?: boolean
	} = {
		removeExtension: false,
	}
): string {
	const baseName = path.split('/').pop() as string

	if (!removeExtension) {
		return baseName
	}

	const dot = baseName.indexOf('.', 1)

	return dot === -1 ? baseName : baseName.slice(0, dot)
}
