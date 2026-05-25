import Phaser from 'phaser'
import { generateDungeon, TILE_WALL, TILE_FLOOR, type DungeonData } from '../systems/DungeonGenerator'
import { Player } from '../entities/Player'
import { Enemy, type EnemyType } from '../entities/Enemy'
import { Loot, type LootType } from '../entities/Loot'
import { HUD } from '../ui/HUD'

const TILE = 32
const COLS = 50
const ROWS = 40

export class DungeonScene extends Phaser.Scene {
  private player!: Player
  private enemies!: Phaser.GameObjects.Group
  private lootGroup!: Phaser.Physics.Arcade.StaticGroup
  private portal!: Phaser.GameObjects.Sprite
  private wallLayer!: Phaser.Tilemaps.TilemapLayer
  private hud!: HUD
  private score = 0
  private dungeon!: DungeonData
  private gameEnding = false

  constructor() { super('DungeonScene') }

  create() {
    this.score = 0
    this.gameEnding = false
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

    this.events.on('player-attack', this.processAttack, this)
    this.events.once('shutdown', this.cleanup, this)
  }

  private buildMap() {
    const map = this.make.tilemap({ data: this.dungeon.tiles, tileWidth: TILE, tileHeight: TILE })
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!
    this.wallLayer = map.createLayer(0, tileset, 0, 0)!
    this.wallLayer.setCollision([TILE_WALL]).setDepth(0)
    this.physics.world.setBounds(0, 0, COLS * TILE, ROWS * TILE)
  }

  private spawnPlayer() {
    const r = this.dungeon.rooms[0]
    this.player = new Player(this, r.cx * TILE + TILE / 2, r.cy * TILE + TILE / 2)
    this.player.setupInput(this)
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
      const loot = new Loot(this, col * TILE + TILE / 2, row * TILE + TILE / 2, type)
      this.lootGroup.add(loot)
    }
  }

  private spawnPortal() {
    const last = this.dungeon.rooms[this.dungeon.rooms.length - 1]
    const px = last.cx * TILE + TILE / 2
    const py = last.cy * TILE + TILE / 2

    this.portal = this.add.sprite(px, py, 'portal').setDepth(3)
    this.physics.add.existing(this.portal, true)
    this.tweens.add({
      targets: this.portal, alpha: 0.55,
      duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    })

    // Label so the player knows what it is
    this.add.text(px, py - 34, 'EXIT', { fontSize: '10px', color: '#00ffcc' })
      .setOrigin(0.5).setDepth(4)
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

    this.physics.add.overlap(this.player, this.lootGroup, (_p, loot) => {
      const l = loot as Loot
      this.score += l.value
      l.destroy()
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
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.player.updateTouchMove(p.id, p.x, p.y)
    })
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      this.player.endTouchMove(p.id)
    })
  }

  private processAttack() {
    // Show swing arc
    const facing = this.player.flipX ? -1 : 1
    const gfx = this.add.graphics().setDepth(10)
    gfx.fillStyle(0xffffaa, 0.45)
    gfx.fillCircle(this.player.x + facing * 30, this.player.y, this.player.attackRange * 0.6)
    this.tweens.add({ targets: gfx, alpha: 0, duration: 180, onComplete: () => gfx.destroy() })

    // Deal damage to enemies in range
    this.enemies.getChildren().forEach(e => {
      const enemy = e as Enemy
      if (!enemy.active) return
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y)
      if (dist < this.player.attackRange) {
        const died = enemy.takeDamage(this.player.attackDamage)
        if (died) this.score += enemy.lootValue
      }
    })
  }

  private cleanup() {
    this.input.off('pointerdown')
    this.input.off('pointermove')
    this.input.off('pointerup')
  }

  private endGame(victory: boolean) {
    this.gameEnding = true
    this.player.setVelocity(0, 0)
    this.time.delayedCall(700, () => {
      this.scene.start('GameOver', { score: this.score, victory })
    })
  }

  update(_time: number, delta: number) {
    if (this.gameEnding) return

    this.player.update(delta)
    this.enemies.getChildren().forEach(e => (e as Enemy).update(delta, this.player))

    if (this.player.hp <= 0) this.endGame(false)

    this.hud.update(this.player.hp / this.player.maxHp, this.score)
  }
}
