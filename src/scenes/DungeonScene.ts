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
import { ITEMS } from '../systems/ItemDefs'
import type { ItemDef } from '../systems/ItemDefs'
import { getKey } from '../systems/KeyBindings'

const TILE = 32
const COLS = 50
const ROWS = 40

interface RunState {
  hp: number
  score: number
  equippedGear: Record<string, ItemDef>
  bag: ItemDef[]
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
  private score = 0
  private dungeon!: DungeonData
  private gameEnding = false
  private theme!: DungeonTheme
  private floor = 1
  private nearShop = false
  private shopRoomCenter?: Phaser.Math.Vector2

  constructor() { super('DungeonScene') }

  create() {
    this.score = 0
    this.gameEnding = false
    this.hazards = []
    this.doors = []
    this.droppedItemRejectUntil = new Map()
    this.boss = undefined
    this.portal = undefined
    this.stairsSprite = undefined
    this.nearShop = false

    this.theme = ((this.registry.get('mapTheme') as string) ?? 'dungeon') as DungeonTheme
    this.floor = (this.registry.get('currentFloor') as number) ?? 1
    const isBossFloor = this.floor === 3

    this.dungeon = generateDungeon(COLS, ROWS, this.floor, isBossFloor)

    this.buildMap()
    this.spawnPlayer()
    this.spawnEnemies()
    this.spawnHazards()
    this.spawnShop()
    this.spawnDoors()
    this.spawnTorches()
    if (this.floor < 3) this.spawnStairs()
    this.spawnLoot()
    this.setupCamera()
    this.setupColliders()
    this.setupInput()

    this.hud = new HUD(this)
    this.hud.setFloor(this.floor, this.theme)
    this.inventoryUI = new InventoryUI(this)
    this.shopUI = new ShopUI(this)
    const miniRoomIdx = this.floor === 3 ? this.dungeon.bossRoomIdx : this.dungeon.stairsRoomIdx
    this.minimap = new Minimap(this, this.dungeon, miniRoomIdx)

    this.events.on('player-attack', this.processAttack, this)
    this.events.on('player-dead', () => { if (!this.gameEnding) this.endGame(false) })
    this.events.on('boss-spawned', (name: string) => this.hud.showBossBar(name))
    this.events.on('boss-hp', (pct: number) => this.hud.updateBossBar(pct))
    this.events.on('boss-defeated', this.handleBossDefeated, this)
    this.events.on('boss-drop', (item: ItemDef, x: number, y: number) => this.spawnDrop(x, y, item))
    this.events.on('miniboss-killed', this.handleMinibossKilled, this)
    this.events.once('shutdown', this.cleanup, this)
  }

  private buildMap() {
    const tilesKey = `tiles_${this.theme}`
    const map = this.make.tilemap({ data: this.dungeon.tiles, tileWidth: TILE, tileHeight: TILE })
    const tileset = map.addTilesetImage(tilesKey, tilesKey, TILE, TILE, 0, 0)!
    this.wallLayer = map.createLayer(0, tileset, 0, 0)!
    this.wallLayer.setCollision([TILE_WALL]).setDepth(0)
    this.physics.world.setBounds(0, 0, COLS * TILE, ROWS * TILE)
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
    } else {
      const save = SaveManager.load()
      this.player.inventory.deserialize(save.equippedGear as Record<string, ItemDef>)
      this.player.bag.deserialize(save.bag)
    }

    // Apply cosmetic tint
    const save = SaveManager.load()
    const cosmetic = COSMETICS.find(c => c.id === save.activeCosmetic) ?? COSMETICS[0]
    this.player.setCosmeticTint(cosmetic.tint)

