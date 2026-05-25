import Phaser from 'phaser'

const T = 32

interface TileTheme {
  wallBase: string; wallFace: string; wallLine: string
  floorBase: string; floorFace: string; floorDot: string
}

const THEMES: Record<string, TileTheme> = {
  dungeon: { wallBase:'#2a2a3e', wallFace:'#3a3a52', wallLine:'#1a1a2a', floorBase:'#1a1008', floorFace:'#261808', floorDot:'#332010' },
  castle:  { wallBase:'#7a7a88', wallFace:'#9a9aaa', wallLine:'#555566', floorBase:'#665544', floorFace:'#7a6655', floorDot:'#887766' },
  caves:   { wallBase:'#0c1018', wallFace:'#141c26', wallLine:'#080c12', floorBase:'#0a1418', floorFace:'#121c22', floorDot:'#1c2830' },
}

export class Preload extends Phaser.Scene {
  constructor() { super('Preload') }

  create() {
    Object.entries(THEMES).forEach(([key, theme]) => this.makeTileset(`tiles_${key}`, theme))
    this.makePlayer()
    this.makeEnemies()
    this.makeBosses()
    this.makeHazards()
    this.makeLoot()
    this.makePortal()
    this.makeStairs()
    this.makeShopIcon()
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
    // Skeleton
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

    // Orc
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

    // Bat
    const cb = this.textures.createCanvas('enemy_bat', T, T)!
    const b = cb.getContext()
    b.fillStyle = '#331122'
    b.fillRect(6, 14, 6, 8); b.fillRect(20, 14, 6, 8); b.fillRect(12, 12, 8, 12)
    b.fillStyle = '#220e18'
    b.fillRect(2, 10, 8, 6); b.fillRect(22, 10, 8, 6)
    b.fillRect(4, 6, 4, 6); b.fillRect(24, 6, 4, 6)
    b.fillStyle = '#ff4466'; b.fillRect(13, 14, 3, 3); b.fillRect(18, 14, 3, 3)
    b.fillStyle = '#ffaacc'; b.fillRect(14, 21, 2, 3); b.fillRect(18, 21, 2, 3)
    cb.refresh()

    // Spider
    const csp = this.textures.createCanvas('enemy_spider', T, T)!
    const sp = csp.getContext()
    sp.fillStyle = '#1a0808'
    sp.fillRect(10, 10, 12, 12)
    sp.fillStyle = '#331111'
    sp.fillRect(4, 12, 8, 4); sp.fillRect(20, 12, 8, 4)
    sp.fillRect(6, 8, 6, 4);  sp.fillRect(20, 8, 6, 4)
    sp.fillRect(4, 18, 8, 4); sp.fillRect(20, 18, 8, 4)
    sp.fillStyle = '#ff2200'; sp.fillRect(12, 12, 3, 3); sp.fillRect(17, 12, 3, 3)
    sp.fillStyle = '#550000'; sp.fillRect(13, 17, 6, 3)
    csp.refresh()

    // Guard
    const cg = this.textures.createCanvas('enemy_guard', T, T)!
    const g = cg.getContext()
    g.fillStyle = '#778899'; g.fillRect(8, 4, 16, 12)
    g.fillStyle = '#99aabb'; g.fillRect(10, 6, 12, 8)
    g.fillStyle = '#667788'; g.fillRect(6, 16, 20, 16)
    g.fillStyle = '#778899'
    g.fillRect(3, 16, 6, 12); g.fillRect(23, 16, 6, 12)
    g.fillRect(8, 28, 7, 5);  g.fillRect(17, 28, 7, 5)
    g.fillStyle = '#ff4422'; g.fillRect(11, 9, 4, 4); g.fillRect(17, 9, 4, 4)
    g.fillStyle = '#aabbcc'; g.fillRect(25, 12, 3, 14)
    cg.refresh()

    // Knight
    const ck = this.textures.createCanvas('enemy_knight', T, T)!
    const k = ck.getContext()
    k.fillStyle = '#556677'; k.fillRect(6, 2, 20, 14)
    k.fillStyle = '#88aabb'; k.fillRect(8, 4, 16, 10)
    k.fillStyle = '#445566'; k.fillRect(4, 16, 24, 18)
    k.fillStyle = '#556677'
    k.fillRect(1, 16, 6, 14); k.fillRect(25, 16, 6, 14)
    k.fillRect(6, 30, 8, 5);  k.fillRect(18, 30, 8, 5)
    k.fillStyle = '#ee3311'; k.fillRect(10, 7, 5, 5); k.fillRect(17, 7, 5, 5)
    k.fillStyle = '#ccddee'; k.fillRect(0, 14, 3, 18); k.fillRect(29, 14, 3, 18)
    k.fillStyle = '#667788'; k.fillRect(28, 10, 4, 20)
    ck.refresh()

    // Dark mage
    const cm = this.textures.createCanvas('enemy_dark_mage', T, T)!
    const m = cm.getContext()
    m.fillStyle = '#220033'; m.fillRect(9, 4, 14, 12)
    m.fillStyle = '#330055'; m.fillRect(7, 16, 18, 16)
    m.fillStyle = '#440066'
    m.fillRect(4, 16, 6, 12); m.fillRect(22, 16, 6, 12)
    m.fillRect(8, 30, 6, 5); m.fillRect(18, 30, 6, 5)
    m.fillStyle = '#aa22ff'; m.fillRect(11, 7, 4, 4); m.fillRect(17, 7, 4, 4)
    m.fillStyle = '#8800dd'; m.fillRect(13, 14, 6, 2)
    m.fillStyle = '#ff00ff'; m.fillRect(22, 18, 2, 8)
    cm.refresh()

    // Cave troll
    const ct = this.textures.createCanvas('enemy_cave_troll', T, T)!
    const t2 = ct.getContext()
    t2.fillStyle = '#556644'; t2.fillRect(4, 2, 24, 16)
    t2.fillStyle = '#667755'; t2.fillRect(6, 4, 20, 12)
    t2.fillStyle = '#445533'; t2.fillRect(2, 18, 28, 16)
    t2.fillStyle = '#556644'
    t2.fillRect(0, 18, 6, 14); t2.fillRect(26, 18, 6, 14)
    t2.fillRect(4, 30, 10, 4); t2.fillRect(18, 30, 10, 4)
    t2.fillStyle = '#ff4400'; t2.fillRect(9, 7, 6, 6); t2.fillRect(17, 7, 6, 6)
    t2.fillStyle = '#cccc88'; t2.fillRect(10, 14, 4, 6); t2.fillRect(18, 14, 4, 6)
    ct.refresh()
  }

