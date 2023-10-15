/**
 * Returns the module name for the given module path
 */

export function getModuleName(module: string): string {
	return module.split('/').pop() as string
}
