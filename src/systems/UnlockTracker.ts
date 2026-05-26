export interface UnlockEvent {
  type: 'item_pool' | 'enemy_variant' | 'quest_unlocked' | 'modifier_unlocked'
  title: string
  desc: string
}

export function checkPostRunUnlocks(runsCompleted: number, totalKills: number): UnlockEvent[] {
  const unlocks: UnlockEvent[] = []
  if (runsCompleted === 3)   unlocks.push({ type: 'item_pool',        title: 'New Item Unlocked!',    desc: 'Ring of Fortune added to drop pool' })
  if (runsCompleted === 5)   unlocks.push({ type: 'enemy_variant',    title: 'New Enemy!',             desc: 'Elite Wraith variant now appears on floor 2+' })
  if (runsCompleted === 10)  unlocks.push({ type: 'modifier_unlocked',title: 'Modifier Unlocked!',     desc: '"Elite Hunt" run modifier now available' })
  if (totalKills >= 100)     unlocks.push({ type: 'item_pool',        title: 'New Item Unlocked!',    desc: "Midas' Chain added to drop pool" })
  if (totalKills >= 500)     unlocks.push({ type: 'item_pool',        title: 'New Item Unlocked!',    desc: 'Omniring added to drop pool' })
  return unlocks
}
