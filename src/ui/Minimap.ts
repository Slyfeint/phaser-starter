import Phaser from 'phaser'
import type { DungeonData } from '../systems/DungeonGenerator'

const SCALE = 2
const PAD = 4

export class Minimap {
  private baseGfx: Phaser.GameObjects.Graphics
  private dotGfx: Phaser.GameObjects.Graphics
  private data: DungeonData
  private ox: number
  private oy: number
  private portalRoom: { cx: number; cy: number }

  constructor(scene: Phaser.Scene, data: DungeonData, portalRoomIdx: number) {
    this.data = data
    this.portalRoom = data.rooms[portalRoomIdx]

    const mapW = data.cols * SCALE
    const mapH = data.rows * SCALE
    this.ox = scene.scale.width - mapW - PAD - 10
    this.oy = PAD + 10

    this.baseGfx = scene.add.graphics().setScrollFactor(0).setDepth(22)
    this.dotGfx  = scene.add.graphics().setScrollFactor(0).setDepth(23)
    this.drawBase(mapW, mapH)
  }

  private drawBase(mapW: number, mapH: number) {
    this.baseGfx.fillStyle(0x000000, 0.6)
    this.baseGfx.fillRect(this.ox - PAD, this.oy - PAD, mapW + PAD * 2, mapH + PAD * 2)

    const { rooms, shopRoomIdx, bossRoomIdx, stairsRoomIdx, minibossRoomIdx } = this.data
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i]
      let color = 0x334455
      if (i === 0)                    color = 0x223355
      else if (i === bossRoomIdx)     color = 0x550000
      else if (i === stairsRoomIdx)   color = 0x003355
      else if (i === shopRoomIdx)     color = 0x554400
      else if (i === minibossRoomIdx) color = 0x442200
      this.baseGfx.fillStyle(color, 1)
      this.baseGfx.fillRect(this.ox + room.x * SCALE, this.oy + room.y * SCALE, room.w * SCALE, room.h * SCALE)
    }
  }

  update(playerWorldX: number, playerWorldY: number) {
    const tileSize = 32
    this.dotGfx.clear()

    // Portal dot
    const prx = this.ox + this.portalRoom.cx * SCALE
    const pry = this.oy + this.portalRoom.cy * SCALE
    this.dotGfx.fillStyle(0x00ffcc, 1)
    this.dotGfx.fillRect(prx - 2, pry - 2, 4, 4)

    // Player dot
    const px = this.ox + (playerWorldX / tileSize) * SCALE
    const py = this.oy + (playerWorldY / tileSize) * SCALE
    this.dotGfx.fillStyle(0xffffff, 1)
    this.dotGfx.fillRect(px - 2, py - 2, 4, 4)
  }
}
