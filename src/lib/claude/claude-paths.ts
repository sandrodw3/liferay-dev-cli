import { join } from '@lib/utils'

const CLAUDE_PATH = join(Deno.env.get('HOME')!, '.claude')

export const PROJECTS_PATH = join(CLAUDE_PATH, 'projects')
export const SESSIONS_PATH = join(CLAUDE_PATH, 'sessions')
