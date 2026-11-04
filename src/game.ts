export type Element = "Nature" | "Fire" | "Storm";
export type DragonId = "ashwing" | "mossfang" | "cinderclaw" | "tempest";
export type EggId = "verdant" | "ember" | "storm";
export type View = "overview" | "hatchery" | "dragons" | "arena";
export type Move = "strike" | "guard" | "burst";
export type Difficulty = "scout" | "veteran";

export interface Dragon {
  id: DragonId;
  name: string;
  element: Element;
  rarity: string;
  hp: number;
  attack: number;
  power: number;
  description: string;
}
export const DRAGONS: Record<DragonId, Dragon> = {
  ashwing: {
    id: "ashwing",
    name: "Ashwing",
    element: "Fire",
    rarity: "Uncommon",
    hp: 120,
    attack: 24,
    power: 86,
    description:
      "A fierce little flame with the heart of a champion. Your first companion, ready for the arena.",
  },
  mossfang: {
    id: "mossfang",
    name: "Mossfang",
    element: "Nature",
    rarity: "Uncommon",
    hp: 140,
    attack: 25,
    power: 104,
    description:
      "Patient as the ancient forest. Mossfang’s sturdy scales turn every battle into a test of endurance.",
  },
  cinderclaw: {
    id: "cinderclaw",
    name: "Cinderclaw",
    element: "Fire",
    rarity: "Rare",
    hp: 130,
    attack: 29,
    power: 118,
    description:
      "Forged in the heart of a volcano. Cinderclaw burns brightest when the odds grow dark.",
  },
  tempest: {
    id: "tempest",
    name: "Tempest",
    element: "Storm",
    rarity: "Epic",
    hp: 125,
    attack: 31,
    power: 112,
    description:
      "A crack of thunder, a flash of violet. Tempest brings the wild energy of the sky into the arena.",
  },
};
export const EGGS: Record<
  EggId,
  {
    id: EggId;
    name: string;
    element: Element;
    rarity: string;
    dragon: DragonId;
  }
> = {
  verdant: {
    id: "verdant",
    name: "Verdant egg",
    element: "Nature",
    rarity: "Uncommon",
    dragon: "mossfang",
  },
  ember: {
    id: "ember",
    name: "Ember egg",
    element: "Fire",
    rarity: "Rare",
    dragon: "cinderclaw",
  },
  storm: {
    id: "storm",
    name: "Storm egg",
    element: "Storm",
    rarity: "Epic",
    dragon: "tempest",
  },
};
export interface Game {
  version: 1;
  name: string;
  eggs: EggId[];
  dragons: DragonId[];
  selected: DragonId;
  wins: number;
  battles: number;
  xp: number;
}
export const STORAGE_KEY = "myth-arena-v1";
export const newGame = (): Game => ({
  version: 1,
  name: "Dragonkeeper",
  eggs: ["verdant", "ember", "storm"],
  dragons: ["ashwing"],
  selected: "ashwing",
  wins: 0,
  battles: 0,
  xp: 0,
});

export function loadGame(): { game: Game; warning: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { game: newGame(), warning: "" };
    const g = JSON.parse(raw);
    const valid =
      g.version === 1 &&
      typeof g.name === "string" &&
      g.name.trim().length >= 2 &&
      g.name.length <= 20 &&
      Array.isArray(g.eggs) &&
      g.eggs.every(
        (id: unknown) => typeof id === "string" && Object.hasOwn(EGGS, id),
      ) &&
      new Set(g.eggs).size === g.eggs.length &&
      Array.isArray(g.dragons) &&
      g.dragons.length > 0 &&
      g.dragons.every(
        (id: unknown) => typeof id === "string" && Object.hasOwn(DRAGONS, id),
      ) &&
      new Set(g.dragons).size === g.dragons.length &&
      g.dragons.includes(g.selected) &&
      ["wins", "battles", "xp"].every(
        (k) => Number.isSafeInteger(g[k]) && g[k] >= 0,
      ) &&
      g.wins <= g.battles &&
      g.eggs.every((id: EggId) => !g.dragons.includes(EGGS[id].dragon));
    if (!valid) throw new Error("Invalid save");
    return { game: g as Game, warning: "" };
  } catch {
    return {
      game: newGame(),
      warning:
        "Saved progress could not be read. A fresh practice profile is ready. Progress may only last for this visit.",
    };
  }
}

