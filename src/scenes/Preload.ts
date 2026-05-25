import Phaser from 'phaser'

const T = 32

interface TileTheme { wallBase: string; wallFace: string; wallLine: string; floorBase: string; floorFace: string; floorDot: string }

const THEMES: Record<string, TileTheme> = {
  dungeon: { wallBase: '#2a2a3e', wallFace: '#3a3a52', wallLine: '#1a1a2a', floorBase: '#1a1008', floorFace: '#261808', floorDot: '#332010' },
  castle:  { wallBase: '#7a7a88', wallFace: '#9a9aaa', wallLine: '#555566', floorBase: '#665544', floorFace: '#7a6655', floorDot: '#887766' },
  caves:   { wallBase: '#0c1018', wallFace: '#141c26', wallLine: '#080c12', floorBase: '#0a1418', floorFace: '#121c22', floorDot: '#1c2830' },
}

export class Preload extends Phaser.Scene {
  constructor() { super('Preload') }

  create() {
    Object.entries(THEMES).forEach(([key, theme]) => this.makeTileset(`tiles_${key}`, theme))
    this.makePlayer()
    this.makeEnemies()
    this.makeLoot()
    this.makePortal()
    this.makeItemIcons()
    this.scene.start('MainMenu')
  }

  private makeTileset(key: string, t: TileTheme) {
    const c = this.textures.createCanvas(key, T * 2, T)!
    const ctx = c.getContext()

    ctx.fillStyle = t.wallBase; ctx.fillRect(0, 0, T, T)
    ctx.fillStyle = t.wallFace; ctx.fillRect(2, 2, T - 4, T - 4)
    ctx.fillStyle = t.wallLine
    ctx.fillRect(4, 0, 1, T); ctx.fillRect(0, T / 2, T, 1); ctx.fillRect(T / 2, 0, 1, T / 2)

    ctx.fillStyle = t.floorBase; ctx.fillRect(T, 0, T, T)
    ctx.fillStyle = t.floorFace; ctx.fillRect(T + 2, 2, T - 4, T - 4)
    ctx.fillStyle = t.floorDot
    ctx.fillRect(T + 6, 6, 4, 4); ctx.fillRect(T + 20, 20, 4, 4)
    ctx.fillRect(T + 14, 14, 2, 2); ctx.fillRect(T + 24, 8, 2, 2)

    c.refresh()
  }

  private makePlayer() {
    const c = this.textures.createCanvas('player', T, T)!
    const ctx = c.getContext()
    ctx.fillStyle = '#112244'; ctx.fillRect(8, 14, 16, 14)
    ctx.fillStyle = '#2244aa'; ctx.fillRect(10, 14, 12, 12)
    ctx.fillStyle = '#334488'; ctx.fillRect(9, 6, 14, 10)
    ctx.fillStyle = '#6633aa'; ctx.fillRect(11, 9, 10, 4)
    ctx.fillStyle = '#ccccdd'; ctx.fillRect(23, 8, 2, 18)
    ctx.fillStyle = '#aaaacc'; ctx.fillRect(20, 15, 8, 2)
    ctx.fillStyle = '#886622'; ctx.fillRect(24, 24, 2, 4)
    ctx.fillStyle = '#1a3366'
    ctx.fillRect(10, 26, 5, 4); ctx.fillRect(17, 26, 5, 4)
    c.refresh()
  }

  private makeEnemies() {
    const cs = this.textures.createCanvas('enemy_skeleton', T, T)!
    const s = cs.getContext()
    s.fillStyle = '#d0ccbb'
    s.fillRect(11, 4, 10, 10); s.fillRect(12, 14, 8, 10)
    s.fillStyle = '#b0aaaa'
    s.fillRect(7, 14, 5, 10); s.fillRect(20, 14, 5, 10)
    s.fillRect(11, 24, 4, 7); s.fillRect(17, 24, 4, 7)
    s.fillStyle = '#ff2222'; s.fillRect(13, 7, 3, 3); s.fillRect(18, 7, 3, 3)
    s.fillStyle = '#1a1a2a'; s.fillRect(13, 12, 6, 2)
    cs.refresh()

    const co = this.textures.createCanvas('enemy_orc', T, T)!
    const o = co.getContext()
    o.fillStyle = '#2d6622'; o.fillRect(7, 4, 18, 14)
    o.fillStyle = '#1e4418'; o.fillRect(5, 18, 22, 14)
    o.fillStyle = '#2d6622'
    o.fillRect(2, 18, 7, 12); o.fillRect(23, 18, 7, 12)
    o.fillRect(7, 32, 8, 4); o.fillRect(17, 32, 8, 4)
    o.fillStyle = '#ff6600'; o.fillRect(10, 8, 5, 4); o.fillRect(17, 8, 5, 4)
    o.fillStyle = '#f0d090'; o.fillRect(11, 16, 3, 5); o.fillRect(18, 16, 3, 5)
    co.refresh()
  }

