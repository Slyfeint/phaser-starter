import Phaser from 'phaser'

const T = 32

export class Preload extends Phaser.Scene {
  constructor() { super('Preload') }

  create() {
    this.makeTileset()
    this.makePlayer()
    this.makeEnemies()
    this.makeLoot()
    this.makePortal()
    this.scene.start('MainMenu')
  }

  private makeTileset() {
    // Two tiles side-by-side: index 1 = wall (x=0), index 2 = floor (x=T)
    const c = this.textures.createCanvas('tiles', T * 2, T)!
    const ctx = c.getContext()

    // Wall
    ctx.fillStyle = '#2a2a3e'; ctx.fillRect(0, 0, T, T)
    ctx.fillStyle = '#3a3a52'; ctx.fillRect(2, 2, T - 4, T - 4)
    ctx.fillStyle = '#1a1a2a'
    ctx.fillRect(4, 0, 1, T)
    ctx.fillRect(0, T / 2, T, 1)
    ctx.fillRect(T / 2, 0, 1, T / 2)

    // Floor
    ctx.fillStyle = '#1a1008'; ctx.fillRect(T, 0, T, T)
    ctx.fillStyle = '#261808'; ctx.fillRect(T + 2, 2, T - 4, T - 4)
    ctx.fillStyle = '#332010'
    ctx.fillRect(T + 6, 6, 4, 4)
    ctx.fillRect(T + 20, 20, 4, 4)
    ctx.fillRect(T + 14, 14, 2, 2)
    ctx.fillRect(T + 24, 8, 2, 2)

    c.refresh()
  }

  private makePlayer() {
    const c = this.textures.createCanvas('player', T, T)!
    const ctx = c.getContext()

    ctx.fillStyle = '#112244'; ctx.fillRect(8, 14, 16, 14)    // cloak
    ctx.fillStyle = '#2244aa'; ctx.fillRect(10, 14, 12, 12)   // body
    ctx.fillStyle = '#334488'; ctx.fillRect(9, 6, 14, 10)     // helm
    ctx.fillStyle = '#6633aa'; ctx.fillRect(11, 9, 10, 4)     // visor
    ctx.fillStyle = '#ccccdd'; ctx.fillRect(23, 8, 2, 18)     // sword blade
    ctx.fillStyle = '#aaaacc'; ctx.fillRect(20, 15, 8, 2)     // guard
    ctx.fillStyle = '#886622'; ctx.fillRect(24, 24, 2, 4)     // grip
    ctx.fillStyle = '#1a3366'
    ctx.fillRect(10, 26, 5, 4)   // left boot
    ctx.fillRect(17, 26, 5, 4)   // right boot

    c.refresh()
  }

  private makeEnemies() {
    // Skeleton
    const cs = this.textures.createCanvas('enemy_skeleton', T, T)!
    const s = cs.getContext()
    s.fillStyle = '#d0ccbb'
    s.fillRect(11, 4, 10, 10)    // skull
    s.fillRect(12, 14, 8, 10)   // ribcage
    s.fillStyle = '#b0aaaa'
    s.fillRect(7, 14, 5, 10)    // left arm
    s.fillRect(20, 14, 5, 10)   // right arm
    s.fillRect(11, 24, 4, 7)    // left leg
    s.fillRect(17, 24, 4, 7)    // right leg
    s.fillStyle = '#ff2222'
    s.fillRect(13, 7, 3, 3)     // left eye
    s.fillRect(18, 7, 3, 3)     // right eye
    s.fillStyle = '#1a1a2a'
    s.fillRect(13, 12, 6, 2)    // jaw gap
    cs.refresh()

    // Orc
    const co = this.textures.createCanvas('enemy_orc', T, T)!
    const o = co.getContext()
    o.fillStyle = '#2d6622'; o.fillRect(7, 4, 18, 14)   // head
    o.fillStyle = '#1e4418'; o.fillRect(5, 18, 22, 14)  // body
    o.fillStyle = '#2d6622'
    o.fillRect(2, 18, 7, 12)   // left arm
    o.fillRect(23, 18, 7, 12)  // right arm
    o.fillRect(7, 32, 8, 4)    // left leg
    o.fillRect(17, 32, 8, 4)   // right leg
    o.fillStyle = '#ff6600'
    o.fillRect(10, 8, 5, 4)    // left eye
    o.fillRect(17, 8, 5, 4)    // right eye
    o.fillStyle = '#f0d090'
    o.fillRect(11, 16, 3, 5)   // left tusk
    o.fillRect(18, 16, 3, 5)   // right tusk
    co.refresh()
  }

  private makeLoot() {
    // Coin
    const cc = this.textures.createCanvas('loot_coin', 16, 16)!
    const ctxc = cc.getContext()
    ctxc.fillStyle = '#ffd700'
    ctxc.beginPath(); ctxc.arc(8, 8, 6, 0, Math.PI * 2); ctxc.fill()
    ctxc.fillStyle = '#ffaa00'
    ctxc.beginPath(); ctxc.arc(8, 8, 4, 0, Math.PI * 2); ctxc.fill()
    ctxc.fillStyle = '#ffee88'
    ctxc.fillRect(7, 3, 2, 10)
    ctxc.fillRect(3, 7, 10, 2)
    cc.refresh()

    // Gem
    const cg = this.textures.createCanvas('loot_gem', 16, 16)!
    const ctxg = cg.getContext()
    ctxg.fillStyle = '#9933cc'
    ctxg.beginPath()
    ctxg.moveTo(8, 1); ctxg.lineTo(15, 7)
    ctxg.lineTo(8, 15); ctxg.lineTo(1, 7)
    ctxg.closePath(); ctxg.fill()
    ctxg.fillStyle = '#cc66ff'
    ctxg.fillRect(6, 3, 4, 5)
    cg.refresh()
  }

  private makePortal() {
    const cp = this.textures.createCanvas('portal', 48, 48)!
    const ctx = cp.getContext()

    const grad = ctx.createRadialGradient(24, 24, 2, 24, 24, 22)
    grad.addColorStop(0, '#aaffee')
    grad.addColorStop(0.4, '#00ccaa')
    grad.addColorStop(1, 'rgba(0,180,130,0)')
    ctx.fillStyle = grad
    ctx.beginPath(); ctx.arc(24, 24, 22, 0, Math.PI * 2); ctx.fill()

    ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(24, 24, 18, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(24, 24, 10, 0, Math.PI * 2); ctx.stroke()

    ctx.fillStyle = '#00ffcc'
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.fillRect(24 + Math.cos(a) * 18 - 1, 24 + Math.sin(a) * 18 - 1, 3, 3)
    }
    cp.refresh()
  }
}