  private makeBosses() {
    // Dungeon Master (48×48)
    const dm = this.textures.createCanvas('boss_dungeon_master', 48, 48)!
    const d = dm.getContext()
    d.fillStyle = '#1a0a2a'; d.fillRect(6, 4, 36, 20)
    d.fillStyle = '#3a1a5a'; d.fillRect(10, 6, 28, 16)
    d.fillStyle = '#220040'; d.fillRect(4, 24, 40, 24)
    d.fillStyle = '#1a0a2a'
    d.fillRect(0, 24, 6, 20); d.fillRect(42, 24, 6, 20)
    d.fillRect(6, 44, 12, 6); d.fillRect(30, 44, 12, 6)
    d.fillStyle = '#cc00ff'; d.fillRect(14, 10, 8, 8); d.fillRect(26, 10, 8, 8)
    d.fillStyle = '#ff88ff'; d.fillRect(16, 12, 4, 4); d.fillRect(28, 12, 4, 4)
    d.fillStyle = '#440066'; d.fillRect(16, 22, 16, 3)
    d.fillStyle = '#aa00ff'; d.fillRect(44, 16, 4, 24); d.fillRect(0, 16, 4, 24)
    dm.refresh()

    // Knight Commander (48×48)
    const kc = this.textures.createCanvas('boss_knight_commander', 48, 48)!
    const kk = kc.getContext()
    kk.fillStyle = '#445566'; kk.fillRect(4, 2, 40, 22)
    kk.fillStyle = '#7799bb'; kk.fillRect(8, 4, 32, 18)
    kk.fillStyle = '#334455'; kk.fillRect(2, 24, 44, 24)
    kk.fillStyle = '#445566'
    kk.fillRect(0, 24, 4, 22); kk.fillRect(44, 24, 4, 22)
    kk.fillRect(4, 44, 14, 6); kk.fillRect(30, 44, 14, 6)
    kk.fillStyle = '#ff3300'; kk.fillRect(13, 8, 10, 10); kk.fillRect(25, 8, 10, 10)
    kk.fillStyle = '#ffaa00'; kk.fillRect(15, 10, 6, 6); kk.fillRect(27, 10, 6, 6)
    kk.fillStyle = '#aaccdd'; kk.fillRect(46, 10, 2, 30); kk.fillRect(0, 10, 2, 30)
    kk.fillStyle = '#556677'; kk.fillRect(44, 6, 4, 36)
    kk.fillStyle = '#88aacc'; kk.fillRect(16, 20, 16, 4)
    kc.refresh()

    // Cave Worm (48×48)
    const cw = this.textures.createCanvas('boss_cave_worm', 48, 48)!
    const ww = cw.getContext()
    ww.fillStyle = '#554422'; ww.fillRect(8, 0, 32, 32)
    ww.fillStyle = '#776644'; ww.fillRect(10, 2, 28, 28)
    ww.fillStyle = '#443322'; ww.fillRect(4, 32, 40, 16)
    ww.fillStyle = '#554422'
    ww.fillRect(0, 32, 6, 14); ww.fillRect(42, 32, 6, 14)
    ww.fillRect(6, 44, 12, 6); ww.fillRect(30, 44, 12, 6)
    ww.fillStyle = '#ff2200'; ww.fillRect(12, 8, 10, 10); ww.fillRect(26, 8, 10, 10)
    ww.fillStyle = '#ffaa00'; ww.fillRect(14, 10, 6, 6); ww.fillRect(28, 10, 6, 6)
    ww.fillStyle = '#882200'; ww.fillRect(14, 22, 20, 5)
    ww.fillStyle = '#ccaa66'
    ww.fillRect(0, 14, 10, 8); ww.fillRect(38, 14, 10, 8)
    cw.refresh()
  }

