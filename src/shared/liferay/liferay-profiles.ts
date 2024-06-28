export const PROFILES = ['dxp', 'portal'] as const

export type Profile = (typeof PROFILES)[number]
