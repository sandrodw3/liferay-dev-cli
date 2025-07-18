import { runCommand } from 'tools'

/**
 * Returns the pid of the Liferay portal process or null if it does not exist
 */

export async function getPortalProcessPid(): Promise<number | null> {
	// Get Liferay portal process

	const processes = (await runCommand('ps aux')).split('\n')

	const process = processes.find((proc) => proc.includes('catalina'))

	if (!process) {
		return null
	}

	// Find process pid and return it

	const [_, pid] = process.split(' ').filter(Boolean)

	return Number(pid)
}
