export type QuestType = 'kills_total' | 'kills_weapon' | 'kills_enemy' | 'floors_cleared' | 'runs_completed' | 'no_heal_floor' | 'boss_no_consumable' | 'crit_streak' | 'survive_low_hp'

export interface QuestDef {
  id: string
  title: string
  desc: string
  type: QuestType
  target: number
  weaponType?: string
  enemyType?: string
  reward: number
}

export const QUESTS: QuestDef[] = [
  { id:'q_kill_50',      title:'Slaughterer',   desc:'Kill 50 enemies',              type:'kills_total',   target:50,  reward:200 },
  { id:'q_kill_200',     title:'Exterminator',  desc:'Kill 200 enemies',             type:'kills_total',   target:200, reward:500 },
  { id:'q_kill_500',     title:'Reaper',        desc:'Kill 500 enemies',             type:'kills_total',   target:500, reward:1000 },
  { id:'q_dagger_30',    title:'Blade Dancer',  desc:'Kill 30 with dagger',          type:'kills_weapon',  target:30,  weaponType:'dagger', reward:300 },
  { id:'q_staff_20',     title:'Arcane Sniper', desc:'Kill 20 with staff',           type:'kills_weapon',  target:20,  weaponType:'staff',  reward:250 },
  { id:'q_axe_25',       title:'Woodcutter',    desc:'Kill 25 with axe',             type:'kills_weapon',  target:25,  weaponType:'axe',    reward:275 },
  { id:'q_sword_40',     title:'Swordmaster',   desc:'Kill 40 with sword',           type:'kills_weapon',  target:40,  weaponType:'sword',  reward:300 },
  { id:'q_mace_15',      title:'Crusher',       desc:'Kill 15 with mace',            type:'kills_weapon',  target:15,  weaponType:'mace',   reward:225 },
  { id:'q_floors_3',     title:'Floor Runner',  desc:'Clear 3 boss floors',          type:'floors_cleared', target:3,  reward:400 },
  { id:'q_floors_10',    title:'Spelunker',     desc:'Clear 10 boss floors',         type:'floors_cleared', target:10, reward:800 },
  { id:'q_runs_5',       title:'Dungeon Diver', desc:'Complete 5 runs',              type:'runs_completed', target:5,  reward:300 },
  { id:'q_runs_20',      title:'Veteran',       desc:'Complete 20 runs',             type:'runs_completed', target:20, reward:600 },
  { id:'q_no_heal_floor', title:'Iron Will',    desc:'Complete a floor without using any consumable', type:'no_heal_floor', target:1, reward:350 },
  { id:'q_boss_no_consumable', title:'Pure Skill', desc:'Defeat a boss without using consumables', type:'boss_no_consumable', target:1, reward:500 },
  { id:'q_5_crit_streak', title:'Critical Chain', desc:'Land 5 crits in a row without missing', type:'crit_streak', target:5, reward:275 },
  { id:'q_survive_low_hp', title:"Death's Door", desc:'Survive 30 seconds below 15% HP', type:'survive_low_hp', target:30, reward:400 },
  { id:'q_floor5_clear', title:'Deep Diver',    desc:'Reach floor 5',                type:'floors_cleared', target:5, reward:600 },
]
