import Phaser from 'phaser'
import type { DungeonData } from '../systems/DungeonGenerator'

const SCALE = 2
const PAD = 4

export class Minimap {
  private gfx: Phaser.GameObjects.Graphics
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

    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(22)
    this.drawBase(mapW, mapH)
  }

  private drawBase(mapW: number, mapH: number) {
    this.gfx.fillStyle(0x000000, 0.6)
    this.gfx.fillRect(this.ox - PAD, this.oy - PAD, mapW + PAD * 2, mapH + PAD * 2)

    for (const room of this.data.rooms) {
      this.gfx.fillStyle(0x334455, 1)
      this.gfx.fillRect(this.ox + room.x * SCALE, this.oy + room.y * SCALE, room.w * SCALE, room.h * SCALE)
    }
  }

  update(playerWorldX: number, playerWorldY: number) {
    const tileSize = 32
    const mapW = this.data.cols * SCALE
    const mapH = this.data.rows * SCALE

    this.gfx.clear()
    this.drawBase(mapW, mapH)

    // Portal dot
    const prx = this.ox + this.portalRoom.cx * SCALE
    const pry = this.oy + this.portalRoom.cy * SCALE
    this.gfx.fillStyle(0x00ffcc, 1)
    this.gfx.fillRect(prx - 2, pry - 2, 4, 4)

    // Player dot
    const px = this.ox + (playerWorldX / tileSize) * SCALE
    const py = this.oy + (playerWorldY / tileSize) * SCALE
    this.gfx.fillStyle(0xffffff, 1)
    this.gfx.fillRect(px - 2, py - 2, 4, 4)
  }
}
