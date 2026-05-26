export type AchievementType = 'kills_total' | 'kills_weapon' | 'no_damage_floor' | 'survive_boss' | 'challenge_complete' | 'runs_completed'

export interface AchievementDef {
  id: string
  title: string
  desc: string
  type: AchievementType
  target: number
  weaponType?: string
  unlockLabel: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id:'ach_100kills',   title:'Century',       desc:'100 total kills',              type:'kills_total',       target:100, unlockLabel:'Iron Skin cosmetic'   },
  { id:'ach_500kills',   title:'Massacre',      desc:'500 total kills',              type:'kills_total',       target:500, unlockLabel:'Blood cosmetic'       },
  { id:'ach_dagger50',   title:'Shadow Walker', desc:'50 dagger kills',              type:'kills_weapon',      target:50,  weaponType:'dagger', unlockLabel:'Shadow Blade tint' },
  { id:'ach_staff30',    title:'Arcane Master', desc:'30 staff kills',               type:'kills_weapon',      target:30,  weaponType:'staff',  unlockLabel:'Arcane Glow tint'  },
  { id:'ach_runs10',     title:'Frequent Flyer',desc:'Complete 10 runs',             type:'runs_completed',    target:10,  unlockLabel:'Veteran title'        },
  { id:'ach_boss3',      title:'Conqueror',     desc:'Defeat 3 different bosses',    type:'survive_boss',      target:3,   unlockLabel:'Conqueror tint'       },
  { id:'ach_challenge5', title:'Trial Master',  desc:'Complete 5 challenge runs',    type:'challenge_complete',target:5,   unlockLabel:'Trial Master tint'    },
]
