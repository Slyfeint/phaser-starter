const KEY_MAP: Record<string, string> = {
  up: 'bind_up', down: 'bind_down', left: 'bind_left', right: 'bind_right',
  attack: 'bind_attack', roll: 'bind_roll', swap: 'bind_swap', inventory: 'bind_inv',
}

export function getKey(action: string, fallback: string): string {
  try {
    return localStorage.getItem(KEY_MAP[action] ?? '') ?? fallback
  } catch {
    return fallback
  }
}

export function setKey(action: string, key: string) {
  try { localStorage.setItem(KEY_MAP[action] ?? action, key) } catch { /* ignore */ }
}

export const BINDINGS = [
  { action: 'Move Up',     id: 'up',        default: 'W'     },
  { action: 'Move Down',   id: 'down',       default: 'S'     },
  { action: 'Move Left',   id: 'left',       default: 'A'     },
  { action: 'Move Right',  id: 'right',      default: 'D'     },
  { action: 'Attack',      id: 'attack',     default: 'SPACE' },
  { action: 'Roll',        id: 'roll',       default: 'Q'     },
  { action: 'Swap Weapon', id: 'swap',       default: 'F'     },
  { action: 'Inventory',   id: 'inventory',  default: 'I'     },
]
