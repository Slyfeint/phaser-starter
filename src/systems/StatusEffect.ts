export type StatusId = 'bleed' | 'stagger' | 'cripple' | 'slow' | 'poison'

export interface StatusEffect {
  id: StatusId
  duration: number       // ms remaining
  tickInterval?: number  // ms between damage ticks
  nextTick?: number      // ms until next tick fires
  tickDamage?: number
  slowMult?: number      // e.g. 0.6 = 40% slow
}

export function applyStatus(list: StatusEffect[], effect: StatusEffect): void {
  const existing = list.findIndex(e => e.id === effect.id)
  if (existing >= 0) list.splice(existing, 1)
  list.push({ ...effect })
}

export function tickStatuses(list: StatusEffect[], delta: number): { damage: number; slowMult: number } {
  let damage = 0
  let slowMult = 1
  for (const e of list) {
    e.duration -= delta
    if (e.tickDamage && e.tickInterval !== undefined) {
      e.nextTick = (e.nextTick ?? 0) - delta
      if (e.nextTick <= 0) {
        damage += e.tickDamage
        e.nextTick = e.tickInterval
      }
    }
    if (e.slowMult !== undefined) slowMult = Math.min(slowMult, e.slowMult)
  }
  return { damage, slowMult }
}

export function pruneExpired(list: StatusEffect[]): StatusEffect[] {
  return list.filter(e => e.duration > 0)
}

export const BLEED   = (dur = 2000): StatusEffect => ({ id: 'bleed',   duration: dur, tickDamage: 5, tickInterval: 500, nextTick: 500 })
export const STAGGER = (dur = 1200): StatusEffect => ({ id: 'stagger', duration: dur, slowMult: 0.55 })
export const CRIPPLE = (dur = 2500): StatusEffect => ({ id: 'cripple', duration: dur, slowMult: 0.80 })
export const SLOW    = (dur = 2000): StatusEffect => ({ id: 'slow',    duration: dur, slowMult: 0.65 })
export const POISON  = (dur = 4000): StatusEffect => ({ id: 'poison',  duration: dur, tickDamage: 3, tickInterval: 800, nextTick: 800 })