  private makeLoot() {
    const cc = this.textures.createCanvas('loot_coin', 16, 16)!
    const ctxc = cc.getContext()
    ctxc.fillStyle = '#ffd700'; ctxc.beginPath(); ctxc.arc(8, 8, 6, 0, Math.PI * 2); ctxc.fill()
    ctxc.fillStyle = '#ffaa00'; ctxc.beginPath(); ctxc.arc(8, 8, 4, 0, Math.PI * 2); ctxc.fill()
    ctxc.fillStyle = '#ffee88'; ctxc.fillRect(7, 3, 2, 10); ctxc.fillRect(3, 7, 10, 2)
    cc.refresh()

    const cg = this.textures.createCanvas('loot_gem', 16, 16)!
    const ctxg = cg.getContext()
    ctxg.fillStyle = '#9933cc'
    ctxg.beginPath(); ctxg.moveTo(8, 1); ctxg.lineTo(15, 7); ctxg.lineTo(8, 15); ctxg.lineTo(1, 7); ctxg.closePath(); ctxg.fill()
    ctxg.fillStyle = '#cc66ff'; ctxg.fillRect(6, 3, 4, 5)
    cg.refresh()
  }

  private makePortal() {
    const cp = this.textures.createCanvas('portal', 48, 48)!
    const ctx = cp.getContext()
    const grad = ctx.createRadialGradient(24, 24, 2, 24, 24, 22)
    grad.addColorStop(0, '#aaffee'); grad.addColorStop(0.4, '#00ccaa'); grad.addColorStop(1, 'rgba(0,180,130,0)')
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(24, 24, 22, 0, Math.PI * 2); ctx.fill()
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

  private makeItemIcons() {
    // Weapon (sword)
    const sw = this.textures.createCanvas('icon_weapon', 16, 16)!
    const sx = sw.getContext()
    sx.fillStyle = '#ccccdd'; sx.fillRect(7, 2, 2, 11)
    sx.fillStyle = '#aaaacc'; sx.fillRect(4, 8, 8, 2)
    sx.fillStyle = '#886622'; sx.fillRect(7, 12, 2, 3)
    sw.refresh()

    // Helm
    const ch = this.textures.createCanvas('icon_helm', 16, 16)!
    const hx = ch.getContext()
    hx.fillStyle = '#8899aa'
    hx.beginPath(); hx.arc(8, 9, 6, Math.PI, 0, false); hx.fill()
    hx.fillRect(2, 9, 12, 4)
    ch.refresh()

    // Chest
    const cch = this.textures.createCanvas('icon_chest', 16, 16)!
    const cx = cch.getContext()
    cx.fillStyle = '#667788'; cx.fillRect(2, 3, 12, 11)
    cx.fillStyle = '#445566'; cx.fillRect(7, 3, 2, 11)
    cx.fillStyle = '#aabbcc'; cx.fillRect(5, 7, 6, 2)
    cch.refresh()

    // Legs
    const cl = this.textures.createCanvas('icon_legs', 16, 16)!
    const lx = cl.getContext()
    lx.fillStyle = '#556677'; lx.fillRect(3, 2, 4, 13); lx.fillRect(9, 2, 4, 13)
    cl.refresh()

    // Gloves
    const cgl = this.textures.createCanvas('icon_gloves', 16, 16)!
    const gx = cgl.getContext()
    gx.fillStyle = '#665544'; gx.fillRect(2, 6, 12, 8)
    gx.fillRect(2, 4, 2, 4); gx.fillRect(5, 3, 2, 4); gx.fillRect(8, 3, 2, 4); gx.fillRect(11, 4, 2, 4)
    cgl.refresh()

    // Ring
    const cr = this.textures.createCanvas('icon_ring', 16, 16)!
    const rx = cr.getContext()
    rx.strokeStyle = '#ddaa22'; rx.lineWidth = 2
    rx.beginPath(); rx.arc(8, 9, 5, 0, Math.PI * 2); rx.stroke()
    rx.fillStyle = '#4455cc'; rx.beginPath(); rx.arc(8, 4, 2, 0, Math.PI * 2); rx.fill()
    cr.refresh()

    // Necklace
    const cn = this.textures.createCanvas('icon_necklace', 16, 16)!
    const nx = cn.getContext()
    nx.strokeStyle = '#ddaa22'; nx.lineWidth = 1.5
    nx.beginPath(); nx.arc(8, 5, 5, 0.1, Math.PI - 0.1); nx.stroke()
    nx.fillStyle = '#4444cc'; nx.beginPath(); nx.arc(8, 12, 3, 0, Math.PI * 2); nx.fill()
    cn.refresh()
  }
}