export interface Battle {
  dragon: DragonId;
  difficulty: Difficulty;
  playerHp: number;
  rivalHp: number;
  rivalMaxHp: number;
  charge: number;
  turn: number;
  log: string[];
  result: "victory" | "defeat" | null;
}
export function startBattle(dragon: DragonId, difficulty: Difficulty): Battle {
  const rivalMaxHp = difficulty === "scout" ? 112 : 165;
  return {
    dragon,
    difficulty,
    playerHp: DRAGONS[dragon].hp,
    rivalHp: rivalMaxHp,
    rivalMaxHp,
    charge: 0,
    turn: 0,
    log: ["Thornmaw enters the arena. Your move."],
    result: null,
  };
}
export function playMove(battle: Battle, move: Move): Battle {
  if (battle.result || (move === "burst" && battle.charge < 3)) return battle;
  const b: Battle = { ...battle, log: [...battle.log] };
  const dragon = DRAGONS[b.dragon];
  const bonus =
    dragon.element === "Fire" ? 1.2 : dragon.element === "Storm" ? 0.85 : 1;
  const damage =
    move === "guard"
      ? 0
      : Math.round(dragon.attack * (move === "burst" ? 2.25 : 1) * bonus);
  b.rivalHp = Math.max(0, b.rivalHp - damage);
  b.charge = move === "burst" ? 0 : Math.min(3, b.charge + 1);
  b.turn += 1;
  b.log.push(
    move === "guard"
      ? `${dragon.name} guards, reducing the next hit by 70%.`
      : `${dragon.name} uses ${move === "burst" ? "Elemental burst" : "Strike"} for ${damage} damage.`,
  );
  if (b.rivalHp === 0) {
    b.result = "victory";
    b.log.push("Victory! Thornmaw has been defeated.");
    return b;
  }
  const heavy = b.turn % 3 === 0;
  const attack = b.difficulty === "scout" ? 19 : 29;
  const incoming = Math.round(
    attack * (heavy ? 1.8 : 1) * (move === "guard" ? 0.3 : 1),
  );
  b.playerHp = Math.max(0, b.playerHp - incoming);
  b.log.push(
    `Thornmaw uses ${heavy ? "Heavy strike" : "Strike"} for ${incoming} damage.`,
  );
  if (b.playerHp === 0) {
    b.result = "defeat";
    b.log.push("Defeat. Regroup and try a different strategy.");
  }
  return b;
}

export function hatchEgg(game: Game, id: EggId): Game {
  if (!game.eggs.includes(id)) return game;
  return {
    ...game,
    eggs: game.eggs.filter((egg) => egg !== id),
    dragons: [...game.dragons, EGGS[id].dragon],
  };
}
export function awardBattle(game: Game, result: "victory" | "defeat"): Game {
  return {
    ...game,
    wins: game.wins + (result === "victory" ? 1 : 0),
    battles: game.battles + 1,
    xp: game.xp + (result === "victory" ? 60 : 20),
  };
}

export interface Duel {
  dragons: [DragonId, DragonId];
  hp: [number, number];
  charge: [number, number];
  guarded: [boolean, boolean];
  active: 0 | 1;
  turn: number;
  winner: 0 | 1 | null;
  log: string[];
}
export function startDuel(first: DragonId, second: DragonId): Duel {
  return {
    dragons: [first, second],
    hp: [DRAGONS[first].hp, DRAGONS[second].hp],
    charge: [0, 0],
    guarded: [false, false],
    active: 0,
    turn: 1,
    winner: null,
    log: ["Local duel begins. Player 1 moves first."],
  };
}
export function playDuelMove(duel: Duel, move: Move): Duel {
  const a = duel.active;
  const b = a === 0 ? 1 : 0;
  if (duel.winner !== null || (move === "burst" && duel.charge[a] < 3))
    return duel;
  const d: Duel = {
    ...duel,
    hp: [...duel.hp],
    charge: [...duel.charge],
    guarded: [...duel.guarded],
    log: [...duel.log],
  };
  const attacker = DRAGONS[d.dragons[a]];
  const defender = DRAGONS[d.dragons[b]];
  const cycle: Record<Element, Element> = {
    Fire: "Nature",
    Nature: "Storm",
    Storm: "Fire",
  };
  const bonus =
    cycle[attacker.element] === defender.element
      ? 1.2
      : cycle[defender.element] === attacker.element
        ? 0.85
        : 1;
  if (move === "guard") {
    d.guarded[a] = true;
    d.charge[a] = Math.min(3, d.charge[a] + 1);
    d.log.push(
      `Player ${a + 1}: ${attacker.name} guards the next incoming attack.`,
    );
  } else {
    const damage = Math.round(
      attacker.attack *
        (move === "burst" ? 2.25 : 1) *
        bonus *
        (d.guarded[b] ? 0.3 : 1),
    );
    d.hp[b] = Math.max(0, d.hp[b] - damage);
    d.guarded[b] = false;
    d.charge[a] = move === "burst" ? 0 : Math.min(3, d.charge[a] + 1);
    d.log.push(
      `Player ${a + 1}: ${attacker.name} uses ${move === "burst" ? "Elemental burst" : "Strike"} for ${damage} damage.`,
    );
  }
  if (d.hp[b] === 0) {
    d.winner = a;
    d.log.push(`Player ${a + 1} wins the duel!`);
  } else {
    d.active = b;
    d.turn += 1;
  }
  return d;
}
export function currentView(): View {
  const hash = location.hash.slice(1);
  return ["overview", "hatchery", "dragons", "arena"].includes(hash)
    ? (hash as View)
    : "overview";
}
