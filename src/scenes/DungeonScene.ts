import Phaser from 'phaser'
import { generateDungeon, TILE_WALL, TILE_FLOOR, type DungeonData } from '../systems/DungeonGenerator'
import { Player } from '../entities/Player'
import { Enemy, type EnemyType } from '../entities/Enemy'
import { Loot, type LootType } from '../entities/Loot'
import { DroppedItem } from '../entities/DroppedItem'
import { HUD } from '../ui/HUD'
import { InventoryUI } from '../ui/InventoryUI'
import { Minimap } from '../ui/Minimap'
import type { ItemDef } from '../systems/ItemDefs'
import { ITEMS } from '../systems/ItemDefs'
import { getKey } from '../systems/KeyBindings'

const TILE = 32
const COLS = 50
const ROWS = 40

export class DungeonScene extends Phaser.Scene {
  private player!: Player
  private enemies!: Phaser.GameObjects.Group
  private lootGroup!: Phaser.Physics.Arcade.StaticGroup
  private droppedItemGroup!: Phaser.Physics.Arcade.StaticGroup
  private portal!: Phaser.GameObjects.Sprite
  private wallLayer!: Phaser.Tilemaps.TilemapLayer
  private hud!: HUD
  private inventoryUI!: InventoryUI
  private minimap!: Minimap
  private invKey!: Phaser.Input.Keyboard.Key
  private score = 0
  private dungeon!: DungeonData
  private gameEnding = false
  private atkCooldownPct = 0

  constructor() { super('DungeonScene') }

  create() {
    this.score = 0
    this.gameEnding = false
    this.atkCooldownPct = 0
    this.dungeon = generateDungeon(COLS, ROWS)

    this.buildMap()
    this.spawnPlayer()
    this.spawnEnemies()
    this.spawnLoot()
    this.spawnPortal()
    this.setupCamera()
    this.setupColliders()
    this.setupInput()

    this.hud = new HUD(this)
    this.inventoryUI = new InventoryUI(this)
    this.minimap = new Minimap(this, this.dungeon, this.dungeon.rooms.length - 1)

    this.events.on('player-attack', this.processAttack, this)
    this.events.once('shutdown', this.cleanup, this)
  }

  private buildMap() {
    const theme = (this.registry.get('mapTheme') as string | undefined) ?? 'dungeon'
    const tilesKey = `tiles_${theme}`
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

    // Starting weapon
    const startSword = ITEMS.find(i => i.id === 'iron_sword')!
    this.player.inventory.equipItem(startSword, 'weapon1')
  }

  private spawnEnemies() {
    this.enemies = this.add.group()
    this.dungeon.rooms.slice(1).forEach((room, i) => {
      const type: EnemyType = i % 3 === 2 ? 'orc' : 'skeleton'
      const count = type === 'orc' ? 1 : 2
      for (let n = 0; n < count; n++) {
        const ex = (room.x + 1 + Math.floor(Math.random() * (room.w - 2))) * TILE + TILE / 2
        const ey = (room.y + 1 + Math.floor(Math.random() * (room.h - 2))) * TILE + TILE / 2
        this.enemies.add(new Enemy(this, ex, ey, type))
      }
    })
  }

