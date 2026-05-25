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
    this.makeDoors()
    this.makeTorch()
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
    // Cape (behind body)
    ctx.fillStyle = '#551111'; ctx.fillRect(7, 13, 4, 16); ctx.fillRect(21, 13, 4, 16)
    // Body/torso
    ctx.fillStyle = '#2244aa'; ctx.fillRect(10, 14, 12, 12)
    ctx.fillStyle = '#1a3380'; ctx.fillRect(10, 14, 3, 12); ctx.fillRect(19, 14, 3, 12)
    // Belt
    ctx.fillStyle = '#886622'; ctx.fillRect(10, 22, 12, 2)
    ctx.fillStyle = '#ffcc44'; ctx.fillRect(14, 22, 4, 2)
    // Legs
    ctx.fillStyle = '#1a3366'; ctx.fillRect(10, 26, 5, 5); ctx.fillRect(17, 26, 5, 5)
    ctx.fillStyle = '#334488'; ctx.fillRect(10, 29, 5, 3); ctx.fillRect(17, 29, 5, 3)
    // Helmet
    ctx.fillStyle = '#778899'; ctx.fillRect(9, 4, 14, 10)
    ctx.fillStyle = '#99aabb'; ctx.fillRect(10, 5, 12, 7)
    // Visor slit
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(11, 9, 10, 2)
    ctx.fillStyle = '#ff4400'; ctx.fillRect(12, 9, 4, 2); ctx.fillRect(18, 9, 2, 2)
    // Helmet plume
    ctx.fillStyle = '#cc2222'; ctx.fillRect(14, 1, 4, 5)
    ctx.fillStyle = '#ff4444'; ctx.fillRect(15, 0, 2, 3)
    // Shield (left arm)
    ctx.fillStyle = '#445577'; ctx.fillRect(3, 14, 6, 10)
    ctx.fillStyle = '#6688aa'; ctx.fillRect(4, 15, 4, 8)
    ctx.fillStyle = '#aabbcc'; ctx.fillRect(5, 17, 2, 4)
    // Sword (right arm)
    ctx.fillStyle = '#ccccdd'; ctx.fillRect(24, 8, 2, 18)
    ctx.fillStyle = '#aaaacc'; ctx.fillRect(20, 15, 8, 2)
    ctx.fillStyle = '#886622'; ctx.fillRect(24, 24, 2, 4)
    c.refresh()
  }

  private makeEnemies() {
    // Skeleton — skull sockets, ribs, bony limbs
    const cs = this.textures.createCanvas('enemy_skeleton', T, T)!
    const s = cs.getContext()
    s.fillStyle = '#d0ccbb'; s.fillRect(11, 3, 10, 11); s.fillRect(12, 14, 8, 10)
    s.fillStyle = '#b0aaaa'
    s.fillRect(7, 14, 5, 10); s.fillRect(20, 14, 5, 10)
    s.fillRect(11, 24, 4, 8); s.fillRect(17, 24, 4, 8)
    // Skull eye sockets
    s.fillStyle = '#222222'; s.fillRect(12, 6, 4, 4); s.fillRect(17, 6, 4, 4)
    // Skull nose
    s.fillStyle = '#888877'; s.fillRect(15, 11, 2, 2)
    // Teeth
    s.fillStyle = '#ffffff'; s.fillRect(12, 13, 2, 2); s.fillRect(15, 13, 2, 2); s.fillRect(18, 13, 2, 2)
    // Ribs
    s.fillStyle = '#c0bcaa'
    for (let i = 0; i < 3; i++) { s.fillRect(13, 16 + i * 3, 6, 2) }
    cs.refresh()

    // Orc — tusks, heavy body, angry brow
    const co = this.textures.createCanvas('enemy_orc', T, T)!
    const o = co.getContext()
    o.fillStyle = '#2d6622'; o.fillRect(7, 4, 18, 14)
    o.fillStyle = '#1e4418'; o.fillRect(5, 18, 22, 12)
    o.fillStyle = '#2d6622'
    o.fillRect(2, 18, 7, 10); o.fillRect(23, 18, 7, 10)
    o.fillRect(7, 28, 8, 4); o.fillRect(17, 28, 8, 4)
    // Eyes
    o.fillStyle = '#ff6600'; o.fillRect(10, 8, 5, 4); o.fillRect(17, 8, 5, 4)
    o.fillStyle = '#ff2200'; o.fillRect(11, 9, 3, 2); o.fillRect(18, 9, 3, 2)
    // Brow ridge
    o.fillStyle = '#1a3a10'; o.fillRect(9, 7, 6, 2); o.fillRect(17, 7, 6, 2)
    // Tusks (protruding below)
    o.fillStyle = '#f0d090'; o.fillRect(11, 16, 3, 7); o.fillRect(18, 16, 3, 7)
    o.fillStyle = '#ffe0a0'; o.fillRect(12, 17, 1, 5); o.fillRect(19, 17, 1, 5)
    // Club/weapon hand hint
    o.fillStyle = '#884400'; o.fillRect(26, 14, 4, 14); o.fillRect(24, 14, 6, 3)
    co.refresh()

    // Bat — membrane wings, fangs, ears
    const cb = this.textures.createCanvas('enemy_bat', T, T)!
    const b = cb.getContext()
    b.fillStyle = '#331122'; b.fillRect(12, 13, 8, 10)
    // Wings — multi-layered membrane
    b.fillStyle = '#220e18'; b.fillRect(2, 8, 10, 8); b.fillRect(20, 8, 10, 8)
    b.fillStyle = '#331122'; b.fillRect(4, 6, 8, 4); b.fillRect(20, 6, 8, 4)
    b.fillStyle = '#442233'; b.fillRect(6, 14, 6, 6); b.fillRect(20, 14, 6, 6)
    // Wing veins
    b.fillStyle = '#551133'; b.fillRect(4, 10, 1, 6); b.fillRect(7, 8, 1, 8); b.fillRect(10, 10, 1, 6)
    b.fillRect(22, 10, 1, 6); b.fillRect(25, 8, 1, 8); b.fillRect(28, 10, 1, 6)
    // Eyes
    b.fillStyle = '#ff2244'; b.fillRect(13, 14, 3, 3); b.fillRect(18, 14, 3, 3)
    b.fillStyle = '#ff88aa'; b.fillRect(14, 15, 1, 1); b.fillRect(19, 15, 1, 1)
    // Ears
    b.fillStyle = '#331122'; b.fillRect(11, 9, 3, 5); b.fillRect(18, 9, 3, 5)
    // Fangs
    b.fillStyle = '#ffffff'; b.fillRect(14, 22, 2, 3); b.fillRect(17, 22, 2, 3)
    cb.refresh()

    // Spider — 8 legs, body segments, red eyes
    const csp = this.textures.createCanvas('enemy_spider', T, T)!
    const sp = csp.getContext()
    // Abdomen
    sp.fillStyle = '#1a0808'; sp.fillRect(10, 14, 12, 14)
    sp.fillStyle = '#2a1010'; sp.fillRect(11, 15, 10, 12)
    // Abdomen markings
    sp.fillStyle = '#550000'
    for (let i = 0; i < 4; i++) sp.fillRect(14, 16 + i * 3, 4, 2)
    // Cephalothorax (head)
    sp.fillStyle = '#221008'; sp.fillRect(11, 8, 10, 8)
    // 8 legs (4 per side)
    sp.fillStyle = '#331111'
    sp.fillRect(2, 10, 10, 3); sp.fillRect(2, 14, 9, 3); sp.fillRect(3, 18, 8, 3); sp.fillRect(4, 22, 7, 3)
    sp.fillRect(20, 10, 10, 3); sp.fillRect(21, 14, 9, 3); sp.fillRect(21, 18, 8, 3); sp.fillRect(21, 22, 7, 3)
    // 8 eyes
    sp.fillStyle = '#ff2200'; sp.fillRect(12, 9, 2, 2); sp.fillRect(15, 9, 2, 2); sp.fillRect(18, 9, 2, 2)
    sp.fillRect(13, 12, 2, 2); sp.fillRect(17, 12, 2, 2)
    csp.refresh()

    // Guard — helmet, tabard, spear
    const cg = this.textures.createCanvas('enemy_guard', T, T)!
    const g = cg.getContext()
    g.fillStyle = '#778899'; g.fillRect(8, 4, 16, 12)
    g.fillStyle = '#99aabb'; g.fillRect(10, 5, 12, 9)
    // Helm visor
    g.fillStyle = '#1a1a1a'; g.fillRect(11, 9, 10, 3)
    // Body/tabard
    g.fillStyle = '#aa2222'; g.fillRect(8, 16, 16, 14)
    g.fillStyle = '#cc2222'; g.fillRect(10, 17, 12, 10)
    // Arms
    g.fillStyle = '#667788'; g.fillRect(4, 16, 6, 12); g.fillRect(22, 16, 6, 12)
    g.fillRect(8, 28, 7, 5); g.fillRect(17, 28, 7, 5)
    // Tabard cross
    g.fillStyle = '#dddddd'; g.fillRect(14, 17, 4, 10); g.fillRect(9, 21, 14, 3)
    // Spear
    g.fillStyle = '#aabbcc'; g.fillRect(27, 4, 2, 26)
    g.fillStyle = '#ddeeee'; g.fillRect(26, 2, 4, 4)
    cg.refresh()

    // Knight — full plate with plume, two-handed sword
    const ck = this.textures.createCanvas('enemy_knight', T, T)!
    const k = ck.getContext()
    k.fillStyle = '#556677'; k.fillRect(6, 2, 20, 14)
    k.fillStyle = '#88aabb'; k.fillRect(8, 3, 16, 11)
    // Visor
    k.fillStyle = '#1a1a1a'; k.fillRect(9, 9, 14, 3)
    k.fillStyle = '#223344'; k.fillRect(10, 8, 3, 5); k.fillRect(19, 8, 3, 5)
    // Plume
    k.fillStyle = '#cc2200'; k.fillRect(13, 0, 6, 4)
    k.fillStyle = '#ff4422'; k.fillRect(14, 0, 4, 2)
    // Body armor
    k.fillStyle = '#445566'; k.fillRect(4, 16, 24, 18)
    k.fillStyle = '#556677'; k.fillRect(6, 17, 20, 14)
    // Armor plates
    k.fillStyle = '#667788'; k.fillRect(8, 19, 16, 4); k.fillRect(8, 24, 16, 4)
    // Arms
    k.fillStyle = '#445566'; k.fillRect(1, 16, 5, 14); k.fillRect(26, 16, 5, 14)
    k.fillRect(6, 30, 8, 5); k.fillRect(18, 30, 8, 5)
    // Greatsword
    k.fillStyle = '#ccddee'; k.fillRect(28, 4, 3, 26)
    k.fillStyle = '#aabbcc'; k.fillRect(25, 12, 9, 2)
    k.fillStyle = '#886622'; k.fillRect(29, 28, 2, 4)
    ck.refresh()

    // Dark mage — pointed hat, robes, staff
    const cm = this.textures.createCanvas('enemy_dark_mage', T, T)!
    const m = cm.getContext()
    // Hat
    m.fillStyle = '#110022'; m.fillRect(10, 0, 12, 4)
    m.fillStyle = '#220033'; m.fillRect(12, 2, 8, 5)
    m.fillStyle = '#110022'; m.fillRect(7, 5, 18, 3)
    // Head
    m.fillStyle = '#ddc0a0'; m.fillRect(10, 7, 12, 10)
    m.fillStyle = '#aa22ff'; m.fillRect(11, 10, 4, 4); m.fillRect(17, 10, 4, 4)
    m.fillStyle = '#ffffff'; m.fillRect(12, 11, 2, 2); m.fillRect(18, 11, 2, 2)
    // Beard
    m.fillStyle = '#999999'; m.fillRect(12, 16, 8, 4)
    // Robe
    m.fillStyle = '#1a0030'; m.fillRect(7, 17, 18, 15)
    m.fillStyle = '#2a0050'; m.fillRect(9, 18, 14, 12)
    m.fillStyle = '#440066'
    m.fillRect(4, 17, 5, 12); m.fillRect(23, 17, 5, 12)
    m.fillRect(8, 30, 6, 4); m.fillRect(18, 30, 6, 4)
    // Rune trim
    m.fillStyle = '#aa00ff'; m.fillRect(9, 22, 14, 2)
    // Staff
    m.fillStyle = '#664422'; m.fillRect(25, 4, 2, 28)
    m.fillStyle = '#cc00ff'; m.fillRect(23, 2, 6, 5)
    m.fillStyle = '#ee88ff'; m.fillRect(24, 3, 4, 3)
    cm.refresh()

    // Cave troll — huge, stony skin, club, beady eyes
    const ct = this.textures.createCanvas('enemy_cave_troll', T, T)!
    const t2 = ct.getContext()
    t2.fillStyle = '#556644'; t2.fillRect(3, 2, 26, 16)
    t2.fillStyle = '#667755'; t2.fillRect(5, 3, 22, 12)
    // Skin texture bumps
    t2.fillStyle = '#445533'; t2.fillRect(7, 5, 3, 3); t2.fillRect(14, 4, 3, 3); t2.fillRect(20, 6, 3, 3)
    t2.fillStyle = '#445533'; t2.fillRect(2, 18, 28, 14)
    t2.fillStyle = '#556644'; t2.fillRect(4, 19, 24, 11)
    t2.fillStyle = '#445533'
    t2.fillRect(0, 18, 5, 12); t2.fillRect(27, 18, 5, 12)
    t2.fillRect(4, 28, 10, 6); t2.fillRect(18, 28, 10, 6)
    // Beady eyes
    t2.fillStyle = '#ff4400'; t2.fillRect(8, 7, 6, 6); t2.fillRect(18, 7, 6, 6)
    t2.fillStyle = '#ffaa00'; t2.fillRect(9, 8, 4, 4); t2.fillRect(19, 8, 4, 4)
    t2.fillStyle = '#1a0000'; t2.fillRect(10, 9, 2, 2); t2.fillRect(20, 9, 2, 2)
    // Tusks
    t2.fillStyle = '#cccc88'; t2.fillRect(10, 14, 3, 7); t2.fillRect(19, 14, 3, 7)
    t2.fillStyle = '#eeeeaa'; t2.fillRect(11, 15, 1, 5); t2.fillRect(20, 15, 1, 5)
    // Stone club
    t2.fillStyle = '#887766'; t2.fillRect(28, 12, 5, 16)
    t2.fillStyle = '#aaa088'; t2.fillRect(26, 10, 6, 8)
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

  private makeDoors() {
    // Closed door — heavy wood planks with iron banding
    const cc = this.textures.createCanvas('door_closed', T, T)!
    const ctx = cc.getContext()
    ctx.fillStyle = '#3d2510'; ctx.fillRect(4, 0, 24, 32)
    ctx.fillStyle = '#4f3018'
    for (let i = 0; i < 4; i++) ctx.fillRect(4, i * 8, 24, 6)
    ctx.fillStyle = '#221408'
    for (let i = 1; i < 4; i++) ctx.fillRect(4, i * 8 - 1, 24, 2)
    // Iron bands
    ctx.fillStyle = '#333333'; ctx.fillRect(4, 4, 24, 2); ctx.fillRect(4, 12, 24, 2); ctx.fillRect(4, 20, 24, 2); ctx.fillRect(4, 28, 24, 2)
    // Frame
    ctx.fillStyle = '#221408'; ctx.fillRect(2, 0, 3, 32); ctx.fillRect(27, 0, 3, 32)
    // Iron handle
    ctx.fillStyle = '#888888'; ctx.fillRect(21, 14, 4, 2); ctx.fillRect(24, 13, 2, 5)
    cc.refresh()

    // Open door — same frame but door pushed aside
    const co = this.textures.createCanvas('door_open', T, T)!
    const ctxo = co.getContext()
    // Frame only, door swung open (just show the opening)
    ctxo.fillStyle = '#221408'; ctxo.fillRect(2, 0, 3, 32); ctxo.fillRect(27, 0, 3, 32)
    // Shadow in doorway
    ctxo.fillStyle = '#111111'; ctxo.fillRect(5, 0, 22, 32)
    ctxo.fillStyle = '#1a0e04'; ctxo.fillRect(6, 0, 2, 32)
    // Door edge visible (swung to side)
    ctxo.fillStyle = '#3d2510'; ctxo.fillRect(4, 0, 4, 32)
    ctxo.fillStyle = '#4f3018'; ctxo.fillRect(5, 0, 2, 30)
    co.refresh()
  }

  private makeTorch() {
    const c = this.textures.createCanvas('torch', 12, 24)!
    const ctx = c.getContext()
    // Handle
    ctx.fillStyle = '#553311'; ctx.fillRect(4, 10, 4, 14)
    ctx.fillStyle = '#7a5522'; ctx.fillRect(5, 11, 2, 12)
    // Head/bracket
    ctx.fillStyle = '#444444'; ctx.fillRect(3, 8, 6, 4)
    ctx.fillStyle = '#222222'; ctx.fillRect(3, 8, 2, 14)
    // Flame outer
    ctx.fillStyle = '#ff4400'; ctx.fillRect(2, 4, 8, 6)
    ctx.fillStyle = '#ff6600'; ctx.fillRect(3, 3, 6, 5)
    // Flame inner
    ctx.fillStyle = '#ffaa00'; ctx.fillRect(4, 4, 4, 4)
    ctx.fillStyle = '#ffee00'; ctx.fillRect(5, 4, 2, 3)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(5, 5, 2, 1)
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
