import { join } from 'tools'

export const CONFIG_PATH = join(Deno.env.get('HOME')!, '.lfrconfig')
