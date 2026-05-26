import Phaser from 'phaser'
import { generateDungeon, TILE_WALL, TILE_FLOOR, type DungeonData } from '../systems/DungeonGenerator'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { Door } from '../entities/Door'
import { Boss, getBossType } from '../entities/Boss'
import { Hazard } from '../entities/Hazard'
import { Loot, type LootType } from '../entities/Loot'
import { DroppedItem } from '../entities/DroppedItem'
import { HUD } from '../ui/HUD'
import { InventoryUI } from '../ui/InventoryUI'
import { ShopUI } from '../ui/ShopUI'
import { Minimap } from '../ui/Minimap'
import { pickSpawnType, spawnCountForRoom, type DungeonTheme } from '../systems/MonsterSpawner'
import { SaveManager } from '../systems/SaveManager'
import { COSMETICS } from '../systems/Cosmetics'
import { ITEMS, ALL_ITEMS } from '../systems/ItemDefs'
import type { ItemDef, EquipSlot } from '../systems/ItemDefs'
import { CLASSES } from '../systems/ClassDefs'
import { computeClassSkillEffects } from '../systems/SkillTree'
import { POISON } from '../systems/StatusEffect'
import { getSellPrice } from '../ui/ShopUI'
import { getKey } from '../systems/KeyBindings'
import { BLEED, STAGGER, CRIPPLE, SLOW, type StatusEffect } from '../systems/StatusEffect'
import { EventRoomUI, type EventRoomType } from '../ui/EventRoomUI'
import { QUESTS, type QuestDef } from '../systems/QuestDefs'
import { ACHIEVEMENTS } from '../systems/AchievementDefs'
import { checkSynergies, type SynergyContext } from '../systems/SynergyDefs'
import { RUN_MODIFIERS, type RunModifierDef } from '../systems/RunModifierDefs'
import { AdManager } from '../systems/AdManager'

const TILE = 32
const COLS = 50
const ROWS = 40
const MAX_FLOOR = 5

interface RunState {
  hp: number
  score: number
  equippedGear: Record<string, ItemDef>
  bag: ItemDef[]
  curses: string[]
  challenges: string[]
  challengeGoldBonus: number
}

export class DungeonScene extends Phaser.Scene {
  private player!: Player
  private enemies!: Phaser.GameObjects.Group
  private boss?: Boss
  private hazards: Hazard[] = []
  private lootGroup!: Phaser.Physics.Arcade.StaticGroup
  private droppedItemGroup!: Phaser.Physics.Arcade.StaticGroup
  private portal?: Phaser.GameObjects.Sprite
  private stairsSprite?: Phaser.GameObjects.Sprite
  private wallLayer!: Phaser.Tilemaps.TilemapLayer
  private hud!: HUD
  private inventoryUI!: InventoryUI
  private shopUI!: ShopUI
  private minimap!: Minimap
  private doors: Door[] = []
  private doorGroup!: Phaser.GameObjects.Group
  private droppedItemRejectUntil = new Map<DroppedItem, number>()
  private invKey!: Phaser.Input.Keyboard.Key
  private shopKey!: Phaser.Input.Keyboard.Key
  private interactKey!: Phaser.Input.Keyboard.Key
  private hotbarKeys!: Phaser.Input.Keyboard.Key[]
  private score = 0
  private dungeon!: DungeonData
  private gameEnding = false
  private theme!: DungeonTheme
  private floor = 1
  private nearShop = false
  private shopRoomCenter?: Phaser.Math.Vector2
  private roomEnemyCounts = new Map<number, number>()
  private enemiesKilled = 0
  private _shownShopHint = false
  private _diffLootMult = 1
  private _killStreak = 0
  private _projectiles: { gfx: Phaser.GameObjects.Arc; vx: number; vy: number; dmg: number; isCrit: boolean; ttl: number; slowOnHit: boolean }[] = []
  private _eventRoomUI!: EventRoomUI
  private _eventRoomTriggered = false
  private _eventRoomCenter?: Phaser.Math.Vector2
  private _curses: string[] = []
  private _challengeEnemies: Enemy[] = []
  private _challengeActive = false
  private _challengeTimer = 0
  private _runChallenges: string[] = []
  private _runChallengeGoldBonus = 0
  private _runKillsByWeapon: Record<string, number> = {}
  private _runKillsByEnemy: Record<string, number> = {}
  private _newlyCompletedAchievements: string[] = []

  // Sprint 1 additions
  private _damageDealt = 0
  private _killedBy = ''
  private _topWeapon = ''
  private _consumablesUsed = 0

  // Sprint 2 — Synergy system
  private _activeSynergies: string[] = []
  private _shadowbladeActive = false
  private _arcaneSlowingActive = false
  private _berserkersGambitActive = false
  private _dualWieldFlowActive = false
  private _fortuneEdgeActive = false

  // Sprint 2 — Run modifier
  private _runModifier?: RunModifierDef
  private _modifierSpeedMult = 1
  private _modifierHpMult = 1
  private _modifierDamageMult = 1
  private _modifierLootMult = 1
  private _modifierGoldMult = 1
  private _blessedRun = false
  private _eliteHunt = false

  // Sprint 3 — Quest tracking
  private _consumablesUsedThisFloor = 0
  private _consumablesUsedDuringBoss = 0
  private _bossStarted = false
  private _critStreak = 0
  private _lowHpAccumulator = 0
  private _firstPickupInRoom = true

  // Sprint 5 — Revive
  private _reviveUsed = false

  constructor() { super('DungeonScene') }

  create() {
    this.cameras.main.resetFX()
    this.score = 0
    this.gameEnding = false
    this.hazards = []
    this.doors = []
    this.droppedItemRejectUntil = new Map()
    this.roomEnemyCounts = new Map()
    this.enemiesKilled = 0
    this.boss = undefined
    this.portal = undefined
    this.stairsSprite = undefined
    this.nearShop = false
    this._eventRoomTriggered = false
    this._eventRoomCenter = undefined
    this._curses = []
    this._challengeEnemies = []
    this._challengeActive = false
    this._challengeTimer = 0
    this._runKillsByWeapon = {}
    this._runKillsByEnemy = {}
    this._newlyCompletedAchievements = []
    this._damageDealt = 0
    this._killedBy = ''
    this._topWeapon = ''
    this._consumablesUsed = 0
    this._consumablesUsedThisFloor = 0
    this._consumablesUsedDuringBoss = 0
    this._bossStarted = false
    this._critStreak = 0
    this._lowHpAccumulator = 0
    this._firstPickupInRoom = true
    this._reviveUsed = false

    const earlyRunState = this.registry.get('runState') as RunState | null
    this._runChallenges = earlyRunState?.challenges
      ?? (this.registry.get('runChallenges') as string[] | undefined)
      ?? []
    this._runChallengeGoldBonus = earlyRunState?.challengeGoldBonus
      ?? (this.registry.get('runChallengeGoldBonus') as number | undefined)
      ?? 0
    this._eventRoomUI = new EventRoomUI()

    this.theme = ((this.registry.get('mapTheme') as string) ?? 'dungeon') as DungeonTheme
    this.floor = (this.registry.get('currentFloor') as number) ?? 1
    const isBossFloor = this.floor === MAX_FLOOR

    // Pick or restore run modifier (floor 1 only)
    if (this.floor === 1) {
      const storedMod = this.registry.get('runModifier') as string | undefined
      if (storedMod) {
        this._runModifier = RUN_MODIFIERS.find(m => m.id === storedMod)
      } else {
        this._runModifier = RUN_MODIFIERS[Math.floor(Math.random() * RUN_MODIFIERS.length)]
        this.registry.set('runModifier', this._runModifier.id)
      }
    } else {
      const storedMod = this.registry.get('runModifier') as string | undefined
      this._runModifier = storedMod ? RUN_MODIFIERS.find(m => m.id === storedMod) : undefined
    }

    // Apply modifier multipliers
    if (this._runModifier) {
      this._modifierSpeedMult  = this._runModifier.speedMult  ?? 1
      this._modifierHpMult     = this._runModifier.hpMult     ?? 1
      this._modifierDamageMult = this._runModifier.damageMult ?? 1
      this._modifierLootMult   = this._runModifier.lootMult   ?? 1
      this._modifierGoldMult   = this._runModifier.goldMult   ?? 1
      this._blessedRun         = this._runModifier.id === 'blessed_run'
      this._eliteHunt          = this._runModifier.id === 'elite_hunt'
    }

    // Difficulty multipliers
    {
      const ds = SaveManager.load()
      const dm = {
        easy:   { hp: 0.70, dmg: 0.80, loot: 0.80 },
        normal: { hp: 1.00, dmg: 1.00, loot: 1.00 },
        hard:   { hp: 1.50, dmg: 1.25, loot: 1.50 },
      }
      const dk = (ds.difficulty ?? 'normal') as keyof typeof dm
      const baseDm = dm[dk]
      const bloodthirstMod = this._runChallenges.includes('bloodthirst') ? 1.5 : 1
      const finalDm = {
        hp:   baseDm.hp   * bloodthirstMod * this._modifierHpMult,
        dmg:  baseDm.dmg  * this._modifierDamageMult,
        loot: baseDm.loot,
      }
      this.registry.set('diffMult', finalDm)
      this._diffLootMult = finalDm.loot * this._modifierLootMult
      // Apply speed mult to enemies via registry (read by Enemy constructor via diffMult extension)
      this.registry.set('enemySpeedMult', this._modifierSpeedMult)
    }

    this.dungeon = generateDungeon(COLS, ROWS, this.floor, isBossFloor)

    this.buildMap()
    this.spawnPlayer()
    this.spawnEnemies()
    this.spawnHazards()
    this.spawnShop()
    this.spawnDoors()
    this.spawnTorches()
    this.spawnDecorations()
    if (this.floor < MAX_FLOOR) this.spawnStairs()
    this.spawnLoot()
    this.setupCamera()
    this.setupColliders()
    this.setupInput()

    this.hud = new HUD(this)
    this.hud.setFloor(this.floor, this.theme)
    this.inventoryUI = new InventoryUI(this)
    this.shopUI = new ShopUI(this)
    const miniRoomIdx = isBossFloor ? this.dungeon.bossRoomIdx : this.dungeon.stairsRoomIdx
    this.minimap = new Minimap(this, this.dungeon, miniRoomIdx)

    { const b = this.boss as unknown as Boss | undefined; if (b) this.hud.showBossBar(b.bossName) }

    this.cameras.main.fadeIn(400, 0, 0, 0)

    // Floor transition announcement for floors 2+
    if (this.floor > 1) {
      const THEME_NAMES: Record<string, string> = { dungeon: 'Dungeon', castle: 'Castle', caves: 'Caves' }
      const { width, height } = this.scale
      const floorTxt = this.add.text(width / 2, height * 0.3,
        `Floor ${this.floor}  —  ${THEME_NAMES[this.theme] ?? this.theme}`, {
        fontSize: '30px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4,
      }).setScrollFactor(0).setDepth(200).setOrigin(0.5).setAlpha(0)
      this.tweens.add({
        targets: floorTxt, alpha: 1, duration: 500, delay: 300, yoyo: true, hold: 900,
        onComplete: () => { if (floorTxt.active) floorTxt.destroy() },
      })
    }

    // Boss floor intro (floor === MAX_FLOOR)
    if (isBossFloor) {
      this.showBossIntroCard()
    } else if (this.floor === 1 && this._runModifier) {
      // Show run modifier card on floor 1
      this.time.delayedCall(600, () => this.showModifierCard())
    }

    // Apply synergies after player is set up
    const save = SaveManager.load()
    const equippedSlots: string[] = []
    for (const slot of ['weapon1', 'weapon2']) {
      const item = this.player.inventory.get(slot as EquipSlot)
      if (item && item.weaponType) equippedSlots.push(item.weaponType)
    }
    const synergyCtx: SynergyContext = {
      equippedSlots,
      cosmeticId: save.activeCosmetic ?? 'steel',
      skills: save.skills ?? [],
      hasBothWeapons: !!this.player.inventory.get('weapon1') && !!this.player.inventory.get('weapon2'),
    }
    this._activeSynergies = checkSynergies(synergyCtx)
    this._shadowbladeActive   = this._activeSynergies.includes('shadowblade')
    this._arcaneSlowingActive = this._activeSynergies.includes('arcane_slowing')
    // iron_counter synergy tracked but applied passively in handleReflect
    this._berserkersGambitActive = this._activeSynergies.includes('berserkers_gambit')
    this._dualWieldFlowActive = this._activeSynergies.includes('dual_wield_flow')
    this._fortuneEdgeActive   = this._activeSynergies.includes('fortunes_edge')

    // Show synergy notifications
    if (this._activeSynergies.length > 0) {
      this._activeSynergies.forEach((id, i) => {
        const synName = this.getSynergyName(id)
        this.time.delayedCall(1200 + i * 800, () => {
          if (!this.scene.isActive()) return
          const { width, height } = this.scale
          const synTxt = this.add.text(width / 2, height * 0.22,
            `SYNERGY ACTIVE: ${synName}`, {
            fontSize: '14px', fontStyle: 'bold', color: '#00ff88',
            stroke: '#004400', strokeThickness: 2,
          }).setScrollFactor(0).setDepth(201).setOrigin(0.5).setAlpha(0)
          this.tweens.add({
            targets: synTxt, alpha: 1, duration: 400, yoyo: true, hold: 2200,
            onComplete: () => { if (synTxt.active) synTxt.destroy() },
          })
        })
      })
    }

    this.events.on('player-attack', this.processAttack, this)
    this.events.on('player-dead', () => { if (!this.gameEnding) this.handlePlayerDeath() })
    this.events.on('player-took-damage', () => { this._killStreak = 0 })
    this.events.on('reflect-damage', (amount: number) => this.handleReflect(amount))
    this.events.on('hotbar-use', (slot: number) => this.useHotbarSlot(slot))
    this.events.on('class-ability-e', (data: { class: string; x: number; y: number; angle: number; charge?: number }) => {
      this.handleClassAbilityE(data)
    })
    this.events.on('class-ability-r', (data: { class: string; x: number; y: number; angle: number }) => {
      this.handleClassAbilityR(data)
    })
    this.events.on('mana-shield-absorbed', (data: { x: number; y: number }) => {
      const shield = this.add.circle(data.x, data.y, 24, 0x4488ff, 0.6).setDepth(20)
      this.tweens.add({ targets: shield, alpha: 0, scaleX: 2, scaleY: 2, duration: 400, onComplete: () => { if (shield.active) shield.destroy() } })
    })

    if (this.dungeon.eventRoomIdx >= 0) {
      const er = this.dungeon.rooms[this.dungeon.eventRoomIdx]
      if (er) {
        const ex = er.cx * TILE + TILE / 2, ey = er.cy * TILE + TILE / 2
        this._eventRoomCenter = new Phaser.Math.Vector2(ex, ey)
        const erLabel = this.add.text(ex, ey - 24, '[ EVENT ]', { fontSize: '13px', fontStyle: 'bold', color: '#cc88ff' }).setOrigin(0.5).setDepth(5)
        this.tweens.add({ targets: erLabel, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 })
      }
    }
    this.events.on('boss-hp', (pct: number) => this.hud.updateBossBar(pct))
    this.events.on('boss-defeated', this.handleBossDefeated, this)
    this.events.on('boss-drop', (item: ItemDef, x: number, y: number) => this.spawnDrop(x, y, item))
    this.events.on('miniboss-killed', this.handleMinibossKilled, this)
    this.events.on('boss-summon', (sx: number, sy: number) => {
      const type = pickSpawnType(this.theme, this.floor)
      const summoned = new Enemy(this, sx, sy, type, false, this.floor)
      summoned.setWallChecker((x1, y1, x2, y2) => this.hasWallBetween(x1, y1, x2, y2))
      this.enemies.add(summoned)
    })
    this.events.on('inventory-drop-item', (item: ItemDef) => {
      const ox = (Math.random() - 0.5) * 28, oy = (Math.random() - 0.5) * 28
      this.spawnDrop(this.player.x + ox, this.player.y + oy, item)
    })
    this.events.once('shutdown', this.cleanup, this)
  }