  private makeHazards() {
    // Fire pit
    const cf = this.textures.createCanvas('hazard_fire', T, T)!
    const f = cf.getContext()
    f.fillStyle = '#220000'; f.fillRect(4, 20, 24, 12)
    f.fillStyle = '#882200'; f.fillRect(6, 16, 20, 10)
    f.fillStyle = '#ff4400'; f.fillRect(8, 10, 6, 12); f.fillRect(14, 8, 5, 14); f.fillRect(20, 12, 5, 10)
    f.fillStyle = '#ffaa00'; f.fillRect(9, 14, 4, 8); f.fillRect(15, 12, 3, 10); f.fillRect(21, 15, 3, 7)
    f.fillStyle = '#ffee88'; f.fillRect(10, 16, 2, 5); f.fillRect(16, 14, 2, 7)
    cf.refresh()

    // Spike trap
    const cst = this.textures.createCanvas('hazard_spike', T, T)!
    const st = cst.getContext()
    st.fillStyle = '#333333'; st.fillRect(2, 20, 28, 10)
    st.fillStyle = '#aaaaaa'
    for (let i = 0; i < 5; i++) {
      const bx = 4 + i * 6
      st.fillRect(bx, 6, 3, 16); st.fillRect(bx + 1, 4, 1, 4)
    }
    st.fillStyle = '#666666'; st.fillRect(2, 28, 28, 4)
    cst.refresh()

    // Dart turret
    const cdt = this.textures.createCanvas('hazard_dart', T, T)!
    const dt = cdt.getContext()
    dt.fillStyle = '#554433'; dt.fillRect(8, 8, 16, 16)
    dt.fillStyle = '#776655'; dt.fillRect(10, 10, 12, 12)
    dt.fillStyle = '#aaaaaa'; dt.fillRect(20, 14, 10, 4)
    dt.fillStyle = '#888888'; dt.fillRect(28, 15, 4, 2)
    dt.fillStyle = '#ff8800'; dt.fillRect(14, 15, 4, 2)
    cdt.refresh()
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

  private makeStairs() {
    const cs = this.textures.createCanvas('stairs', T, T)!
    const ctx = cs.getContext()
    ctx.fillStyle = '#334466'; ctx.fillRect(2, 2, T - 4, T - 4)
    ctx.fillStyle = '#4466aa'
    for (let i = 0; i < 5; i++) {
      const y = 4 + i * 5
      ctx.fillRect(4 + i * 2, y, T - 8 - i * 4, 3)
    }
    ctx.fillStyle = '#88aadd'; ctx.fillRect(12, 4, 8, 2)
    cs.refresh()
  }

  private makeShopIcon() {
    const c = this.textures.createCanvas('icon_shop', 24, 24)!
    const ctx = c.getContext()
    ctx.fillStyle = '#554400'; ctx.fillRect(2, 8, 20, 14)
    ctx.fillStyle = '#776600'; ctx.fillRect(0, 6, 24, 4)
    ctx.fillStyle = '#ffd700'; ctx.fillRect(8, 12, 8, 6)
    ctx.fillStyle = '#886600'; ctx.fillRect(10, 10, 4, 2)
    c.refresh()
  }

  private makeItemIcons() {
    const sw = this.textures.createCanvas('icon_weapon', 16, 16)!
    const sx = sw.getContext()
    sx.fillStyle = '#ccccdd'; sx.fillRect(7, 2, 2, 11)
    sx.fillStyle = '#aaaacc'; sx.fillRect(4, 8, 8, 2)
    sx.fillStyle = '#886622'; sx.fillRect(7, 12, 2, 3)
    sw.refresh()

    const ch = this.textures.createCanvas('icon_helm', 16, 16)!
    const hx = ch.getContext()
    hx.fillStyle = '#8899aa'
    hx.beginPath(); hx.arc(8, 9, 6, Math.PI, 0, false); hx.fill()
    hx.fillRect(2, 9, 12, 4)
    ch.refresh()

    const cch = this.textures.createCanvas('icon_chest', 16, 16)!
    const cx = cch.getContext()
    cx.fillStyle = '#667788'; cx.fillRect(2, 3, 12, 11)
    cx.fillStyle = '#445566'; cx.fillRect(7, 3, 2, 11)
    cx.fillStyle = '#aabbcc'; cx.fillRect(5, 7, 6, 2)
    cch.refresh()

    const cl = this.textures.createCanvas('icon_legs', 16, 16)!
    const lx = cl.getContext()
    lx.fillStyle = '#556677'; lx.fillRect(3, 2, 4, 13); lx.fillRect(9, 2, 4, 13)
    cl.refresh()

    const cgl = this.textures.createCanvas('icon_gloves', 16, 16)!
    const gx = cgl.getContext()
    gx.fillStyle = '#665544'; gx.fillRect(2, 6, 12, 8)
    gx.fillRect(2, 4, 2, 4); gx.fillRect(5, 3, 2, 4); gx.fillRect(8, 3, 2, 4); gx.fillRect(11, 4, 2, 4)
    cgl.refresh()

    const cr = this.textures.createCanvas('icon_ring', 16, 16)!
    const rx = cr.getContext()
    rx.strokeStyle = '#ddaa22'; rx.lineWidth = 2
    rx.beginPath(); rx.arc(8, 9, 5, 0, Math.PI * 2); rx.stroke()
    rx.fillStyle = '#4455cc'; rx.beginPath(); rx.arc(8, 4, 2, 0, Math.PI * 2); rx.fill()
    cr.refresh()

    const cn = this.textures.createCanvas('icon_necklace', 16, 16)!
    const nx = cn.getContext()
    nx.strokeStyle = '#ddaa22'; nx.lineWidth = 1.5
    nx.beginPath(); nx.arc(8, 5, 5, 0.1, Math.PI - 0.1); nx.stroke()
    nx.fillStyle = '#4444cc'; nx.beginPath(); nx.arc(8, 12, 3, 0, Math.PI * 2); nx.fill()
    cn.refresh()

    const ccons = this.textures.createCanvas('icon_consumable', 16, 16)!
    const cons = ccons.getContext()
    cons.fillStyle = '#445522'; cons.fillRect(6, 2, 4, 3)
    cons.fillStyle = '#88cc44'; cons.fillRect(4, 4, 8, 10)
    cons.fillStyle = '#aaffaa'; cons.fillRect(5, 5, 3, 4)
    cons.fillStyle = '#ffffff'; cons.fillRect(6, 8, 1, 4); cons.fillRect(4, 10, 5, 1)
    ccons.refresh()
  }
}