    // Ensure at least one weapon
    if (!this.player.inventory.get('weapon1') && !this.player.inventory.get('weapon2')) {
      const startSword = ITEMS.find(i => i.id === 'iron_sword')!
      this.player.inventory.equipItem(startSword, 'weapon1')
    }
  }

  private spawnEnemies() {
    this.enemies = this.add.group()
    const { rooms, bossRoomIdx, stairsRoomIdx, shopRoomIdx, minibossRoomIdx } = this.dungeon
    const skipRooms = new Set([0, bossRoomIdx, stairsRoomIdx, shopRoomIdx])

    rooms.forEach((room, idx) => {
      if (skipRooms.has(idx)) return

      if (idx === minibossRoomIdx && this.floor < 3) {
        const type = pickSpawnType(this.theme, this.floor)
        const mb = new Enemy(this, room.cx * TILE + TILE / 2, room.cy * TILE + TILE / 2, type, true, this.floor)
        mb.setWallChecker((x1, y1, x2, y2) => this.hasWallBetween(x1, y1, x2, y2))
        this.enemies.add(mb)
        return
      }

      const count = spawnCountForRoom(this.floor)
      for (let n = 0; n < count; n++) {
        const ex = (room.x + 1 + Math.floor(Math.random() * (room.w - 2))) * TILE + TILE / 2
        const ey = (room.y + 1 + Math.floor(Math.random() * (room.h - 2))) * TILE + TILE / 2
        const type = pickSpawnType(this.theme, this.floor)
        const enemy = new Enemy(this, ex, ey, type, false, this.floor)
        enemy.setWallChecker((x1, y1, x2, y2) => this.hasWallBetween(x1, y1, x2, y2))
        this.enemies.add(enemy)
      }
    })

    if (this.floor === 3) {
      const bossRoom = rooms[bossRoomIdx]
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
    this.add.text(sx, sy - 20, '[ SHOP ]', { fontSize: '10px', color: '#ffd700' }).setOrigin(0.5).setDepth(5)
    this.add.text(sx, sy - 10, 'Press TAB', { fontSize: '7px', color: '#665500' }).setOrigin(0.5).setDepth(5)
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
    this.add.text(sx, sy - 22, this.floor < 3 ? 'NEXT\nFLOOR' : 'EXIT', {
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
      .setZoom(1.4)
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
      this.score += Math.round(l.value * this.player.inventory.getStats().lootMult)
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
    const halfArc = Phaser.Math.DegToRad(weapon.arcAngle / 2)

    const gfx = this.add.graphics().setDepth(10)
    gfx.fillStyle(weapon.arcColor, 0.4)
    gfx.slice(px, py, weapon.range, facing - halfArc, facing + halfArc, false)
    gfx.fillPath()
    this.tweens.add({ targets: gfx, alpha: 0, duration: 220, onComplete: () => gfx.destroy() })

    const stats = this.player.inventory.getStats()
    const facingDeg = Phaser.Math.RadToDeg(facing)

    const hitEnemy = (obj: { x: number; y: number; active: boolean; takeDamage: (d: number, a: number, f: number) => boolean; lootValue?: number; rollDrop?: () => ItemDef | null }) => {
      if (!obj.active) return
      const dist = Phaser.Math.Distance.Between(px, py, obj.x, obj.y)
      if (dist > weapon.range) return
      const toEDeg = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(px, py, obj.x, obj.y))
      if (Math.abs(Phaser.Math.Angle.ShortestBetween(facingDeg, toEDeg)) > weapon.arcAngle / 2) return
      if (this.hasWallBetween(px, py, obj.x, obj.y)) return

      const isCrit = Math.random() < stats.critChance
      const dmg = weapon.damage * (isCrit ? 2 : 1)
      const kbAngle = Phaser.Math.Angle.Between(px, py, obj.x, obj.y)
      const died = obj.takeDamage(dmg, kbAngle, weapon.knockback)
      this.hud.showDamageNumber(obj.x, obj.y - 20, dmg, isCrit)

      if (died) {
        this.score += Math.round((obj.lootValue ?? 0) * stats.lootMult)
        const drop = obj.rollDrop?.()
        if (drop) this.spawnDrop(obj.x, obj.y, drop)
      }
    }

    this.enemies.getChildren().forEach(e => hitEnemy(e as Enemy))
    if (this.boss?.active) hitEnemy(this.boss)
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
    this.spawnPortal(room.cx * TILE + TILE / 2, room.cy * TILE + TILE / 2)
    this.cameras.main.flash(500, 255, 200, 0)
    const txt = this.add.text(room.cx * TILE + TILE / 2, room.cy * TILE - 60, 'BOSS DEFEATED!',
      { fontSize: '18px', fontStyle: 'bold', color: '#ffcc00' }).setOrigin(0.5).setDepth(20)
    this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 2200, onComplete: () => txt.destroy() })
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
    this.gameEnding = true
    this.physics.world.pause()
    this.time.removeAllEvents()
    this.tweens.killAll()
    const runState: RunState = {
      hp: this.player.hp,
      score: this.score,
      equippedGear: this.player.inventory.serialize(),
      bag: this.player.bag.serialize(),
    }
    this.registry.set('runState', runState)
    this.registry.set('currentFloor', this.floor + 1)
    this.player.setVelocity(0, 0)
    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart())
  }

  private endGame(victory: boolean) {
    if (this.gameEnding) return
    this.gameEnding = true
    this.player.setVelocity(0, 0)
    this.physics.world.pause()
    this.time.removeAllEvents()   // cancel every pending timer callback
    this.tweens.killAll()          // kill every tween; onComplete is NOT called

    const save = SaveManager.load()
    if (victory) {
      save.gold += this.score
      save.equippedGear = this.player.inventory.serialize() as typeof save.equippedGear
      save.bag = this.player.bag.serialize()
      save.stats.totalGold += this.score
      save.stats.runsCompleted += 1
      const prog = save.progress[this.theme]
      if (this.floor > prog.highestFloor) prog.highestFloor = this.floor
      if (this.floor === 3) prog.bossDefeated = true
    } else {
      save.gold += Math.floor(this.score * 0.25)
      save.bag = []
      save.stats.runsCompleted += 1
    }
    SaveManager.save(save)
    this.registry.remove('runState')
    this.registry.set('currentFloor', 1)

    const { score, floor, theme } = this
    this.cameras.main.fadeOut(700, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameOver', { score, victory, floor, theme })
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

  private spawnDoors() {
    this.doorGroup = this.add.group()
    this.dungeon.doors.forEach(d => {
      const door = new Door(this, d.x * TILE + TILE / 2, d.y * TILE + TILE / 2)
      this.doors.push(door)
      this.doorGroup.add(door)
    })
  }

  private spawnTorches() {
    const tintMap: Record<DungeonTheme, number> = { dungeon: 0xff6600, castle: 0xffcc00, caves: 0x00aacc }
    const tint = tintMap[this.theme]
    this.dungeon.rooms.forEach(room => {
      [[room.x + 1, room.y + 1], [room.x + room.w - 2, room.y + 1]].forEach(([col, row]) => {
        const torch = this.add.sprite(col * TILE + TILE / 2, row * TILE + TILE / 2, 'torch').setDepth(1).setTint(tint)
        this.tweens.add({ targets: torch, alpha: 0.55, duration: 550 + Math.random() * 200, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      })
    })
  }

  private cleanup() {
    this.input.off('pointerdown')
    this.input.off('pointermove')
    this.input.off('pointerup')
  }

  update(_time: number, delta: number) {
    if (this.gameEnding) return

    // Check death before UI guards — enemy delayedCalls fire even while inventory/shop is open
    if (this.player.hp <= 0) {
      if (this.inventoryUI.isOpen()) this.inventoryUI.toggle(this.player)
      if (this.shopUI.isOpen()) this.shopUI.close()
      this.endGame(false)
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.invKey)) {
      if (this.shopUI.isOpen()) this.shopUI.close()
      this.inventoryUI.toggle(this.player)
    }

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
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
          this.shopUI.open(
            () => this.score,
            (item: ItemDef, price: number) => {
              if (this.score < price) return false
              if (item.slotType === 'consumable') {
                if (!this.player.bag.canAdd(item)) return false
                this.player.bag.add(item)
              } else {
                const displaced = this.player.inventory.equipItem(item)
                if (displaced && this.player.bag.canAdd(displaced)) {
                  this.player.bag.add(displaced)
                }
              }
              this.score -= price
              return true
            },
          )
        }
      }
    }

    if (this.inventoryUI.isOpen() || this.shopUI.isOpen()) return

    this.player.update(delta)
    this.enemies.getChildren().forEach(e => (e as Enemy).update(delta, this.player))
    if (this.boss?.active) this.boss.update(delta, this.player)
    this.hazards.forEach(h => h.update(delta, this.player))
    this.minimap.update(this.player.x, this.player.y)

    // Proximity check for shop
    if (this.shopRoomCenter) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.shopRoomCenter.x, this.shopRoomCenter.y,
      )
      this.nearShop = dist < 80
    }

    const cd = this.player.attackCooldownMax > 0
      ? Math.min(1, this.player.atkCooldownRemaining / this.player.attackCooldownMax)
      : 0
    this.hud.update(this.player, this.score, cd)
  }
}