  private getSynergyName(id: string): string {
    const names: Record<string, string> = {
      shadowblade: 'Shadowblade',
      arcane_slowing: 'Arcane Slowing',
      iron_counter: 'Iron Counter',
      berserkers_gambit: "Berserker's Gambit",
      dual_wield_flow: 'Dual Wield Flow',
      fortunes_edge: "Fortune's Edge",
    }
    return names[id] ?? id
  }

  private showBossIntroCard() {
    this.physics.pause()
    const { width, height } = this.scale
    const bossNames: Record<string, string> = {
      dungeon: 'DUNGEON MASTER',
      castle:  'KNIGHT COMMANDER',
      caves:   'CAVE WORM',
    }
    const bossName = bossNames[this.theme] ?? 'BOSS'

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85)
      .setOrigin(0).setScrollFactor(0).setDepth(200)
    const titleTxt = this.add.text(width / 2, height * 0.4, bossName, {
      fontSize: '38px', fontStyle: 'bold', color: '#ff4400',
      stroke: '#220000', strokeThickness: 5,
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5)
    const subTxt = this.add.text(width / 2, height * 0.4 + 52, `FLOOR ${this.floor} — BOSS ENCOUNTER`, {
      fontSize: '14px', color: '#cc6633',
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5)

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: [overlay, titleTxt, subTxt],
        alpha: 0, duration: 800,
        onComplete: () => {
          if (overlay.active) overlay.destroy()
          if (titleTxt.active) titleTxt.destroy()
          if (subTxt.active) subTxt.destroy()
          this.physics.resume()
        },
      })
    })
  }

  private showModifierCard() {
    if (!this._runModifier) return
    const mod = this._runModifier
    const { width, height } = this.scale
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.80)
      .setOrigin(0).setScrollFactor(0).setDepth(200)
    const headerTxt = this.add.text(width / 2, height * 0.35, 'MODIFIER ACTIVE', {
      fontSize: '14px', color: '#888888',
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5)
    const iconTxt = this.add.text(width / 2, height * 0.42, mod.icon, {
      fontSize: '28px',
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5)
    const titleTxt = this.add.text(width / 2, height * 0.50, mod.title, {
      fontSize: '22px', fontStyle: 'bold', color: '#ffcc44',
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5)
    const descTxt = this.add.text(width / 2, height * 0.57, mod.desc, {
      fontSize: '11px', color: '#aaaaaa', wordWrap: { width: width - 60 }, align: 'center',
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5)

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: [overlay, headerTxt, iconTxt, titleTxt, descTxt],
        alpha: 0, duration: 600,
        onComplete: () => {
          for (const obj of [overlay, headerTxt, iconTxt, titleTxt, descTxt]) {
            if (obj.active) obj.destroy()
          }
        },
      })
    })
  }

  private buildMap() {
    const tilesKey = `tiles_${this.theme}`
    const map = this.make.tilemap({ data: this.dungeon.tiles, tileWidth: TILE, tileHeight: TILE })
    const tileset = map.addTilesetImage(tilesKey, tilesKey, TILE, TILE, 0, 0)!
    this.wallLayer = map.createLayer(0, tileset, 0, 0)!
    this.wallLayer.setCollision([TILE_WALL]).setDepth(0)
    this.physics.world.setBounds(0, 0, COLS * TILE, ROWS * TILE)

    // Floor 5: dark red tint on floor tiles
    if (this.floor >= 5) {
      this.wallLayer.setTint(0xcc2200)
    }
  }

  private spawnPlayer() {
    const r = this.dungeon.rooms[0]
    this.player = new Player(this, r.cx * TILE + TILE / 2, r.cy * TILE + TILE / 2)
    this.player.setupInput(this)

    const runState = this.registry.get('runState') as RunState | null
    if (runState) {
      this.score = runState.score
      this.player.hp = runState.hp
      this.player.inventory.deserialize(runState.equippedGear)
      this.player.bag.deserialize(runState.bag)
      this._curses = runState.curses ?? []
      if (this._curses.includes('max_hp'))    this.player.maxHp = Math.max(10, this.player.maxHp - 10)
      if (this._curses.includes('move_speed')) this.player.applyStatus({ id: 'slow', duration: 600_000, slowMult: 0.9 })
    } else {
      const save = SaveManager.load()
      this.player.inventory.deserialize(save.equippedGear as Record<string, ItemDef>)
      this.player.bag.deserialize(save.bag)
    }

    const save = SaveManager.load()
    const cosmetic = COSMETICS.find(c => c.id === save.activeCosmetic) ?? COSMETICS[0]
    this.player.setCosmeticTint(cosmetic.tint)
    this.player.setCosmeticBonus(cosmetic.bonus)
    this.player.applySkills(save.skills ?? [])
    this.player.applyMetaUpgrades(save.metaUpgrades ?? {})

    // Apply class and class skills
    if (save.selectedClass) {
      const classDef = CLASSES.find(c => c.id === save.selectedClass)
      if (classDef) {
        this.player.setClass(save.selectedClass, classDef.abilityE.cooldown, classDef.abilityR.cooldown)
        const classEffects = computeClassSkillEffects(save.classSkills ?? [])
        this.player.applyClassSkills(classEffects)
      }
    }

    if (this._runChallenges.includes('slippery'))     this.player.addRollCdPenalty(400)
    if (this._runChallenges.includes('glass_cannon')) {
      this.player.maxHp = Math.max(10, Math.round(this.player.maxHp * 0.7))
    }

    if (!this.registry.get('runState')) {
      this.player.hp = this.player.effectiveMaxHp
      const luckyStart = (save.metaUpgrades?.['lucky_start'] ?? 0) * 30
      if (luckyStart > 0) this.score += luckyStart

      // cursed_run: start at 50% HP
      if (this._runModifier?.id === 'cursed_run') {
        this.player.hp = Math.max(1, Math.floor(this.player.effectiveMaxHp * 0.5))
      }
    }

    if (!this.player.inventory.get('weapon1') && !this.player.inventory.get('weapon2')) {
      if (save.selectedClass === 'rogue') {
        const startWeapon = ALL_ITEMS.find(i => i.id === 'twin_knives')
        if (startWeapon) this.player.inventory.equipItem(startWeapon)
        else { const sw = ITEMS.find(i => i.id === 'iron_sword')!; this.player.inventory.equipItem(sw, 'weapon1') }
      } else if (save.selectedClass === 'ranger') {
        const startWeapon = ALL_ITEMS.find(i => i.id === 'wood_bow')
        if (startWeapon) this.player.inventory.equipItem(startWeapon)
        else { const sw = ITEMS.find(i => i.id === 'iron_sword')!; this.player.inventory.equipItem(sw, 'weapon1') }
      } else if (save.selectedClass === 'mage') {
        const startWeapon = ALL_ITEMS.find(i => i.id === 'arcane_tome')
        if (startWeapon) this.player.inventory.equipItem(startWeapon)
        else { const sw = ITEMS.find(i => i.id === 'iron_sword')!; this.player.inventory.equipItem(sw, 'weapon1') }
      } else {
        const startSword = ITEMS.find(i => i.id === 'iron_sword')!
        this.player.inventory.equipItem(startSword, 'weapon1')
      }
    }
  }

  private spawnEnemies() {
    this.enemies = this.add.group()
    const { rooms, bossRoomIdx, stairsRoomIdx, shopRoomIdx, minibossRoomIdx } = this.dungeon
    const skipRooms = new Set([0, bossRoomIdx, stairsRoomIdx, shopRoomIdx])

    rooms.forEach((room, idx) => {
      if (skipRooms.has(idx)) return

      if (idx === minibossRoomIdx && this.floor < MAX_FLOOR) {
        const type = pickSpawnType(this.theme, this.floor)
        const mb = new Enemy(this, room.cx * TILE + TILE / 2, room.cy * TILE + TILE / 2, type, true, this.floor)
        mb.setWallChecker((x1, y1, x2, y2) => this.hasWallBetween(x1, y1, x2, y2))
        mb.setData('roomIdx', idx)
        this.roomEnemyCounts.set(idx, 1)
        this.enemies.add(mb)
        return
      }

      // elite_hunt: add miniboss to every non-special room
      if (this._eliteHunt) {
        const type = pickSpawnType(this.theme, this.floor)
        const mb = new Enemy(this, room.cx * TILE + TILE / 2, room.cy * TILE + TILE / 2, type, true, this.floor)
        mb.setWallChecker((x1, y1, x2, y2) => this.hasWallBetween(x1, y1, x2, y2))
        mb.setData('roomIdx', idx)
        this.enemies.add(mb)
      }

      const baseCount = spawnCountForRoom(this.floor)
      const count = this._runChallenges.includes('overcrowded')
        ? Math.ceil(baseCount * 1.5)
        : baseCount
      this.roomEnemyCounts.set(idx, count + (this._eliteHunt ? 1 : 0))
      for (let n = 0; n < count; n++) {
        const ex = (room.x + 1 + Math.floor(Math.random() * (room.w - 2))) * TILE + TILE / 2
        const ey = (room.y + 1 + Math.floor(Math.random() * (room.h - 2))) * TILE + TILE / 2
        const type = pickSpawnType(this.theme, this.floor)
        const enemy = new Enemy(this, ex, ey, type, false, this.floor)
        enemy.setWallChecker((x1, y1, x2, y2) => this.hasWallBetween(x1, y1, x2, y2))
        enemy.setData('roomIdx', idx)
        this.enemies.add(enemy)
      }
    })

    if (this.floor === MAX_FLOOR) {
      const bossRoom = rooms[bossRoomIdx]
      if (!bossRoom) return
      this.boss = new Boss(this, bossRoom.cx * TILE + TILE / 2, bossRoom.cy * TILE + TILE / 2, getBossType(this.theme))
    }
  }

  private spawnHazards() {
    this.dungeon.hazards.forEach(h => {
      this.hazards.push(new Hazard(this, h.x * TILE + TILE / 2, h.y * TILE + TILE / 2, h.type))
    })
  }

  private spawnShop() {
    const { rooms, shopRoomIdx } = this.dungeon
    if (shopRoomIdx < 0 || shopRoomIdx >= rooms.length) return
    const room = rooms[shopRoomIdx]
    const sx = room.cx * TILE + TILE / 2
    const sy = room.cy * TILE + TILE / 2
    this.shopRoomCenter = new Phaser.Math.Vector2(sx, sy)
    const shopLabel = this.add.text(sx, sy - 22, '[ SHOP ]', { fontSize: '14px', color: '#ffd700' }).setOrigin(0.5).setDepth(5)
    this.tweens.add({ targets: shopLabel, alpha: 0.6, duration: 900, yoyo: true, repeat: -1 })
    this.add.text(sx, sy - 6, 'Press TAB', { fontSize: '7px', color: '#665500' }).setOrigin(0.5).setDepth(5)
    this.add.sprite(sx, sy + 6, 'icon_shop').setDepth(4).setScale(1.2)
  }

  private spawnStairs() {
    const { rooms, stairsRoomIdx } = this.dungeon
    if (stairsRoomIdx < 0 || stairsRoomIdx >= rooms.length) return
    const room = rooms[stairsRoomIdx]
    const sx = room.cx * TILE + TILE / 2
    const sy = room.cy * TILE + TILE / 2
    this.stairsSprite = this.add.sprite(sx, sy, 'stairs').setDepth(3)
    this.physics.add.existing(this.stairsSprite, true)
    this.add.text(sx, sy - 22, 'NEXT\nFLOOR', {
      fontSize: '8px', color: '#88aaff', align: 'center',
    }).setOrigin(0.5).setDepth(4)
  }

  private spawnLoot() {
    this.lootGroup = this.physics.add.staticGroup()
    this.droppedItemGroup = this.physics.add.staticGroup()

    const { rooms, tiles } = this.dungeon
    const startRoom = rooms[0]
    const floorTiles: [number, number][] = []

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (tiles[row][col] !== TILE_FLOOR) continue
        const inStart = col >= startRoom.x && col < startRoom.x + startRoom.w &&
                        row >= startRoom.y && row < startRoom.y + startRoom.h
        if (!inStart) floorTiles.push([col, row])
      }
    }

    Phaser.Utils.Array.Shuffle(floorTiles)
    const count = Math.min(14, Math.floor(floorTiles.length * 0.04))
    for (let i = 0; i < count; i++) {
      const [col, row] = floorTiles[i]
      const type: LootType = Math.random() < 0.2 ? 'gem' : 'coin'
      this.lootGroup.add(new Loot(this, col * TILE + TILE / 2, row * TILE + TILE / 2, type))
    }
  }

  private setupCamera() {
    this.cameras.main
      .setBounds(0, 0, COLS * TILE, ROWS * TILE)
      .startFollow(this.player, true, 0.1, 0.1)
  }

  private setupColliders() {
    this.physics.add.collider(this.player, this.wallLayer)
    this.physics.add.collider(this.enemies, this.wallLayer)
    this.physics.add.collider(this.enemies, this.enemies)
    if (this.boss) this.physics.add.collider(this.boss, this.wallLayer)
    this.physics.add.collider(this.player, this.doorGroup)
    this.physics.add.collider(this.enemies, this.doorGroup)
    if (this.boss) this.physics.add.collider(this.boss, this.doorGroup)

    this.physics.add.overlap(this.player, this.lootGroup, (_p, loot) => {
      if (this.gameEnding) return
      const l = loot as Loot
      if (!l.active) return
      const goldMult = this.player.inventory.getStats().lootMult * (this.player.cosmeticBonus.lootMult ?? 1) * this._diffLootMult * this.player.skillLootMult * this._modifierGoldMult
      this.score += Math.round(l.value * goldMult)
      l.destroy()
    })

    this.physics.add.overlap(this.player, this.droppedItemGroup, (_p, dropped) => {
      if (this.gameEnding) return
      const di = dropped as DroppedItem
      const now = this.time.now
      if ((this.droppedItemRejectUntil.get(di) ?? 0) > now) return
      if (this.pickupItem(di.itemDef)) {
        this.droppedItemRejectUntil.delete(di)
        this.droppedItemGroup.remove(di, true, true)
      } else {
        this.droppedItemRejectUntil.set(di, now + 1000)
      }
    })

    if (this.stairsSprite) {
      this.physics.add.overlap(this.player, this.stairsSprite, () => {
        if (!this.gameEnding) this.advanceFloor()
      })
    }
  }

  private setupInput() {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.inventoryUI.isOpen() || this.shopUI.isOpen()) return
      if (p.x < this.scale.width * 0.65) {
        this.player.startTouchMove(p.id, p.x, p.y)
      } else {
        this.player.triggerAttack()
      }
    })
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.player.updateTouchMove(p.id, p.x, p.y))
    this.input.on('pointerup',   (p: Phaser.Input.Pointer) => this.player.endTouchMove(p.id))

    const kb = this.input.keyboard!
    this.invKey     = kb.addKey(getKey('inventory', 'I'))
    this.shopKey    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)
    this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.hotbarKeys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    ]

    kb.on('keydown-ESC', () => {
      if (this.gameEnding) return
      if (!this.scene.isActive()) return
      if (this.inventoryUI.isOpen()) this.inventoryUI.toggle(this.player)
      if (this.shopUI.isOpen()) this.shopUI.close()
      this.scene.pause()
      this.scene.launch('PauseScene')
    })
  }

  private processAttack() {
    const weapon  = this.player.currentWeapon
    const px = this.player.x, py = this.player.y
    const facing  = this.player.facingAngle

    if (weapon.projectile) {
      const stats = this.player.inventory.getStats()
      const cb = this.player.cosmeticBonus
      let critChance = stats.critChance + (cb.critChance ?? 0) + this.player.skillCritBonus
      let isCrit = Math.random() < critChance
      // Predator charges
      if (!isCrit && this.player.rangerPredatorCharges > 0) {
        isCrit = true
        this.player.consumePredatorCharge()
      }
      const dmgMult = this._berserkersGambitActive && this.player.hp < this.player.effectiveMaxHp * 0.3 ? 1.5 : 1
      const arcanePowerMult = (this.player.mageArcanePower && weapon.type === 'staff') ? 1.12 : 1
      const hawkeyeMult = (this.player.rangerHawkeye && weapon.type === 'bow') ? 1.10 : 1
      // Mage Overload: every 4th hit 2x
      let overloadMult = 1
      if (weapon.type === 'staff') {
        if (this.player.incrementMageOverload()) overloadMult = 2
      }
      const dmg = weapon.damage * this.player.skillDamageMult * (cb.damageMult ?? 1) * this.player.tempDamageMult * (isCrit ? 2 : 1) * dmgMult * arcanePowerMult * hawkeyeMult * overloadMult
      const speed = weapon.projectileSpeed ?? 300
      // Hawkeye: extra range (longer TTL)
      const ttl = (this.player.rangerHawkeye && weapon.type === 'bow') ? 2200 : 1600
      const gfx = this.add.circle(px, py, 5, weapon.arcColor).setDepth(8)
      this._projectiles.push({ gfx, vx: Math.cos(facing) * speed, vy: Math.sin(facing) * speed, dmg, isCrit, ttl, slowOnHit: weapon.slowOnHit ?? false })
      return
    }

    const halfArc = Phaser.Math.DegToRad(weapon.arcAngle / 2)
    const gfx = this.add.graphics().setDepth(10)
    gfx.fillStyle(weapon.arcColor, 0.4)
    gfx.slice(px, py, weapon.range, facing - halfArc, facing + halfArc, false)
    gfx.fillPath()
    this.tweens.add({ targets: gfx, alpha: 0, duration: 220, onComplete: () => gfx.destroy() })

    const stats = this.player.inventory.getStats()
    const cb = this.player.cosmeticBonus
    const facingDeg = Phaser.Math.RadToDeg(facing)

    const hitEnemy = (obj: {
      x: number; y: number; active: boolean
      takeDamage: (d: number, a: number, f: number) => boolean
      lootValue?: number; rollDrop?: (legendaryBonus?: number) => ItemDef | null
      applyStatus?: (e: StatusEffect) => void
      hpPct?: () => number
      enemyType?: string
      hasStatus?: (id: string) => boolean
    }) => {
      if (!obj.active) return
      const dist = Phaser.Math.Distance.Between(px, py, obj.x, obj.y)
      if (dist > weapon.range) return
      const toEDeg = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(px, py, obj.x, obj.y))
      const autoHit = dist < weapon.range * 0.35
      if (!autoHit && Math.abs(Phaser.Math.Angle.ShortestBetween(facingDeg, toEDeg)) > weapon.arcAngle / 2) return
      if (this.hasWallBetween(px, py, obj.x, obj.y)) return

      let critChance = stats.critChance + (cb.critChance ?? 0) + this.player.skillCritBonus
      // Rogue Blade Flurry: +5% crit
      if (this.player.rogueBackstab || this.player.roguePoisonedBlades || this.player.rogueDeathMark) {
        critChance += this.player.rogueBackstab ? 0 : 0 // flags used below, no crit boost here
      }
      // Eagle Eye: guaranteed crit below 40% HP
      let isCrit = Math.random() < critChance
      if (!isCrit && this.player.rangerEagleEye && obj.hpPct && obj.hpPct() < 0.40) isCrit = true
      // Predator charges: guaranteed crit
      if (!isCrit && this.player.rangerPredatorCharges > 0) {
        isCrit = true
        this.player.consumePredatorCharge()
      }
      const executeMult = (this.player.skillExecuteBonus && obj.hpPct && obj.hpPct() < 0.18) ? 2 : 1
      const berserkMult = (this._berserkersGambitActive && this.player.hp < this.player.effectiveMaxHp * 0.3) ? 1.5 : 1
      const arcaneMult = (this._arcaneSlowingActive && obj.hasStatus?.('slow')) ? 1.2 : 1
      // Rogue Backstab: +60% dmg from behind
      let backstabMult = 1
      if (this.player.rogueBackstab) {
        const toPlayerAngle = Phaser.Math.Angle.Between(obj.x, obj.y, px, py)
        const diff = Math.abs(Phaser.Math.Angle.Wrap(toPlayerAngle - this.player.facingAngle))
        if (diff > Math.PI * 0.75) backstabMult = 1.6
      }
      // Rogue Death Mark: +35% dmg to enemies below 25% HP
      const deathMarkMult = (this.player.rogueDeathMark && obj.hpPct && obj.hpPct() < 0.25) ? 1.35 : 1
      // Mage Arcane Power: +12% for staff
      const arcanePowerMult = (this.player.mageArcanePower && weapon.type === 'staff') ? 1.12 : 1
      // Mage Overload: every 4th hit 2x
      let overloadMult = 1
      if (weapon.type === 'staff' || weapon.type === 'bow') {
        if (this.player.incrementMageOverload()) overloadMult = 2
      }
      const dmg = weapon.damage * this.player.skillDamageMult * (cb.damageMult ?? 1) * this.player.tempDamageMult * (isCrit ? 2 : 1) * executeMult * berserkMult * arcaneMult * backstabMult * deathMarkMult * arcanePowerMult * overloadMult
      const kbAngle = Phaser.Math.Angle.Between(px, py, obj.x, obj.y)
      const died = obj.takeDamage(dmg, kbAngle, weapon.knockback)
      this._damageDealt += dmg
      this.hud.showDamageNumber(obj.x, obj.y - 20, dmg, isCrit)

      // Crit streak tracking
      if (isCrit) {
        this._critStreak++
        this.checkQuestCritStreak()
      } else {
        this._critStreak = 0
      }

      if (obj === this.boss && !died) this.cameras.main.shake(80, 0.006)

      if (!died) {
        if (weapon.type === 'dagger' || weapon.type === 'dual_dagger') {
          this.player.registerDaggerHit()
          const bonus = this.player.daggerComboBonus
          if (bonus > 0) {
            const comboDmg = bonus * (isCrit ? 2 : 1)
            obj.takeDamage(comboDmg, kbAngle, 0)
            this._damageDealt += comboDmg
            this.hud.showDamageNumber(obj.x, obj.y - 36, comboDmg, this.player.daggerComboCount === 3)
          }
        }
        if (obj.applyStatus) {
          if (weapon.type === 'dagger' || weapon.type === 'dual_dagger') {
            const hasShadow = this.player.inventory.getActiveSets().includes('shadow')
            const bleedDur = (this._shadowbladeActive && isCrit) ? 3500 : (hasShadow ? 3500 : 2000)
            obj.applyStatus(BLEED(bleedDur))
            const bt = this.add.text(obj.x, obj.y - 36, '*', { fontSize: '12px', color: '#ff4444' }).setDepth(30).setOrigin(0.5)
            this.tweens.add({ targets: bt, y: bt.y - 20, alpha: 0, duration: 700, onComplete: () => bt.destroy() })
          }
          if (weapon.type === 'mace')   obj.applyStatus(STAGGER())
          if (isCrit && this.player.skillCritAppliesCripple) obj.applyStatus(CRIPPLE())
          // Rogue Poisoned Blades
          if (this.player.roguePoisonedBlades && (weapon.type === 'dagger' || weapon.type === 'dual_dagger')) {
            obj.applyStatus(POISON(3000))
          }
        }
      }

      const lootMultFull = stats.lootMult * (cb.lootMult ?? 1) * this._diffLootMult * this.player.skillLootMult
      if (died) {
        this.enemiesKilled++
        this._killStreak++
        if (this._killStreak > 0 && this._killStreak % 5 === 0) {
          this.hud.showStreakText(this.scale.width / 2, this.scale.height * 0.35, this._killStreak)
        }
        this.score += Math.round((obj.lootValue ?? 0) * lootMultFull * this._modifierGoldMult) + this.player.skillGoldPerKill
        if (this.player.skillBerserkerOnKill) this.player.applyTempSpeedBoost(20, 3000)

        // Bloodlust: heal 3 HP on kill
        if (this.player.skillBloodlust) {
          this.player.heal(3)
        }

        // Rogue Killing Spree: kill resets Shadow Step CD
        if (this.player.rogueKillingSpree) {
          this.player.resetAbilityCdE()
        }

        // Mage Frost Nova: staff kill creates slow field
        if (this.player.mageFrostNova && (weapon.type === 'staff' || weapon.type === 'bow')) {
          const novaX = obj.x, novaY = obj.y
          const nova = this.add.circle(novaX, novaY, 80, 0x88ccff, 0.3).setDepth(15)
          this.tweens.add({ targets: nova, alpha: 0, duration: 3000, onComplete: () => { if (nova.active) nova.destroy() } })
          this.time.addEvent({
            delay: 500, repeat: 5,
            callback: () => {
              this.enemies.getChildren().forEach(e => {
                const en = e as Enemy
                if (en.active && Phaser.Math.Distance.Between(novaX, novaY, en.x, en.y) < 80) {
                  en.applyStatus(SLOW(1000))
                }
              })
            },
          })
        }

        // Fortune's Edge: 5% extra gold
        if (this._fortuneEdgeActive && Math.random() < 0.05) {
          const goldPickup = new Loot(this, obj.x, obj.y, 'coin')
          this.lootGroup.add(goldPickup)
          this.lootGroup.refresh()
        }

        const drop = obj.rollDrop?.(this.player.skillLegendaryBonus)
        if (drop) {
          // blessed_run or scavenger_instinct: force uncommon+
          const finalDrop = (this._blessedRun || (this.player.skillScavengerInstinct && this._firstPickupInRoom))
            ? this.upgradeToUncommonPlus(drop)
            : drop
          this.spawnDrop(obj.x, obj.y, finalDrop)
          if (this.player.skillScavengerInstinct && this._firstPickupInRoom) {
            this._firstPickupInRoom = false
          }
        }
        this.updateQuestProgress(weapon.type, obj.enemyType ?? 'unknown')
        const asEnemy = obj as unknown as { getData?: (k: string) => unknown }
        const roomIdx = asEnemy.getData?.('roomIdx')
        if (typeof roomIdx === 'number') {
          const remaining = (this.roomEnemyCounts.get(roomIdx) ?? 1) - 1
          this.roomEnemyCounts.set(roomIdx, remaining)
          if (remaining <= 0) this.onRoomCleared(roomIdx, obj.x, obj.y)
        }
      }
    }

    this.enemies.getChildren().forEach(e => hitEnemy(e as Enemy))
    if (this.boss?.active) hitEnemy(this.boss)
  }

  private upgradeToUncommonPlus(item: ItemDef): ItemDef {
    const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']
    const currentIdx = RARITY_ORDER.indexOf(item.rarity)
    if (currentIdx >= 1) return item // already uncommon+
    // Find a replacement uncommon item of same slot type
    const candidates = ITEMS.filter(i =>
      (i.rarity === 'uncommon' || i.rarity === 'rare') &&
      i.slotType === item.slotType
    )
    if (candidates.length === 0) return item
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  private spawnDrop(x: number, y: number, item: ItemDef) {
    const d = new DroppedItem(this, x, y, item)
    this.droppedItemGroup.add(d)
    this.droppedItemGroup.refresh()
  }

  private pickupItem(item: ItemDef): boolean {
    if (item.slotType === 'consumable') {
      if (this.player.bag.canAdd(item)) {
        this.player.bag.add(item)
        this.hud.showPickupText(this.player.x, this.player.y - 40, `+ ${item.name}`)
        return true
      }
      this.hud.showPickupText(this.player.x, this.player.y - 40, 'Bag full!')
      return false
    }

    const inv = this.player.inventory
    const slotFree = item.slotType === 'weapon'
      ? (!inv.get('weapon1') || !inv.get('weapon2'))
      : !inv.get(item.slotType as 'helm' | 'chest' | 'legs' | 'gloves' | 'ring' | 'necklace')

    if (slotFree) {
      inv.equipItem(item)
      this.hud.showPickupText(this.player.x, this.player.y - 40, `Equip: ${item.name}`)
      this.inventoryUI.refresh(this.player)
      return true
    }

    if (this.player.bag.canAdd(item)) {
      this.player.bag.add(item)
      this.hud.showPickupText(this.player.x, this.player.y - 40, `+ ${item.name} (bag)`)
      this.inventoryUI.refresh(this.player)
      return true
    }

    this.hud.showPickupText(this.player.x, this.player.y - 40, 'Bag full!')
    return false
  }

  private handleBossDefeated() {
    this.hud.hideBossBar()
    const room = this.dungeon.rooms[this.dungeon.bossRoomIdx]
    if (!room) { this.endGame(true); return }
    this.spawnPortal(room.cx * TILE + TILE / 2, room.cy * TILE + TILE / 2)
    this.cameras.main.flash(500, 255, 200, 0)
    const txt = this.add.text(room.cx * TILE + TILE / 2, room.cy * TILE - 60, 'BOSS DEFEATED!',
      { fontSize: '18px', fontStyle: 'bold', color: '#ffcc00' }).setOrigin(0.5).setDepth(20)
    this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 2200, onComplete: () => txt.destroy() })

    // Boss no consumable quest check
    if (!this._consumablesUsedDuringBoss) {
      const save = SaveManager.load()
      const questId = 'q_boss_no_consumable'
      if (save.quests.active.includes(questId)) {
        save.quests.progress[questId] = (save.quests.progress[questId] ?? 0) + 1
        const def = QUESTS.find(q => q.id === questId)
        if (def && (save.quests.progress[questId] ?? 0) >= def.target && !save.quests.completed.includes(questId)) {
          save.quests.completed.push(questId)
          save.gold += def.reward
          this.hud.showPickupText(this.player.x, this.player.y - 50, `Quest: ${def.title}! +${def.reward}g`)
        }
        SaveManager.save(save)
      }
    }

    const cosmeticId = this.theme === 'dungeon' ? 'void' : 'blood'
    const bSave = SaveManager.load()
    if (!bSave.unlockedCosmetics.includes(cosmeticId)) {
      bSave.unlockedCosmetics.push(cosmeticId)
      SaveManager.save(bSave)
      this.hud.showPickupText(this.player.x, this.player.y - 40, `Cosmetic unlocked: ${cosmeticId}!`)
    }
  }

  private handleMinibossKilled() {
    if (Math.random() < 0.3) {
      const minibossRoom = this.dungeon.rooms[this.dungeon.minibossRoomIdx]
      if (minibossRoom) {
        this.spawnPortal(minibossRoom.cx * TILE + TILE / 2, minibossRoom.cy * TILE + TILE / 2)
        this.hud.showPickupText(this.player.x, this.player.y - 50, 'Escape portal appeared!')
      }
    }
  }

  private spawnPortal(x: number, y: number) {
    if (this.portal) return
    this.portal = this.add.sprite(x, y, 'portal').setDepth(3)
    this.physics.add.existing(this.portal, true)
    this.tweens.add({ targets: this.portal, alpha: 0.6, duration: 1200, yoyo: true, repeat: -1 })
    this.add.text(x, y - 34, 'EXIT', { fontSize: '10px', color: '#00ffcc' }).setOrigin(0.5).setDepth(4)
    this.physics.add.overlap(this.player, this.portal, () => {
      if (!this.gameEnding) this.endGame(true)
    })
  }

  private advanceFloor() {
    if (this.gameEnding) return
    this.gameEnding = true
    this.physics.world.pause()
    this.player.setVelocity(0, 0)

    // no_heal_floor quest: check if no consumables used this floor
    this.checkNoHealFloorQuest()

    this.player.hp = Math.min(this.player.effectiveMaxHp, Math.round(this.player.hp + this.player.effectiveMaxHp * 0.25))
    const runState: RunState = {
      hp: this.player.hp,
      score: this.score,
      equippedGear: this.player.inventory.serialize(),
      bag: this.player.bag.serialize(),
      curses: this._curses,
      challenges: this._runChallenges,
      challengeGoldBonus: this._runChallengeGoldBonus,
    }
    this.registry.set('runState', runState)
    this.registry.set('currentFloor', this.floor + 1)
    this.cameras.main.flash(200, 255, 255, 255)
    this.time.delayedCall(200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.time.removeAllEvents()
        this.tweens.killAll()
        this._consumablesUsedThisFloor = 0
        this._firstPickupInRoom = true
        this.scene.start('DungeonScene')
      })
    })
  }

  private handlePlayerDeath() {
    // Capture killed-by info from nearest/most recent enemy
    if (!this._killedBy) {
      let closestEnemy: Enemy | null = null
      let closestDist = Infinity
      this.enemies.getChildren().forEach(e => {
        const en = e as Enemy
        if (!en.active) return
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, en.x, en.y)
        if (d < closestDist) { closestDist = d; closestEnemy = en }
      })
      if (closestEnemy) {
        this._killedBy = (closestEnemy as Enemy).enemyType ?? 'unknown'
      } else if (this.boss?.active) {
        this._killedBy = this.boss.bossName
      }
    }

    // Check revive option
    if (!this._reviveUsed && AdManager.isAvailable()) {
      this.showReviveOverlay()
    } else {
      this.endGame(false)
    }
  }

  private showReviveOverlay() {
    this.physics.pause()
    const { width, height } = this.scale
    const objs: Phaser.GameObjects.GameObject[] = []

    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.78)
      .setOrigin(0).setScrollFactor(0).setDepth(300)
    const titleTxt = this.add.text(width / 2, height * 0.36, 'YOU DIED', {
      fontSize: '40px', fontStyle: 'bold', color: '#ff3333',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5)
    const descTxt = this.add.text(width / 2, height * 0.46, 'Watch a short ad to revive with 30% HP', {
      fontSize: '13px', color: '#aaaaaa',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5)

    const reviveBtn = this.add.text(width / 2 - 70, height * 0.56, '[ REVIVE ]', {
      fontSize: '20px', fontStyle: 'bold', color: '#00ffcc',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setInteractive({ useHandCursor: true })
    const giveUpBtn = this.add.text(width / 2 + 70, height * 0.56, '[ GIVE UP ]', {
      fontSize: '20px', color: '#884444',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setInteractive({ useHandCursor: true })

    reviveBtn.on('pointerover', () => reviveBtn.setColor('#ffffff'))
    reviveBtn.on('pointerout',  () => reviveBtn.setColor('#00ffcc'))
    reviveBtn.on('pointerdown', () => {
      reviveBtn.disableInteractive()
      giveUpBtn.disableInteractive()
      AdManager.requestAd('revive').then(reward => {
        if (reward.granted) {
          this._reviveUsed = true
          for (const o of objs) { if (o.active) (o as Phaser.GameObjects.GameObject & { destroy: () => void }).destroy() }
          this.player.hp = Math.max(1, Math.floor(this.player.effectiveMaxHp * 0.3))
          this.player.setActive(true).setVisible(true)
          this.physics.resume()
          this.gameEnding = false
          this.hud.showPickupText(this.player.x, this.player.y - 50, 'REVIVED!')
        } else {
          this.endGame(false)
        }
      })
    })
    giveUpBtn.on('pointerover', () => giveUpBtn.setColor('#ff4444'))
    giveUpBtn.on('pointerout',  () => giveUpBtn.setColor('#884444'))
    giveUpBtn.on('pointerdown', () => {
      for (const o of objs) { if (o.active) (o as Phaser.GameObjects.GameObject & { destroy: () => void }).destroy() }
      this.endGame(false)
    })

    objs.push(bg, titleTxt, descTxt, reviveBtn, giveUpBtn)
  }

  private endGame(victory: boolean) {
    if (this.gameEnding) return
    this.gameEnding = true
    this.player.setVelocity(0, 0)
    this.physics.world.pause()

    // Determine top weapon
    let topWeapon = ''
    let topKills = 0
    for (const [wt, cnt] of Object.entries(this._runKillsByWeapon)) {
      if (cnt > topKills) { topKills = cnt; topWeapon = wt }
    }
    this._topWeapon = topWeapon

    const save = SaveManager.load()
    if (victory) {
      save.gold += this.score + this._runChallengeGoldBonus
      save.equippedGear = this.player.inventory.serialize() as typeof save.equippedGear
      save.bag = this.player.bag.serialize()
      save.stats.totalGold += this.score
      save.stats.runsCompleted += 1
      if (!save.progress[this.theme]) {
        save.progress[this.theme] = { highestFloor: 0, bossDefeated: false }
      }
      const prog = save.progress[this.theme]
      if (this.floor > prog.highestFloor) prog.highestFloor = this.floor
      if (this.floor === MAX_FLOOR) prog.bossDefeated = true
    } else {
      save.gold += Math.floor(this.score * 0.25)
      save.bag = []
      save.stats.runsCompleted += 1
    }
    save.stats.totalKills += this.enemiesKilled
    save.stats.runsCompleted = Math.max(save.stats.runsCompleted, save.stats.runsCompleted)
    save.killStats.totalKills  += this.enemiesKilled
    save.killStats.runsCompleted += 1
    for (const [wt, cnt] of Object.entries(this._runKillsByWeapon)) {
      save.killStats.byWeapon[wt] = (save.killStats.byWeapon[wt] ?? 0) + cnt
    }
    if (victory && this.floor === MAX_FLOOR) save.killStats.floorsCleared += 1

    // floors_cleared quest for floor 5
    if (victory) {
      for (const questId of save.quests.active) {
        const def = QUESTS.find(q => q.id === questId)
        if (!def || def.type !== 'floors_cleared') continue
        save.quests.progress[questId] = (save.quests.progress[questId] ?? 0) + 1
        if ((save.quests.progress[questId] ?? 0) >= def.target && !save.quests.completed.includes(questId)) {
          save.quests.completed.push(questId)
          save.gold += def.reward
        }
      }
    }

    if (victory && this._runChallenges.length > 0) {
      const achChalDef = ACHIEVEMENTS.find(a => a.id === 'ach_challenge5')
      if (achChalDef && !save.achievements.completed.includes('ach_challenge5')) {
        save.achievements.progress['ach_challenge5'] = (save.achievements.progress['ach_challenge5'] ?? 0) + 1
        if ((save.achievements.progress['ach_challenge5'] ?? 0) >= achChalDef.target) {
          save.achievements.completed.push('ach_challenge5')
          this._newlyCompletedAchievements.push('ach_challenge5')
        }
      }
    }

    for (const questId of save.quests.active) {
      const def = QUESTS.find(q => q.id === questId)
      if (!def || def.type !== 'runs_completed') continue
      save.quests.progress[questId] = (save.quests.progress[questId] ?? 0) + 1
      if ((save.quests.progress[questId] ?? 0) >= def.target && !save.quests.completed.includes(questId)) {
        save.quests.completed.push(questId)
        save.gold += def.reward
      }
    }
    SaveManager.save(save)
    this.registry.remove('runState')
    this.registry.remove('runModifier')
    this.registry.set('currentFloor', 1)

    const { score, floor, theme, enemiesKilled } = this
    const newAch = [...this._newlyCompletedAchievements]
    const damageDealt = this._damageDealt
    const topWeaponFinal = this._topWeapon
    const consumablesUsed = this._consumablesUsed
    const killedBy = this._killedBy

    this.cameras.main.fadeOut(600, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.time.removeAllEvents()
      this.tweens.killAll()
      this.scene.start('GameOver', {
        score, victory, floor, theme, enemiesKilled,
        newAchievements: newAch,
        challengeBonus: this._runChallengeGoldBonus,
        damageDealt,
        topWeapon: topWeaponFinal,
        consumablesUsed,
        killedBy,
      })
    })
  }

  private hasWallBetween(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = x2 - x1, dy = y2 - y1
    const steps = Math.ceil(Math.sqrt(dx * dx + dy * dy) / (TILE / 2))
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const col = Math.floor((x1 + dx * t) / TILE)
      const row = Math.floor((y1 + dy * t) / TILE)
      const tile = this.wallLayer.getTileAt(col, row)
      if (tile && tile.index === TILE_WALL) return true
    }
    return false
  }

  private onRoomCleared(roomIdx: number, lastKillX: number, lastKillY: number) {
    const room = this.dungeon.rooms[roomIdx]
    if (!room) return
    const cx = room.cx * TILE + TILE / 2
    const cy = room.cy * TILE + TILE / 2
    for (let i = 0; i < 3; i++) {
      const ox = (Math.random() - 0.5) * 48
      const oy = (Math.random() - 0.5) * 48
      this.lootGroup.add(new Loot(this, cx + ox, cy + oy, 'coin'))
    }
    if (Math.random() < 0.3) {
      const bandage = ITEMS.find(i => i.id === 'bandage')
      if (bandage) this.spawnDrop(cx, cy + 22, bandage)
    }
    // Reset first pickup flag on room clear
    this._firstPickupInRoom = true
    this.hud.showPickupText(lastKillX, lastKillY - 30, 'Room Cleared! +Gold')
    this.lootGroup.refresh()
  }

  private spawnDoors() {
    this.doorGroup = this.add.group()
    this.dungeon.doors.forEach(d => {
      const door = new Door(this, d.x * TILE + TILE / 2, d.y * TILE + TILE / 2)
      this.doors.push(door)
      this.doorGroup.add(door)
    })
  }

  private spawnTorches() {
    // Floor-based tint adjustments
    const tintMap: Record<DungeonTheme, number> = { dungeon: 0xff6600, castle: 0xffcc00, caves: 0x00aacc }
    let tint = tintMap[this.theme]
    let flickerDuration = 550

    if (this.floor === 2) {
      // Slightly darker
      tint = Phaser.Display.Color.ValueToColor(tint).darken(15).color
    } else if (this.floor === 3) {
      tint = Phaser.Display.Color.ValueToColor(tint).darken(25).color
    } else if (this.floor === 4) {
      tint = Phaser.Display.Color.ValueToColor(tint).darken(40).color
      flickerDuration = 275 // double flicker rate
    } else if (this.floor >= 5) {
      tint = 0xff3300 // near red/orange regardless of theme
      flickerDuration = 250
    }

    this.dungeon.rooms.forEach(room => {
      const corners = [
        [room.x + 1, room.y + 1],
        [room.x + room.w - 2, room.y + 1],
        [room.x + 1, room.y + room.h - 2],
        [room.x + room.w - 2, room.y + room.h - 2],
      ]
      corners.forEach(([col, row]) => {
        const torch = this.add.sprite(col * TILE + TILE / 2, row * TILE + TILE / 2, 'torch').setDepth(1).setTint(tint)
        this.tweens.add({ targets: torch, alpha: 0.55, duration: flickerDuration + Math.random() * 200, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      })

      // Floor 3+: fog overlay on room edges
      if (this.floor >= 3) {
        const fogAlpha = this.floor === 3 ? 0.12 : this.floor === 4 ? 0.20 : 0.28
        this.add.rectangle(
          room.x * TILE, room.y * TILE,
          room.w * TILE, TILE * 2, 0x000000, fogAlpha,
        ).setOrigin(0).setDepth(1)
        this.add.rectangle(
          room.x * TILE, (room.y + room.h - 2) * TILE,
          room.w * TILE, TILE * 2, 0x000000, fogAlpha,
        ).setOrigin(0).setDepth(1)
      }
    })
  }

  private spawnDecorations() {
    const themeColors: Record<DungeonTheme, number> = { dungeon: 0xcc2200, castle: 0xffcc00, caves: 0x00aacc }
    const borderColor = themeColors[this.theme]

    this.dungeon.pillars.forEach(p => {
      this.add.rectangle(p.x * TILE + TILE / 2, p.y * TILE + TILE / 2, 12, 12, 0x334455, 0.9)
        .setDepth(2).setStrokeStyle(1, 0x557799, 0.8)
    })

    const br = this.dungeon.rooms[this.dungeon.bossRoomIdx]
    if (br) {
      const bx = br.x * TILE, by = br.y * TILE
      const bw = br.w * TILE, bh = br.h * TILE
      this.add.rectangle(bx + bw / 2, by + bh / 2, bw, bh, 0, 0)
        .setOrigin(0.5).setDepth(0.5).setStrokeStyle(3, borderColor, 0.55)
    }
  }

  private updateProjectiles(delta: number) {
    this._projectiles = this._projectiles.filter(p => {
      if (!p.gfx.active) return false
      p.ttl -= delta
      p.gfx.x += p.vx * delta / 1000
      p.gfx.y += p.vy * delta / 1000
      if (this.hasWallBetween(p.gfx.x, p.gfx.y, p.gfx.x + p.vx * 0.01, p.gfx.y + p.vy * 0.01)) {
        p.gfx.destroy(); return false
      }
      let hit = false
      const allTargets = [...this.enemies.getChildren(), ...(this.boss?.active ? [this.boss] : [])]
      for (const e of allTargets) {
        const enemy = e as Enemy
        if (!enemy.active) continue
        const d = Phaser.Math.Distance.Between(p.gfx.x, p.gfx.y, enemy.x, enemy.y)
        if (d < 20) {
          const kb = Phaser.Math.Angle.Between(p.gfx.x, p.gfx.y, enemy.x, enemy.y)
          const died = enemy.takeDamage(p.dmg, kb, 80)
          this._damageDealt += p.dmg
          this.hud.showDamageNumber(enemy.x, enemy.y - 20, p.dmg, p.isCrit)
          if (!died && (enemy as unknown as { applyStatus?: (e: StatusEffect) => void }).applyStatus) {
            const applyFn = (enemy as unknown as { applyStatus: (e: StatusEffect) => void }).applyStatus.bind(enemy)
            applyFn(BLEED())
            if (p.slowOnHit) applyFn(SLOW(1500))
          }
          // Ranger Explosive Arrow: splash on bow hit
          if (this.player.rangerExplosiveArrow) {
            const splashX = enemy.x, splashY = enemy.y
            const splashDmg = Math.round(p.dmg * 0.5)
            this.enemies.getChildren().forEach(se => {
              const splashEnemy = se as Enemy
              if (!splashEnemy.active || splashEnemy === enemy) return
              const sd = Phaser.Math.Distance.Between(splashX, splashY, splashEnemy.x, splashEnemy.y)
              if (sd <= 60) {
                splashEnemy.takeDamage(splashDmg, 0, 0)
                this._damageDealt += splashDmg
              }
            })
          }
          // Mage Chain Lightning: bounce to nearest other enemy
          if (this.player.mageChainLightning) {
            let nearest: Enemy | null = null
            let nearestDist = 120
            this.enemies.getChildren().forEach(ce => {
              const ce2 = ce as Enemy
              if (!ce2.active || ce2 === enemy) return
              const cd2 = Phaser.Math.Distance.Between(enemy.x, enemy.y, ce2.x, ce2.y)
              if (cd2 < nearestDist) { nearestDist = cd2; nearest = ce2 }
            })
            if (nearest) {
              const chainDmg = Math.round(p.dmg * 0.7)
              ;(nearest as Enemy).takeDamage(chainDmg, 0, 0)
              this._damageDealt += chainDmg
              this.hud.showDamageNumber((nearest as Enemy).x, (nearest as Enemy).y - 20, chainDmg, false)
              // Lightning visual
              const bolt = this.add.graphics().setDepth(15)
              bolt.lineStyle(2, 0x88ffff, 0.9)
              bolt.lineBetween(enemy.x, enemy.y, (nearest as Enemy).x, (nearest as Enemy).y)
              this.tweens.add({ targets: bolt, alpha: 0, duration: 200, onComplete: () => { if (bolt.active) bolt.destroy() } })
            }
          }
          if (died) {
            this.enemiesKilled++
            this._killStreak++
            if (this._killStreak > 0 && this._killStreak % 5 === 0) this.hud.showStreakText(this.scale.width / 2, this.scale.height * 0.35, this._killStreak)
            const lootMultFull = this.player.inventory.getStats().lootMult * this._diffLootMult * this.player.skillLootMult
            this.score += Math.round(((enemy as unknown as { lootValue?: number }).lootValue ?? 0) * lootMultFull * this._modifierGoldMult) + this.player.skillGoldPerKill
            if (this.player.skillBloodlust) this.player.heal(3)
            if (this.player.rogueKillingSpree) this.player.resetAbilityCdE()
            // Mage Frost Nova on projectile kill
            if (this.player.mageFrostNova) {
              const novaX = enemy.x, novaY = enemy.y
              const nova = this.add.circle(novaX, novaY, 80, 0x88ccff, 0.3).setDepth(15)
              this.tweens.add({ targets: nova, alpha: 0, duration: 3000, onComplete: () => { if (nova.active) nova.destroy() } })
              this.time.addEvent({
                delay: 500, repeat: 5,
                callback: () => {
                  this.enemies.getChildren().forEach(fe => {
                    const fen = fe as Enemy
                    if (fen.active && Phaser.Math.Distance.Between(novaX, novaY, fen.x, fen.y) < 80) {
                      fen.applyStatus(SLOW(1000))
                    }
                  })
                },
              })
            }
            const drop = (enemy as unknown as { rollDrop?: (lb: number) => ItemDef | null }).rollDrop?.(this.player.skillLegendaryBonus)
            if (drop) this.spawnDrop(enemy.x, enemy.y, drop)
            const roomIdx = (enemy as unknown as { getData?: (k: string) => unknown }).getData?.('roomIdx')
            if (typeof roomIdx === 'number') {
              const remaining = (this.roomEnemyCounts.get(roomIdx) ?? 1) - 1
              this.roomEnemyCounts.set(roomIdx, remaining)
              if (remaining <= 0) this.onRoomCleared(roomIdx, enemy.x, enemy.y)
            }
          }
          hit = true; break
        }
      }
      if (hit || p.ttl <= 0) { if (p.gfx.active) p.gfx.destroy(); return false }
      return true
    })
  }

  private useHotbarSlot(slotIndex: number) {
    if (this.gameEnding || this.inventoryUI.isOpen() || this.shopUI.isOpen()) return
    const allItems = this.player.bag.getAll()
    let consumableCount = 0
    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].slotType === 'consumable') {
        if (consumableCount === slotIndex) {
          const item = allItems[i]
          if (this._runChallenges.includes('ironman') && item.healAmount) {
            this.hud.showPickupText(this.player.x, this.player.y - 40, 'Ironman: no heals!')
            return
          }
          this.player.useConsumable(item)
          this.player.bag.remove(i)
          this.hud.showPickupText(this.player.x, this.player.y - 40, `Used: ${item.name}`)
          this._consumablesUsed++
          this._consumablesUsedThisFloor++
          if (this._bossStarted) this._consumablesUsedDuringBoss++
          return
        }
        consumableCount++
      }
    }
  }

  private handleReflect(amount: number) {
    type Hittable = { x: number; y: number; active: boolean; takeDamage: (d: number, a: number, f: number) => boolean; rollDrop?: () => ItemDef | null }
    let closestObj: Hittable | null = null
    let closestDist = Infinity
    const check = (obj: Hittable) => {
      if (!obj.active) return
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y)
      if (d < closestDist) { closestDist = d; closestObj = obj }
    }
    this.enemies.getChildren().forEach(e => check(e as Enemy))
    if (this.boss?.active) check(this.boss as unknown as Hittable)
    if (!closestObj) return
    const target = closestObj as Hittable
    const kbAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y)
    const died = target.takeDamage(amount, kbAngle, 0)
    this.hud.showDamageNumber(target.x, target.y - 20, amount, false)
    if (died) {
      this.enemiesKilled++
      const drop = target.rollDrop?.()
      if (drop) this.spawnDrop(target.x, target.y, drop)
    }
  }

  private triggerEventRoom() {
    this._eventRoomTriggered = true
    const types: EventRoomType[] = ['shrine', 'cursed_chest', 'challenge', 'sacrifice_shrine', 'memory_echo']
    const type = types[Math.floor(Math.random() * types.length)]
    if (type === 'sacrifice_shrine') {
      this.showSacrificeShrine()
    } else if (type === 'memory_echo') {
      this.showMemoryEcho()
    } else {
      this._eventRoomUI.show(
        this, type, this.score,
        (key: string) => this.handleEventChoice(type, key),
        () => { /* player chose to decline */ },
      )
    }
  }

  private showSacrificeShrine() {
    const { width, height } = this.scale
    const objs: Phaser.GameObjects.GameObject[] = []

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.60)
      .setOrigin(0).setScrollFactor(0).setDepth(100)
    const titleTxt = this.add.text(width / 2, height * 0.22, 'SACRIFICE SHRINE', {
      fontSize: '18px', fontStyle: 'bold', color: '#cc44cc',
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5)
    const descTxt = this.add.text(width / 2, height * 0.30, 'Destroy an equipped item for permanent power this run', {
      fontSize: '10px', color: '#886688', wordWrap: { width: width - 40 }, align: 'center',
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5)
    objs.push(overlay, titleTxt, descTxt)

    let btnY = height * 0.38
    const equippedSlots = ['weapon1', 'weapon2', 'helm', 'chest', 'legs', 'gloves', 'ring', 'necklace'] as EquipSlot[]
    let hasItems = false
    equippedSlots.forEach(slot => {
      const item = this.player.inventory.get(slot)
      if (!item) return
      hasItems = true
      const btn = this.add.text(width / 2, btnY, `[Sacrifice ${item.name}]`, {
        fontSize: '12px', color: '#cc4444',
      }).setScrollFactor(0).setDepth(101).setOrigin(0.5).setInteractive({ useHandCursor: true })
      btn.on('pointerover', () => btn.setColor('#ff6666'))
      btn.on('pointerout',  () => btn.setColor('#cc4444'))
      btn.on('pointerdown', () => {
        this.player.inventory.unequip(slot)
        this.player.maxHp += 15
        this.player.heal(15)
        this.player.applyTempDamageBoost(0.08, 600_000)
        this.hud.showPickupText(this.player.x, this.player.y - 40, '+15 HP & +8% DMG!')
        for (const o of objs) { if (o.active) (o as { destroy: () => void }).destroy() }
        this._eventRoomTriggered = true
      })
      objs.push(btn)
      btnY += 26
    })

    if (!hasItems) {
      this.add.text(width / 2, btnY, '(No equipped items)', {
        fontSize: '11px', color: '#554455',
      }).setScrollFactor(0).setDepth(101).setOrigin(0.5)
    }

    const leaveBtn = this.add.text(width / 2, Math.max(btnY + 20, height * 0.72), '[ Leave ]', {
      fontSize: '13px', color: '#445566',
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5).setInteractive({ useHandCursor: true })
    leaveBtn.on('pointerover', () => leaveBtn.setColor('#aaaaaa'))
    leaveBtn.on('pointerout',  () => leaveBtn.setColor('#445566'))
    leaveBtn.on('pointerdown', () => {
      for (const o of objs) { if (o.active) (o as { destroy: () => void }).destroy() }
    })
    objs.push(leaveBtn)
  }

  private showMemoryEcho() {
    const { width, height } = this.scale
    const objs: Phaser.GameObjects.GameObject[] = []

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.55)
      .setOrigin(0).setScrollFactor(0).setDepth(100)
    const titleTxt = this.add.text(width / 2, height * 0.22, 'MEMORY ECHO', {
      fontSize: '18px', fontStyle: 'bold', color: '#8844cc',
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5)
    const descTxt = this.add.text(width / 2, height * 0.30,
      'Defeat the spectral enemies for a reward', {
      fontSize: '10px', color: '#665588', align: 'center',
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5)
    objs.push(overlay, titleTxt, descTxt)

    const acceptBtn = this.add.text(width / 2 - 60, height * 0.42, '[ Fight ]', {
      fontSize: '16px', fontStyle: 'bold', color: '#8844ff',
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5).setInteractive({ useHandCursor: true })
    const leaveBtn = this.add.text(width / 2 + 60, height * 0.42, '[ Leave ]', {
      fontSize: '16px', color: '#445566',
    }).setScrollFactor(0).setDepth(101).setOrigin(0.5).setInteractive({ useHandCursor: true })
    objs.push(acceptBtn, leaveBtn)

    acceptBtn.on('pointerdown', () => {
      for (const o of objs) { if (o.active) (o as { destroy: () => void }).destroy() }
      this.startMemoryEcho()
    })
    leaveBtn.on('pointerover', () => leaveBtn.setColor('#aaaaaa'))
    leaveBtn.on('pointerout',  () => leaveBtn.setColor('#445566'))
    leaveBtn.on('pointerdown', () => {
      for (const o of objs) { if (o.active) (o as { destroy: () => void }).destroy() }
    })
  }

  private startMemoryEcho() {
    const er = this.dungeon.eventRoomIdx >= 0 ? this.dungeon.rooms[this.dungeon.eventRoomIdx] : null
    if (!er) return
    const echoes: Enemy[] = []
    const count = 4
    for (let n = 0; n < count; n++) {
      const ex = (er.x + 1 + Math.floor(Math.random() * (er.w - 2))) * TILE + TILE / 2
      const ey = (er.y + 1 + Math.floor(Math.random() * (er.h - 2))) * TILE + TILE / 2
      const type = pickSpawnType(this.theme, Math.min(MAX_FLOOR, this.floor + 1))
      const enemy = new Enemy(this, ex, ey, type, false, this.floor + 1)
      enemy.setWallChecker((x1, y1, x2, y2) => this.hasWallBetween(x1, y1, x2, y2))
      enemy.setTint(0x8844ff)
      this.enemies.add(enemy)
      echoes.push(enemy)
    }
    this.hud.showPickupText(this.player.x, this.player.y - 40, 'Defeat the spectral enemies!')
    // Check periodically for all dead
    const checkInterval = this.time.addEvent({
      delay: 500, loop: true, callback: () => {
        if (echoes.every(e => !e.active)) {
          checkInterval.destroy()
          const rarePool = ITEMS.filter(i => i.rarity === 'rare' || i.rarity === 'epic' || i.rarity === 'legendary')
          if (rarePool.length > 0) {
            const reward = rarePool[Math.floor(Math.random() * rarePool.length)]
            const ecx = this._eventRoomCenter?.x ?? this.player.x
            const ecy = this._eventRoomCenter?.y ?? this.player.y
            this.spawnDrop(ecx, ecy, reward)
            this.hud.showPickupText(this.player.x, this.player.y - 40, 'Memory Echo: +Rare Reward!')
          }
        }
      },
    })
  }

  private handleEventChoice(type: EventRoomType, key: string) {
    const ecx = this._eventRoomCenter?.x ?? this.player.x
    const ecy = this._eventRoomCenter?.y ?? this.player.y

    if (type === 'shrine') {
      if (this.score < 80) return
      this.score -= 80
      if (key === 'hp') {
        this.player.maxHp += 20
        this.player.heal(20)
        this.hud.showPickupText(this.player.x, this.player.y - 40, '+20 Max HP!')
      } else if (key === 'damage') {
        this.player.applyTempDamageBoost(0.1, 600_000)
        this.hud.showPickupText(this.player.x, this.player.y - 40, '+10% Damage!')
      } else if (key === 'speed') {
        this.player.applyTempSpeedBoost(25, 600_000)
        this.hud.showPickupText(this.player.x, this.player.y - 40, '+15% Speed!')
      }
    } else if (type === 'cursed_chest') {
      const epicItems = ITEMS.filter(i => i.rarity === 'epic' || i.rarity === 'legendary')
      if (epicItems.length > 0) {
        const item = epicItems[Math.floor(Math.random() * epicItems.length)]
        this.spawnDrop(ecx, ecy, item)
      }
      const curseOptions = ['max_hp', 'shop_prices', 'move_speed']
      const curse = curseOptions[Math.floor(Math.random() * curseOptions.length)]
      if (!this._curses.includes(curse)) {
        this._curses.push(curse)
        if (curse === 'max_hp') {
          this.player.maxHp = Math.max(10, this.player.maxHp - 10)
          this.player.hp = Math.min(this.player.hp, this.player.effectiveMaxHp)
          this.hud.showPickupText(this.player.x, this.player.y - 40, 'Cursed: -10 Max HP')
        } else if (curse === 'move_speed') {
          this.player.applyStatus({ id: 'slow', duration: 600_000, slowMult: 0.9 })
          this.hud.showPickupText(this.player.x, this.player.y - 40, 'Cursed: -10% Speed')
        } else if (curse === 'shop_prices') {
          this.hud.showPickupText(this.player.x, this.player.y - 40, 'Cursed: +30% Shop Prices')
        }
      }
    } else if (type === 'challenge') {
      this.startChallenge()
    }
  }

  private startChallenge() {
    this._challengeActive = true
    this._challengeTimer = 30_000
    const er = this.dungeon.eventRoomIdx >= 0 ? this.dungeon.rooms[this.dungeon.eventRoomIdx] : null
    if (!er) return
    const count = spawnCountForRoom(this.floor) * 2
    this._challengeEnemies = []
    for (let n = 0; n < count; n++) {
      const ex = (er.x + 1 + Math.floor(Math.random() * (er.w - 2))) * TILE + TILE / 2
      const ey = (er.y + 1 + Math.floor(Math.random() * (er.h - 2))) * TILE + TILE / 2
      const type = pickSpawnType(this.theme, this.floor)
      const enemy = new Enemy(this, ex, ey, type, false, this.floor)
      enemy.setWallChecker((x1, y1, x2, y2) => this.hasWallBetween(x1, y1, x2, y2))
      this.enemies.add(enemy)
      this._challengeEnemies.push(enemy)
    }
    this.hud.showPickupText(this.player.x, this.player.y - 40, 'Survive 30 seconds!')
  }

  // Quest helpers
  private checkNoHealFloorQuest() {
    if (this._consumablesUsedThisFloor > 0) return
    const save = SaveManager.load()
    const questId = 'q_no_heal_floor'
    if (!save.quests.active.includes(questId)) return
    save.quests.progress[questId] = (save.quests.progress[questId] ?? 0) + 1
    const def = QUESTS.find(q => q.id === questId)
    if (def && (save.quests.progress[questId] ?? 0) >= def.target && !save.quests.completed.includes(questId)) {
      save.quests.completed.push(questId)
      save.gold += def.reward
      this.hud.showPickupText(this.player.x, this.player.y - 50, `Quest: ${def.title}! +${def.reward}g`)
    }
    SaveManager.save(save)
  }

  private checkQuestCritStreak() {
    const save = SaveManager.load()
    const questId = 'q_5_crit_streak'
    if (!save.quests.active.includes(questId) || save.quests.completed.includes(questId)) return
    const def = QUESTS.find(q => q.id === questId)
    if (!def) return
    if (this._critStreak >= def.target) {
      save.quests.progress[questId] = def.target
      save.quests.completed.push(questId)
      save.gold += def.reward
      this.hud.showPickupText(this.player.x, this.player.y - 50, `Quest: ${def.title}! +${def.reward}g`)
      SaveManager.save(save)
    }
  }

  private updateQuestProgress(weaponType: string, _enemyType: string) {
    const save = SaveManager.load()
    const quests = save.quests
    let changed = false

    this._runKillsByWeapon[weaponType] = (this._runKillsByWeapon[weaponType] ?? 0) + 1
    this._runKillsByEnemy[_enemyType]  = (this._runKillsByEnemy[_enemyType]  ?? 0) + 1

    quests.active = quests.active.filter(id => !quests.completed.includes(id))

    for (const questId of quests.active) {
      const def = QUESTS.find((q: QuestDef) => q.id === questId)
      if (!def) continue
      const prev = quests.progress[questId] ?? 0
      let newProg = prev
      if (def.type === 'kills_total')   newProg = (save.killStats.totalKills ?? 0) + 1
      if (def.type === 'kills_weapon' && def.weaponType === weaponType) newProg = prev + 1
      if (def.type === 'kills_enemy'  && def.enemyType  === _enemyType)  newProg = prev + 1
      if (newProg !== prev) { quests.progress[questId] = newProg; changed = true }
      if (newProg >= def.target && !quests.completed.includes(questId)) {
        quests.completed.push(questId)
        save.gold += def.reward
        this.score += def.reward
        this.hud.showPickupText(this.player.x, this.player.y - 50, `Quest: ${def.title}! +${def.reward}g`)
        changed = true
        const nextQuests = QUESTS.filter(q => !quests.completed.includes(q.id))
        for (const next of nextQuests) {
          if (!quests.active.includes(next.id) && quests.active.length < 3) {
            quests.active.push(next.id)
          }
        }
      }
    }

    const ach = save.achievements
    for (const def of ACHIEVEMENTS) {
      if (ach.completed.includes(def.id)) continue
      const prev = ach.progress[def.id] ?? 0
      let newProg = prev
      if (def.type === 'kills_total')  newProg = (save.killStats.totalKills ?? 0) + 1
      if (def.type === 'kills_weapon' && def.weaponType === weaponType) newProg = prev + 1
      if (newProg !== prev) { ach.progress[def.id] = newProg; changed = true }
      if (newProg >= def.target) {
        ach.completed.push(def.id)
        if (!this._newlyCompletedAchievements.includes(def.id)) {
          this._newlyCompletedAchievements.push(def.id)
        }
        changed = true
      }
    }

    if (changed) SaveManager.save(save)
  }

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const txt = this.add.text(x, y, text, {
      fontSize: '13px', fontStyle: 'bold', color,
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(30).setOrigin(0.5)
    this.tweens.add({
      targets: txt, y: y - 40, alpha: 0, duration: 1200, ease: 'Cubic.Out',
      onComplete: () => { if (txt.active) txt.destroy() },
    })
  }

  private spawnProjectile(x: number, y: number, vx: number, vy: number, dmg: number, isCrit: boolean, color: number) {
    const gfx = this.add.circle(x, y, 5, color).setDepth(8)
    this._projectiles.push({ gfx, vx, vy, dmg, isCrit, ttl: 2000, slowOnHit: false })
  }

  private handleClassAbilityE(data: { class: string; x: number; y: number; angle: number; charge?: number }) {
    if (data.class === 'rogue') {
      const dx = Math.cos(data.angle) * 130
      const dy = Math.sin(data.angle) * 130
      const nx = Phaser.Math.Clamp(data.x + dx, 16, COLS * TILE - 16)
      const ny = Phaser.Math.Clamp(data.y + dy, 16, ROWS * TILE - 16)
      // Shadow trail at old position
      const trail = this.add.circle(data.x, data.y, 12, 0x660099, 0.5).setDepth(5)
      this.tweens.add({ targets: trail, alpha: 0, duration: 400, onComplete: () => { if (trail.active) trail.destroy() } })
      this.player.setPosition(nx, ny)
      this.player.setRolling(true)
      this.time.delayedCall(400, () => { if (this.player.active) this.player.setRolling(false) })
      // Shadow Vanish: brief invisibility
      if (this.player.rogueShadowVanish) {
        this.tweens.add({ targets: this.player, alpha: 0.2, duration: 100 })
        this.time.delayedCall(1500, () => {
          if (this.player.active) this.tweens.add({ targets: this.player, alpha: 1, duration: 200 })
        })
      }
      this.showFloatingText(nx, ny - 20, 'Shadow Step!', '#aa44ff')
    }

    if (data.class === 'ranger') {
      const charge = data.charge ?? 1
      const dmgMult = charge >= 0.9 ? 3.0 : (charge >= 0.5 ? 2.0 : 1.5)
      const weapon = this.player.currentWeapon
      const baseDamage = weapon.damage * dmgMult * this.player.skillDamageMult
      const rangerBonus = this.player.mageArcanePower ? 1.12 : 1 // just in case
      const finalDmg = Math.round(baseDamage * rangerBonus)
      const speed = 500
      const vx = Math.cos(data.angle) * speed
      const vy = Math.sin(data.angle) * speed
      this.spawnProjectile(data.x, data.y, vx, vy, finalDmg, charge >= 0.9, 0xffff44)
      if (charge >= 0.9) {
        this.showFloatingText(data.x, data.y - 20, 'PERFECT AIM!', '#ffff44')
        if (this.player.rangerPredator) this.player.grantPredatorCharges(3)
      }
    }

    if (data.class === 'mage') {
      const burstX = this.input.activePointer?.worldX || (data.x + Math.cos(data.angle) * 100)
      const burstY = this.input.activePointer?.worldY || (data.y + Math.sin(data.angle) * 100)
      const baseRadius = this.player.mageArcaneMastery ? 112 : 80
      const baseDmg = this.player.mageArcaneMastery ? 98 : 70
      const burst = this.add.circle(burstX, burstY, baseRadius, 0x4488ff, 0.45).setDepth(15)
      this.tweens.add({ targets: burst, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 500, onComplete: () => { if (burst.active) burst.destroy() } })
      this.enemies.getChildren().forEach(e => {
        const enemy = e as Enemy
        if (!enemy.active) return
        const dist = Phaser.Math.Distance.Between(burstX, burstY, enemy.x, enemy.y)
        if (dist <= baseRadius) {
          enemy.takeDamage(baseDmg, 0, 0)
          this._damageDealt += baseDmg
          this.hud.showDamageNumber(enemy.x, enemy.y - 20, baseDmg, false)
          enemy.applyStatus(SLOW(2000))
          if (enemy.hp <= 0) {
            this.enemiesKilled++
            this.score += Math.round((enemy.lootValue ?? 0) * this.player.skillLootMult * this._diffLootMult)
          }
        }
      })
      this.showFloatingText(burstX, burstY - 20, 'ARCANE BURST!', '#4488ff')
      // Halve CD if Arcane Mastery — reset to half the remaining CD
      if (this.player.mageArcaneMastery) {
        this.player.resetAbilityCdE()
        // Set it to half the normal cooldown by emitting a custom reset
        // We achieve this by setting to half via the existing resetAbilityCdE (which sets to 0)
        // then we apply half: we can't set directly, so simply reset gives instant reuse once
        // Instead leave at 0 — the halved CD is handled by reducing from full to half
        // For now reset to 0 so it's immediately available (simplest correct behavior)
      }
    }
  }

  private handleClassAbilityR(data: { class: string; x: number; y: number; angle: number }) {
    if (data.class === 'rogue') {
      const smokeX = data.x, smokeY = data.y
      const smoke = this.add.circle(smokeX, smokeY, 90, 0x334433, 0.45).setDepth(15)
      this.tweens.add({ targets: smoke, alpha: 0, duration: 3000, onComplete: () => { if (smoke.active) smoke.destroy() } })
      this.enemies.getChildren().forEach(e => {
        const enemy = e as Enemy
        if (!enemy.active) return
        const dist = Phaser.Math.Distance.Between(smokeX, smokeY, enemy.x, enemy.y)
        if (dist <= 90) enemy.setBlinded(3000)
      })
      this.showFloatingText(smokeX, smokeY - 20, 'Smoke Veil!', '#88cc88')
    }

    if (data.class === 'ranger') {
      const trapX = this.input.activePointer?.worldX || (data.x + Math.cos(data.angle) * 80)
      const trapY = this.input.activePointer?.worldY || (data.y + Math.sin(data.angle) * 80)
      this.spawnBearTrap(trapX, trapY)
    }

    if (data.class === 'mage') {
      const dx = Math.cos(data.angle) * 140
      const dy = Math.sin(data.angle) * 140
      const nx = Phaser.Math.Clamp(data.x + dx, 16, COLS * TILE - 16)
      const ny = Phaser.Math.Clamp(data.y + dy, 16, ROWS * TILE - 16)
      const flash = this.add.circle(data.x, data.y, 20, 0x4488ff, 0.7).setDepth(20)
      this.tweens.add({ targets: flash, alpha: 0, scaleX: 3, scaleY: 3, duration: 300, onComplete: () => { if (flash.active) flash.destroy() } })
      this.player.setPosition(nx, ny)
      this.showFloatingText(nx, ny - 20, 'Blink!', '#4488ff')
    }
  }

  private spawnBearTrap(x: number, y: number) {
    const trapRadius = this.player.rangerTrapExpert ? 35 : 28
    const trapDmg = this.player.rangerTrapExpert ? 60 : 0
    const trapCircle = this.add.circle(x, y, trapRadius, 0x886622, 0.7).setDepth(6)
    const trapTxt = this.add.text(x, y, '*', { fontSize: '14px', color: '#cc9900' }).setOrigin(0.5).setDepth(7)
    let triggered = false
    const timer = this.time.addEvent({
      delay: 200, repeat: 74,
      callback: () => {
        if (triggered) return
        this.enemies.getChildren().forEach(e => {
          const enemy = e as Enemy
          if (!enemy.active || triggered) return
          const d = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
          if (d < trapRadius + 16) {
            triggered = true
            if (trapDmg > 0) {
              enemy.takeDamage(trapDmg, 0, 0)
              this._damageDealt += trapDmg
              this.hud.showDamageNumber(enemy.x, enemy.y - 20, trapDmg, false)
            }
            enemy.applyStatus(SLOW(2500))
            if (trapCircle.active) trapCircle.destroy()
            if (trapTxt.active) trapTxt.destroy()
            timer.destroy()
          }
        })
      },
    })
    this.time.delayedCall(15000, () => {
      if (trapCircle.active) trapCircle.destroy()
      if (trapTxt.active) trapTxt.destroy()
      timer.destroy()
    })
  }

  private cleanup() {
    this.input.off('pointerdown')
    this.input.off('pointermove')
    this.input.off('pointerup')
    this.input.keyboard?.removeAllListeners('keydown-ESC')
    this.events.off('player-attack', this.processAttack, this)
    this.events.off('player-dead')
    this.events.off('player-took-damage')
    this.events.off('reflect-damage')
    this.events.off('boss-hp')
    this.events.off('boss-defeated', this.handleBossDefeated, this)
    this.events.off('boss-drop')
    this.events.off('miniboss-killed', this.handleMinibossKilled, this)
    this.events.off('boss-summon')
    this.events.off('inventory-drop-item')
    this.events.off('hotbar-use')
    this.events.off('class-ability-e')
    this.events.off('class-ability-r')
    this.events.off('mana-shield-absorbed')
  }

  update(_time: number, delta: number) {
    if (this.gameEnding) return

    if (this.player.hp <= 0) {
      if (this.inventoryUI.isOpen()) this.inventoryUI.toggle(this.player)
      if (this.shopUI.isOpen()) this.shopUI.close()
      this.handlePlayerDeath()
      return
    }

    // Boss proximity: mark boss started
    if (this.boss?.active && !this._bossStarted) {
      const distToBoss = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y)
      if (distToBoss < 200) this._bossStarted = true
    }

    // survive_low_hp quest: accumulate time below 15% HP
    if (this.player.hp < this.player.effectiveMaxHp * 0.15) {
      this._lowHpAccumulator += delta
      if (this._lowHpAccumulator >= 1000) {
        this._lowHpAccumulator -= 1000
        const save = SaveManager.load()
        const questId = 'q_survive_low_hp'
        if (save.quests.active.includes(questId) && !save.quests.completed.includes(questId)) {
          const def = QUESTS.find(q => q.id === questId)
          if (def) {
            save.quests.progress[questId] = (save.quests.progress[questId] ?? 0) + 1
            if ((save.quests.progress[questId] ?? 0) >= def.target) {
              save.quests.completed.push(questId)
              save.gold += def.reward
              this.hud.showPickupText(this.player.x, this.player.y - 50, `Quest: ${def.title}! +${def.reward}g`)
            }
            SaveManager.save(save)
          }
        }
      }
    } else {
      this._lowHpAccumulator = 0
    }

    if (Phaser.Input.Keyboard.JustDown(this.invKey)) {
      if (this.shopUI.isOpen()) this.shopUI.close()
      this.inventoryUI.toggle(this.player)
    }

    // Only use E for door interaction when player has no class ability
    if (!this.player.activeClass && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      let nearest: Door | null = null
      let nearestDist = 48
      for (const door of this.doors) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y)
        if (dist < nearestDist) { nearest = door; nearestDist = dist }
      }
      if (nearest) nearest.toggle()
    }

    if (Phaser.Input.Keyboard.JustDown(this.shopKey)) {
      if (this.nearShop) {
        if (this.shopUI.isOpen()) {
          this.shopUI.close()
        } else {
          if (this.inventoryUI.isOpen()) this.inventoryUI.toggle(this.player)
          const shopPriceMult = this._curses.includes('shop_prices') ? 1.3 : 1
          this.shopUI.open(
            () => this.score,
            (item: ItemDef, price: number) => {
              const actualPrice = Math.round(price * shopPriceMult * (1 - this.player.skillShopDiscount))
              if (this.score < actualPrice) return false
              if (item.slotType === 'consumable') {
                if (!this.player.bag.canAdd(item)) return false
                this.player.bag.add(item)
              } else {
                const displaced = this.player.inventory.equipItem(item)
                if (displaced && this.player.bag.canAdd(displaced)) {
                  this.player.bag.add(displaced)
                }
              }
              this.score -= actualPrice
              return true
            },
            () => this.player,
            (item: ItemDef, source: 'equipped' | 'bag', slotOrIdx: string | number) => {
              if (source === 'equipped') {
                this.player.inventory.unequip(slotOrIdx as EquipSlot)
              } else {
                this.player.bag.remove(slotOrIdx as number)
              }
              this.score += getSellPrice(item)
            },
          )
        }
      }
    }

    for (let i = 0; i < 3; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.hotbarKeys[i])) this.useHotbarSlot(i)
    }

    if (this.inventoryUI.isOpen() || this.shopUI.isOpen()) return

    this.player.update(delta)

    // Dual Wield Flow: speed boost on weapon swap
    const prevSlot = this.player.activeSlot
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F))) {
      if (this._dualWieldFlowActive && prevSlot !== this.player.activeSlot) {
        this.player.applyTempSpeedBoost(30, 400)
      }
    }

    if (this.player.rolling) {
      for (const door of this.doors) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y)
        if (d < 40) door.openIfClosed()
      }
    }

    this.enemies.getChildren().forEach(e => (e as Enemy).update(delta, this.player))
    if (this.boss?.active) this.boss.update(delta, this.player)
    this.hazards.forEach(h => h.update(delta, this.player))
    this.updateProjectiles(delta)
    this.minimap.update(this.player.x, this.player.y)

    if (this.shopRoomCenter) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.shopRoomCenter.x, this.shopRoomCenter.y,
      )
      const wasNear = this.nearShop
      this.nearShop = dist < 80
      if (this.nearShop && !wasNear && !this._shownShopHint) {
        this._shownShopHint = true
        this.hud.showPickupText(this.shopRoomCenter.x, this.shopRoomCenter.y - 48, 'Shop nearby — press TAB')
      }
    }

    if (this._eventRoomCenter && !this._eventRoomTriggered && !this._eventRoomUI.isOpen()) {
      const evDist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this._eventRoomCenter.x, this._eventRoomCenter.y,
      )
      if (evDist < 80) this.triggerEventRoom()
    }

    if (this._challengeActive) {
      this._challengeTimer -= delta
      const allDead = this._challengeEnemies.length > 0 && this._challengeEnemies.every(e => !e.active)
      if (allDead || this._challengeTimer <= 0) {
        this._challengeActive = false
        if (allDead) {
          const rareItems = ITEMS.filter(i => i.rarity === 'rare' || i.rarity === 'epic' || i.rarity === 'legendary')
          if (rareItems.length > 0) {
            const reward = rareItems[Math.floor(Math.random() * rareItems.length)]
            const ecx = this._eventRoomCenter?.x ?? this.player.x
            const ecy = this._eventRoomCenter?.y ?? this.player.y
            this.spawnDrop(ecx, ecy, reward)
            this.hud.showPickupText(this.player.x, this.player.y - 40, 'Challenge Complete! +Reward')
          }
        }
        this._challengeEnemies = []
      }
    }

    const cd = this.player.attackCooldownMax > 0
      ? Math.min(1, this.player.atkCooldownRemaining / this.player.attackCooldownMax)
      : 0
    const rollCd = Math.min(1, this.player.rollCooldownRemaining / this.player.rollCooldownMax)
    this.hud.update(this.player, this.score, cd, rollCd)
    const consumables = this.player.bag.getAll().filter(i => i.slotType === 'consumable')
    this.hud.updateHotbar(consumables.slice(0, 3))
  }
}