  private spawnLoot() {
    this.lootGroup = this.physics.add.staticGroup()
    this.droppedItemGroup = this.physics.add.staticGroup()
    const { rooms, tiles } = this.dungeon
    const startRoom = rooms[0]
    const floor: [number, number][] = []

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (tiles[row][col] !== TILE_FLOOR) continue
        const inStart = col >= startRoom.x && col < startRoom.x + startRoom.w &&
                        row >= startRoom.y && row < startRoom.y + startRoom.h
        if (!inStart) floor.push([col, row])
      }
    }

    Phaser.Utils.Array.Shuffle(floor)
    const count = Math.min(16, Math.floor(floor.length * 0.05))
    for (let i = 0; i < count; i++) {
      const [col, row] = floor[i]
      const type: LootType = Math.random() < 0.2 ? 'gem' : 'coin'
      this.lootGroup.add(new Loot(this, col * TILE + TILE / 2, row * TILE + TILE / 2, type))
    }
  }

  private spawnPortal() {
    const last = this.dungeon.rooms[this.dungeon.rooms.length - 1]
    const px = last.cx * TILE + TILE / 2
    const py = last.cy * TILE + TILE / 2

    this.portal = this.add.sprite(px, py, 'portal').setDepth(3)
    this.physics.add.existing(this.portal, true)
    this.tweens.add({ targets: this.portal, alpha: 0.55, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    this.add.text(px, py - 34, 'EXIT', { fontSize: '10px', color: '#00ffcc' }).setOrigin(0.5).setDepth(4)
  }

  private setupCamera() {
    this.cameras.main.setBounds(0, 0, COLS * TILE, ROWS * TILE).startFollow(this.player, true, 0.1, 0.1).setZoom(1.4)
  }

  private setupColliders() {
    this.physics.add.collider(this.player, this.wallLayer)
    this.physics.add.collider(this.enemies, this.wallLayer)
    this.physics.add.collider(this.enemies, this.enemies)

    this.physics.add.overlap(this.player, this.lootGroup, (_p, loot) => {
      const l = loot as Loot
      const mult = this.player.inventory.getStats().lootMult
      this.score += Math.round(l.value * mult)
      l.destroy()
    })

    this.physics.add.overlap(this.player, this.droppedItemGroup, (_p, dropped) => {
      const d = dropped as DroppedItem
      this.pickupItem(d.itemDef)
      d.destroy()
    })

    this.physics.add.overlap(this.player, this.portal, () => {
      if (!this.gameEnding) this.endGame(true)
    })
  }

  private setupInput() {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x < this.scale.width * 0.65) {
        this.player.startTouchMove(p.id, p.x, p.y)
      } else {
        this.player.triggerAttack()
      }
    })
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.player.updateTouchMove(p.id, p.x, p.y))
    this.input.on('pointerup',   (p: Phaser.Input.Pointer) => this.player.endTouchMove(p.id))

    this.invKey = this.input.keyboard!.addKey(getKey('inventory', 'I'))
  }

  private processAttack() {
    const weapon = this.player.currentWeapon
    const px = this.player.x, py = this.player.y
    const facing = this.player.facingAngle
    const halfArc = Phaser.Math.DegToRad(weapon.arcAngle / 2)

    const gfx = this.add.graphics().setDepth(10)
    gfx.fillStyle(weapon.arcColor, 0.4)
    gfx.slice(px, py, weapon.range, facing - halfArc, facing + halfArc, false)
    gfx.fillPath()
    this.tweens.add({ targets: gfx, alpha: 0, duration: 220, onComplete: () => gfx.destroy() })

    const stats = this.player.inventory.getStats()
    const facingDeg = Phaser.Math.RadToDeg(facing)

    this.enemies.getChildren().forEach(e => {
      const enemy = e as Enemy
      if (!enemy.active) return
      const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y)
      if (dist > weapon.range) return

      const toEnemyDeg = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(px, py, enemy.x, enemy.y))
      const diff = Phaser.Math.Angle.ShortestBetween(facingDeg, toEnemyDeg)
      if (Math.abs(diff) > weapon.arcAngle / 2) return

      const isCrit = Math.random() < stats.critChance
      const dmg = weapon.damage * (isCrit ? 2 : 1)
      const kbAngle = Phaser.Math.Angle.Between(px, py, enemy.x, enemy.y)

      const died = enemy.takeDamage(dmg, kbAngle, weapon.knockback)
      this.hud.showDamageNumber(enemy.x, enemy.y - 20, dmg, isCrit)

      if (died) {
        this.score += Math.round(enemy.lootValue * stats.lootMult)
        const drop = enemy.rollDrop()
        if (drop) this.spawnDrop(enemy.x, enemy.y, drop)
      }
    })
  }

  private spawnDrop(x: number, y: number, item: ItemDef) {
    const dropped = new DroppedItem(this, x, y, item)
    this.droppedItemGroup.add(dropped)
    this.droppedItemGroup.refresh()
  }

  private pickupItem(item: ItemDef) {
    const displaced = this.player.inventory.equipItem(item)
    if (item.bonusMaxHp) {
      const stats = this.player.inventory.getStats()
      this.player.maxHp = 100 + stats.maxHpBonus
      this.player.hp = Math.min(this.player.hp + item.bonusMaxHp, this.player.effectiveMaxHp)
    }
    this.hud.showPickupText(this.player.x, this.player.y - 40, `+ ${item.name}`)
    if (displaced) this.hud.showPickupText(this.player.x, this.player.y - 55, `- ${displaced.name}`)
    this.inventoryUI.refresh(this.player.inventory)
  }

  private cleanup() {
    this.input.off('pointerdown')
    this.input.off('pointermove')
    this.input.off('pointerup')
  }

  private endGame(victory: boolean) {
    this.gameEnding = true
    this.player.setVelocity(0, 0)
    this.time.delayedCall(700, () => this.scene.start('GameOver', { score: this.score, victory }))
  }

  update(_time: number, delta: number) {
    if (this.gameEnding) return

    if (Phaser.Input.Keyboard.JustDown(this.invKey)) {
      this.inventoryUI.toggle(this.player.inventory)
    }

    if (this.inventoryUI.isOpen()) return

    this.player.update(delta)
    this.enemies.getChildren().forEach(e => (e as Enemy).update(delta, this.player))
    this.minimap.update(this.player.x, this.player.y)

    if (this.player.hp <= 0) this.endGame(false)

    this.hud.update(this.player, this.score, this.atkCooldownPct)
  }
}
