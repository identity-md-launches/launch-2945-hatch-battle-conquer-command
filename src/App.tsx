import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { BrandMark, Icon } from "./icons";
import { ArenaArt, DragonArt, EggArt } from "./art";
import DuelBoard from "./DuelBoard";
import {
  awardBattle,
  currentView,
  DRAGONS,
  EGGS,
  hatchEgg,
  loadGame,
  newGame,
  playMove,
  startBattle,
  STORAGE_KEY,
  playDuelMove,
  startDuel,
  type Duel,
  type Battle,
  type Difficulty,
  type DragonId,
  type EggId,
  type Element,
  type Game,
  type Move,
  type View,
} from "./game";

type ModalState =
  | { type: "help" }
  | { type: "profile" }
  | { type: "reset" }
  | { type: "hatch"; egg: EggId }
  | { type: "reveal"; dragon: DragonId }
  | { type: "dragon"; dragon: DragonId }
  | null;
const navItems: { view: View; label: string; icon: string }[] = [
  { view: "overview", label: "Overview", icon: "grid" },
  { view: "hatchery", label: "Hatchery", icon: "egg" },
  { view: "dragons", label: "My dragons", icon: "dragon" },
  { view: "arena", label: "Battle arena", icon: "swords" },
];
const elementIcon = (element: Element) =>
  element === "Nature" ? "leaf" : element === "Fire" ? "fire" : "bolt";

function Button({
  children,
  onClick,
  variant = "secondary",
  className = "",
  disabled = false,
  type = "button",
  autoFocus = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  autoFocus?: boolean;
}) {
  return (
    <button
      type={type}
      className={`button ${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), [tabindex="0"]',
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const r = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom
          )
            close();
        }
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function EggCard({ id, onHatch }: { id: EggId; onHatch: (id: EggId) => void }) {
  const egg = EGGS[id];
  return (
    <article className={`egg-card ${egg.element.toLowerCase()}`}>
      <div className="egg-top">
        <span className={`rarity ${egg.rarity.toLowerCase()}`}>
          {egg.rarity}
        </span>
        <Icon name={elementIcon(egg.element)} size={17} />
      </div>
      <EggArt element={egg.element} />
      <div className="egg-details">
        <h3>{egg.name}</h3>
        <span className="muted">{egg.element} dragon</span>
        <div className="hatch-row">
          <span className="ready">
            <span className="status-dot" />
            Ready to hatch
          </span>
          <button
            className="hatch-button"
            onClick={() => onHatch(id)}
            aria-label={`Hatch ${egg.name.toLowerCase()}`}
          >
            <Icon name="plus" size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

function DragonCard({
  id,
  selected,
  open,
}: {
  id: DragonId;
  selected: boolean;
  open: () => void;
}) {
  const dragon = DRAGONS[id];
  return (
    <button
      className={`dragon-card ${selected ? "selected" : ""}`}
      onClick={open}
      aria-label={`View ${dragon.name}${selected ? ", selected for battle" : ""}`}
    >
      <DragonArt element={dragon.element} />
      <span className="dragon-card-copy">
        <span className="dragon-name">{dragon.name}</span>
        <span className={`element-label ${dragon.element.toLowerCase()}`}>
          <Icon name={elementIcon(dragon.element)} size={14} />
          {dragon.element}
          <span className="dot-divider">·</span>
          {dragon.rarity}
        </span>
        <span className="dragon-power">
          <Icon name="bolt" size={14} />
          {dragon.power} power
        </span>
      </span>
      <span className="dragon-card-end">
        {selected ? (
          <span className="selected-mark" title="Selected for battle">
            <Icon name="check" size={15} />
          </span>
        ) : (
          <Icon name="chevron" size={16} />
        )}
      </span>
    </button>
  );
}

function ProfileForm({
  game,
  save,
  showReset,
  announce,
}: {
  game: Game;
  save: (name: string) => void;
  showReset: () => void;
  announce: (message: string) => void;
}) {
  const [name, setName] = useState(game.name);
  const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2 || name.trim().length > 20) {
      setError("Use between 2 and 20 characters for your name.");
      document.getElementById("keeper-name")?.focus();
      return;
    }
    save(name.trim());
  }
  function download() {
    const blob = new Blob([JSON.stringify(game, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "myth-arena-progress.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce("Your practice progress has been exported.");
  }
  return (
    <>
      <p className="modal-description">
        Your collection and results are saved in this browser. Clearing site
        data resets your progress.
      </p>
      <form onSubmit={submit} noValidate>
        <label className="field-label" htmlFor="keeper-name">
          Keeper name
        </label>
        <input
          id="keeper-name"
          name="nickname"
          autoComplete="nickname"
          value={name}
          maxLength={20}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "name-error" : "name-hint"}
        />
        {error ? (
          <p id="name-error" className="error-text" role="alert">
            {error}
          </p>
        ) : (
          <p id="name-hint" className="field-hint">
            2–20 characters. Choose a name for your journey.
          </p>
        )}
        <Button type="submit" variant="primary">
          Save name
          <Icon name="check" size={18} />
        </Button>
      </form>
      <div className="profile-actions">
        <Button onClick={download}>
          <Icon name="download" size={18} />
          Export progress
        </Button>
        <Button variant="quiet" onClick={showReset}>
          <Icon name="reset" size={18} />
          Reset progress
        </Button>
      </div>
    </>
  );
}

function HelpContent() {
  return (
    <div className="help-content">
      <p>
        Welcome to Myth Arena, a free dragon strategy game. Battle an AI rival
        or challenge a friend in a two-player duel on one device.
      </p>
      <ol className="guide-steps">
        <li>
          <span className="guide-icon">
            <Icon name="egg" />
          </span>
          <div>
            <h3>Hatch a legend</h3>
            <p>
              Three starter eggs are ready in the hatchery. Hatching is instant
              and free. Each egg reveals one dragon.
            </p>
          </div>
        </li>
        <li>
          <span className="guide-icon">
            <Icon name="dragon" />
          </span>
          <div>
            <h3>Choose your companion</h3>
            <p>
              Open a dragon in your collection and select it for battle.
              Different dragons have different health and attack stats.
            </p>
          </div>
        </li>
        <li>
          <span className="guide-icon">
            <Icon name="swords" />
          </span>
          <div>
            <h3>Make every move count</h3>
            <p>
              Strike to deal damage. Guard to reduce the next hit by 70%. Both
              build charge. At 3 charge, unleash an Elemental burst for 2.25×
              attack.
            </p>
          </div>
        </li>
      </ol>
      <div className="guide-note">
        <Icon name="leaf" />
        <p>
          Fire deals 20% more damage to Thornmaw’s Nature element. Storm deals
          15% less. Thornmaw uses a heavy strike every third turn.
        </p>
      </div>
      <p className="muted">
        Victory earns 60 XP; defeat earns 20 XP. Battles restore health. Your
        practice rank advances every 100 XP.
      </p>
      <p className="muted">
        For local PvP, select two dragons and pass the device between turns.
        Fire beats Nature, Nature beats Storm, and Storm beats Fire. An
        advantage deals 20% more damage; a disadvantage deals 15% less. Guard
        lasts until the next incoming attack. Local duels do not award practice
        XP.
      </p>
      <p className="muted">
        Progress stays on this device. Online matchmaking, accounts, trading,
        and purchases are not connected in this static edition. An unfinished
        battle ends if you reload the page.
      </p>
    </div>
  );
}

function HealthBar({
  current,
  max,
  rival = false,
}: {
  current: number;
  max: number;
  rival?: boolean;
}) {
  return (
    <div className="health-block">
      <div className="health-label">
        <span>
          <Icon name="heart" size={14} />
          Health
        </span>
        <span>
          {current} / {max}
        </span>
      </div>
      <div
        className={`health-track ${rival ? "rival" : ""}`}
        role="progressbar"
        aria-label={rival ? "Thornmaw health" : "Your dragon health"}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <span style={{ width: `${(current / max) * 100}%` }} />
      </div>
    </div>
  );
}

function BattleBoard({
  battle,
  onMove,
  onAgain,
  onClose,
}: {
  battle: Battle;
  onMove: (move: Move) => void;
  onAgain: () => void;
  onClose: () => void;
}) {
  const dragon = DRAGONS[battle.dragon];
  const heavyNext = (battle.turn + 1) % 3 === 0;
  return (
    <section className="battle-board" aria-label="Practice battle">
      <div className="battle-heading">
        <span>
          <Icon name="swords" />
          Training grounds
        </span>
        <span className="muted">
          {battle.difficulty === "scout" ? "Scout" : "Veteran"} · Turn{" "}
          {battle.turn + (battle.result ? 0 : 1)}
        </span>
      </div>
      <div className="fighters">
        <div className="fighter">
          <div className="fighter-name">
            <h2>{dragon.name}</h2>
            <span>You</span>
          </div>
          <DragonArt element={dragon.element} />
          <HealthBar current={battle.playerHp} max={dragon.hp} />
        </div>
        <span className="versus">vs</span>
        <div className="fighter">
          <div className="fighter-name">
            <h2>Thornmaw</h2>
            <span>AI rival</span>
          </div>
          <DragonArt element="Nature" className="rival-art" />
          <HealthBar current={battle.rivalHp} max={battle.rivalMaxHp} rival />
        </div>
      </div>
      {battle.result ? (
        <div className={`battle-result ${battle.result}`} role="status">
          <Icon
            name={battle.result === "victory" ? "trophy" : "shield"}
            size={32}
          />
          <h2>
            {battle.result === "victory"
              ? "The arena is yours."
              : "Every legend learns."}
          </h2>
          <p>
            {battle.result === "victory"
              ? "Victory! Your dragon earned 60 XP."
              : "Defeat. You earned 20 XP. Try guarding before a heavy strike."}
          </p>
          <div className="button-row">
            <Button variant="primary" onClick={onAgain}>
              Battle again
              <Icon name="swords" size={18} />
            </Button>
            <Button onClick={onClose}>Choose a dragon</Button>
          </div>
        </div>
      ) : (
        <div className="battle-controls">
          <div className="turn-hint">
            <span className={heavyNext ? "warning-text" : ""}>
              <Icon name={heavyNext ? "shield" : "swords"} size={17} />
              {heavyNext
                ? "Heavy strike incoming. A good time to guard."
                : "Your turn. Choose your next move."}
            </span>
            <span className="charge">
              <Icon name="bolt" size={16} />
              {battle.charge} / 3 charge
            </span>
          </div>
          <div className="move-buttons">
            <Button variant="primary" onClick={() => onMove("strike")}>
              <Icon name="swords" />
              Strike<span>Deal damage</span>
            </Button>
            <Button onClick={() => onMove("guard")}>
              <Icon name="shield" />
              Guard<span>Block 70%</span>
            </Button>
            <Button
              onClick={() => onMove("burst")}
              disabled={battle.charge < 3}
            >
              <Icon name="bolt" />
              Elemental burst
              <span>
                {battle.charge < 3 ? "Needs 3 charge" : "Unleash 2.25× attack"}
              </span>
            </Button>
          </div>
        </div>
      )}
      <div
        className="battle-log"
        role="log"
        aria-label="Battle log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <h3>Battle log</h3>
        <ol>
          {battle.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function App() {
  const [initial] = useState(loadGame);
  const [game, setGame] = useState(initial.game);
  const [warning, setWarning] = useState(initial.warning);
  const [view, setView] = useState<View>(currentView);
  const [modal, setModal] = useState<ModalState>(null);
  const [status, setStatus] = useState("");
  const [eggFilter, setEggFilter] = useState("All eggs");
  const [dragonFilter, setDragonFilter] = useState("All elements");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("scout");
  const [battle, setBattle] = useState<Battle | null>(null);
  const [mode, setMode] = useState<"ai" | "local">("ai");
  const [rival, setRival] = useState<DragonId>(initial.game.dragons[0]);
  const [duel, setDuel] = useState<Duel | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch {
      setWarning(
        "Progress cannot be saved in this browser. Keep this tab open to continue your journey.",
      );
    }
  }, [game]);
  useEffect(() => {
    const onHash = () => setView(currentView());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (previousView.current !== view) {
      window.scrollTo({ top: 0, behavior: "instant" });
      heading.current?.focus({ preventScroll: true });
      previousView.current = view;
    }
  }, [view]);

  const navigate = (next: View) => {
    location.hash = next;
    setView(next);
  };
  const announce = (message: string) => setStatus(message);
  const totalPower = game.dragons.reduce(
    (sum, id) => sum + DRAGONS[id].power,
    0,
  );
  const ranks = [
    "Bronze III",
    "Bronze II",
    "Bronze I",
    "Silver III",
    "Silver II",
    "Silver I",
    "Gold III",
    "Gold II",
    "Gold I",
    "Mythic",
  ];
  const rank = ranks[Math.min(9, Math.floor(game.xp / 100))];
  const maxRank = game.xp >= 900;
  const rankProgress = maxRank ? 100 : game.xp % 100;
  const hatches = game.dragons.length - 1;
  const questsCompleted = Number(hatches > 0) + Number(game.wins > 0);
  const title =
    navItems.find((item) => item.view === view)?.label ?? "Overview";

  function executeMove(move: Move) {
    if (!battle) return;
    const next = playMove(battle, move);
    if (next === battle) return;
    setBattle(next);
    if (next.result && !battle.result)
      setGame((g) => awardBattle(g, next.result!));
  }
  function beginBattle() {
    setBattle(startBattle(game.selected, difficulty));
    announce(
      `${DRAGONS[game.selected].name} enters the arena against Thornmaw.`,
    );
  }
  function doHatch(id: EggId) {
    if (!game.eggs.includes(id)) {
      setModal(null);
      return;
    }
    setGame((g) => hatchEgg(g, id));
    setModal({ type: "reveal", dragon: EGGS[id].dragon });
    announce(
      `${DRAGONS[EGGS[id].dragon].name} hatched and joined your collection.`,
    );
  }
  function selectDragon(id: DragonId) {
    setGame((g) => ({ ...g, selected: id }));
    setModal(null);
    setBattle(null);
    setDuel(null);
    navigate("arena");
    announce(`${DRAGONS[id].name} is selected for battle.`);
  }

  const filteredEggs = game.eggs.filter(
    (id) => eggFilter === "All eggs" || EGGS[id].element === eggFilter,
  );
  const filteredDragons = game.dragons.filter(
    (id) =>
      (dragonFilter === "All elements" ||
        DRAGONS[id].element === dragonFilter) &&
      DRAGONS[id].name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Myth Arena home">
          <BrandMark />
          <span>
            myth<span className="brand-second">arena</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <div className="nav-group">
            {navItems.map((item) => (
              <a
                key={item.view}
                className={`nav-item ${view === item.view ? "active" : ""}`}
                href={`#${item.view}`}
                aria-current={view === item.view ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.view === "hatchery" && game.eggs.length > 0 && (
                  <span className="nav-count">{game.eggs.length}</span>
                )}
              </a>
            ))}
          </div>
        </nav>
        <div className="sidebar-secondary">
          <button
            className="nav-item"
            onClick={() => setModal({ type: "help" })}
          >
            <Icon name="book" />
            <span>Keeper’s guide</span>
            <Icon name="arrow" size={16} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="rank-panel">
            <div className="rank-emblem">
              <Icon name="crown" size={29} />
            </div>
            <div className="rank-heading">
              <span>{rank}</span>
              <span className="muted">Practice rank</span>
            </div>
            <div
              className="rank-progress"
              role="progressbar"
              aria-label="Progress to next practice rank"
              aria-valuenow={rankProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${rankProgress}%` }} />
            </div>
            <span className="rank-xp">
              {maxRank
                ? `${game.xp} total XP · Highest rank`
                : `${rankProgress} / 100 XP to next rank`}
            </span>
          </div>
          <button
            className="profile-button"
            onClick={() => setModal({ type: "profile" })}
          >
            <span className="avatar">
              <Icon name="user" size={19} />
            </span>
            <span className="profile-copy">
              <span>{game.name}</span>
              <span className="muted">Local profile</span>
            </span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </aside>
      <div className="page-shell">
        <header className="topbar">
          <a
            className="mobile-brand"
            href="#overview"
            aria-label="Myth Arena home"
          >
            <BrandMark small />
            <span>myth arena</span>
          </a>
          <div className="breadcrumb">
            <span>Myth Arena</span>
            <Icon name="chevron" size={14} />
            <span>{view === "overview" ? "Command center" : title}</span>
          </div>
          <div className="topbar-utilities">
            <span className="practice-label">
              <span className="status-dot" />
              Practice world
            </span>
            <span className="header-xp">
              <Icon name="spark" size={17} />
              {game.xp} XP
            </span>
            <button
              className="icon-button help-button"
              aria-label="How to play Myth Arena"
              onClick={() => setModal({ type: "help" })}
            >
              <Icon name="help" />
            </button>
            <button
              className="mobile-profile icon-button"
              aria-label="Open your profile"
              onClick={() => setModal({ type: "profile" })}
            >
              <Icon name="user" />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {warning && (
            <div className="storage-warning" role="status">
              <Icon name="help" />
              <p>{warning}</p>
            </div>
          )}
          {view === "overview" && (
            <>
              <div className="welcome-row">
                <p>
                  Welcome back, <span>{game.name}</span>
                </p>
                <span>
                  <Icon name="shield" size={15} />
                  Your legend, in the making
                </span>
              </div>
              <section className="hero">
                <img
                  className="hero-image"
                  src="./assets/verdant-dragon.webp"
                  alt=""
                  fetchPriority="high"
                />
                <div className="hero-shade" />
                <div className="hero-content">
                  <h1 tabIndex={-1} ref={heading}>
                    Hatch. Battle.
                    <br />
                    <span>Conquer.</span>
                  </h1>
                  <p>Raise mythical dragons in a tactical battle game.</p>
                  <div className="hero-actions">
                    <Button variant="primary" onClick={() => navigate("arena")}>
                      <Icon name="swords" size={18} />
                      Enter the arena
                      <Icon name="arrow" size={18} />
                    </Button>
                    <button
                      className="text-button"
                      onClick={() => navigate("hatchery")}
                    >
                      Explore the hatchery
                      <Icon name="chevron" size={15} />
                    </button>
                  </div>
                  <span className="hero-footnote">
                    <Icon name="shield" size={13} />
                    Free to play · Local practice & PvP
                  </span>
                </div>
                <div className="hero-corner" aria-hidden="true">
                  <span />
                  <Icon name="spark" size={17} />
                  <span />
                </div>
              </section>
              <div
                className="stats-strip"
                aria-label="Your practice statistics"
              >
                {[
                  {
                    icon: "dragon",
                    value: game.dragons.length,
                    label: "Dragons collected",
                  },
                  {
                    icon: "egg",
                    value: game.eggs.length,
                    label: "Eggs to hatch",
                  },
                  {
                    icon: "trophy",
                    value: game.wins,
                    label: "Arena victories",
                  },
                  {
                    icon: "bolt",
                    value: totalPower,
                    label: "Collection power",
                  },
                ].map((stat) => (
                  <div className="stat" key={stat.label}>
                    <span className="stat-icon">
                      <Icon name={stat.icon} size={22} />
                    </span>
                    <div>
                      <span className="stat-value">{stat.value}</span>
                      <span className="stat-label">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="home-grid">
                <section className="hatchery-section">
                  <div className="section-heading">
                    <h2>Your next hatch</h2>
                    <a href="#hatchery">
                      View hatchery
                      <Icon name="arrow" size={16} />
                    </a>
                  </div>
                  {game.eggs.length > 0 ? (
                    <div className="egg-grid">
                      {game.eggs.map((id) => (
                        <EggCard
                          key={id}
                          id={id}
                          onHatch={(egg) => setModal({ type: "hatch", egg })}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state compact">
                      <Icon name="check" size={32} />
                      <h3>Every legend has awakened.</h3>
                      <p>
                        Your starter eggs have joined your dragon collection.
                      </p>
                      <Button onClick={() => navigate("dragons")}>
                        View your dragons
                        <Icon name="arrow" size={17} />
                      </Button>
                    </div>
                  )}
                </section>
                <section className="arena-section">
                  <div className="section-heading">
                    <h2>The arena awaits</h2>
                    <Icon name="swords" size={20} />
                  </div>
                  <div className="arena-promo">
                    <ArenaArt />
                    <div className="arena-promo-copy">
                      <h3>The training grounds</h3>
                      <p>Challenge a friend locally or outsmart an AI rival.</p>
                      <Button onClick={() => navigate("arena")}>
                        Find a battle
                        <Icon name="arrow" size={17} />
                      </Button>
                      <span className="arena-note">
                        <Icon name="shield" size={13} />
                        No entry fee · All skill levels
                      </span>
                    </div>
                  </div>
                </section>
              </div>
              <div className="roster-quest-grid">
                <section>
                  <div className="section-heading">
                    <h2>Your dragon roster</h2>
                    <a href="#dragons">
                      View collection
                      <Icon name="arrow" size={16} />
                    </a>
                  </div>
                  <div className="home-roster">
                    {game.dragons.slice(0, 2).map((id) => (
                      <DragonCard
                        key={id}
                        id={id}
                        selected={game.selected === id}
                        open={() => setModal({ type: "dragon", dragon: id })}
                      />
                    ))}
                    {game.dragons.length === 1 && (
                      <button
                        className="roster-empty"
                        onClick={() => navigate("hatchery")}
                      >
                        <Icon name="plus" size={23} />
                        <span>
                          Make room for a legend
                          <span>Hatch an egg to grow your roster</span>
                        </span>
                        <Icon name="arrow" size={17} />
                      </button>
                    )}
                  </div>
                </section>
                <section className="quest-section">
                  <div className="section-heading">
                    <h2>A keeper’s first steps</h2>
                    <span className="muted">{questsCompleted} / 2</span>
                  </div>
                  <div className="quest-list">
                    <a href="#hatchery">
                      <span
                        className={`quest-check ${hatches > 0 ? "complete" : ""}`}
                      >
                        {hatches > 0 ? (
                          <Icon name="check" size={14} />
                        ) : (
                          <Icon name="egg" size={14} />
                        )}
                      </span>
                      <span>Hatch your first dragon</span>
                      <span className="muted">
                        {hatches > 0 ? "Complete" : "Begin"}
                      </span>
                    </a>
                    <a href="#arena">
                      <span
                        className={`quest-check ${game.wins > 0 ? "complete" : ""}`}
                      >
                        {game.wins > 0 ? (
                          <Icon name="check" size={14} />
                        ) : (
                          <Icon name="swords" size={14} />
                        )}
                      </span>
                      <span>Win a practice battle</span>
                      <span className="muted">
                        {game.wins > 0 ? "Complete" : "Begin"}
                      </span>
                    </a>
                  </div>
                </section>
              </div>
            </>
          )}

          {view === "hatchery" && (
            <>
              <div className="page-heading">
                <div>
                  <h1 ref={heading} tabIndex={-1}>
                    Every egg, a new legend.
                  </h1>
                  <p>Hatch your starter eggs and discover who’s inside.</p>
                </div>
                <span className="page-heading-icon">
                  <Icon name="egg" size={30} />
                </span>
              </div>
              <div className="collection-toolbar">
                <div
                  className="filter-buttons"
                  role="group"
                  aria-label="Filter eggs by element"
                >
                  {["All eggs", "Nature", "Fire", "Storm"].map((filter) => (
                    <button
                      key={filter}
                      className={`filter-button ${eggFilter === filter ? "active" : ""}`}
                      aria-pressed={eggFilter === filter}
                      onClick={() => setEggFilter(filter)}
                    >
                      {filter}
                      {filter === "All eggs" && <span>{game.eggs.length}</span>}
                    </button>
                  ))}
                </div>
                <span className="muted">Instant hatching · Always free</span>
              </div>
              {filteredEggs.length > 0 ? (
                <div className="egg-grid full-egg-grid">
                  {filteredEggs.map((id) => (
                    <EggCard
                      key={id}
                      id={id}
                      onHatch={(egg) => setModal({ type: "hatch", egg })}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Icon name="egg" size={40} />
                  <h2>
                    {game.eggs.length === 0
                      ? "Your nest is empty."
                      : "No eggs of this element."}
                  </h2>
                  <p>
                    {game.eggs.length === 0
                      ? "All three starter dragons have hatched. Your collection is ready for the arena."
                      : "Choose another element to see the eggs still waiting to hatch."}
                  </p>
                  <Button
                    onClick={() =>
                      game.eggs.length === 0
                        ? navigate("dragons")
                        : setEggFilter("All eggs")
                    }
                  >
                    {game.eggs.length === 0
                      ? "View your dragons"
                      : "Show all eggs"}
                    <Icon name="arrow" size={17} />
                  </Button>
                </div>
              )}
              <div className="info-banner">
                <Icon name="spark" size={24} />
                <div>
                  <h2>Big things start small.</h2>
                  <p>
                    Each starter egg contains a different dragon. No duplicates,
                    no purchases, just your next companion.
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setModal({ type: "help" })}
                >
                  Read the guide
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            </>
          )}

          {view === "dragons" && (
            <>
              <div className="page-heading">
                <div>
                  <h1 ref={heading} tabIndex={-1}>
                    Meet your legends.
                  </h1>
                  <p>
                    {game.dragons.length}{" "}
                    {game.dragons.length === 1 ? "dragon" : "dragons"}. One
                    unforgettable journey. Choose your next champion.
                  </p>
                </div>
                <Button onClick={() => navigate("hatchery")}>
                  <Icon name="egg" size={18} />
                  Visit hatchery
                </Button>
              </div>
              <div className="collection-toolbar dragon-toolbar">
                <div className="search-field">
                  <label htmlFor="dragon-search">
                    <Icon name="search" size={18} />
                    <span className="sr-only">Search dragons</span>
                  </label>
                  <input
                    id="dragon-search"
                    name="dragon-search"
                    type="search"
                    placeholder="Search your dragons"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className="select-field">
                  <label htmlFor="element-filter">Element</label>
                  <select
                    id="element-filter"
                    value={dragonFilter}
                    onChange={(event) => setDragonFilter(event.target.value)}
                  >
                    {["All elements", "Nature", "Fire", "Storm"].map(
                      (element) => (
                        <option key={element}>{element}</option>
                      ),
                    )}
                  </select>
                </div>
              </div>
              {filteredDragons.length > 0 ? (
                <div className="dragon-grid">
                  {filteredDragons.map((id) => (
                    <div className="collection-dragon" key={id}>
                      <div className="collection-dragon-art">
                        <DragonArt element={DRAGONS[id].element} />
                        <span
                          className={`rarity ${DRAGONS[id].rarity.toLowerCase()}`}
                        >
                          {DRAGONS[id].rarity}
                        </span>
                      </div>
                      <DragonCard
                        id={id}
                        selected={game.selected === id}
                        open={() => setModal({ type: "dragon", dragon: id })}
                      />
                      <div className="dragon-stats">
                        <span>
                          <Icon name="heart" size={16} />
                          {DRAGONS[id].hp} HP
                        </span>
                        <span>
                          <Icon name="swords" size={16} />
                          {DRAGONS[id].attack} attack
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Icon name="search" size={36} />
                  <h2>No dragons found.</h2>
                  <p>No dragon matches your search and element filter.</p>
                  <Button
                    onClick={() => {
                      setSearch("");
                      setDragonFilter("All elements");
                    }}
                  >
                    Clear filters
                    <Icon name="reset" size={17} />
                  </Button>
                </div>
              )}
            </>
          )}

          {view === "arena" && (
            <>
              <div className="page-heading">
                <div>
                  <h1 ref={heading} tabIndex={-1}>
                    Your dragon. Your strategy.
                  </h1>
                  <p>Challenge an AI rival or duel a friend on this device.</p>
                </div>
                <span className="practice-badge">
                  <Icon name="shield" size={16} />
                  Practice arena
                </span>
              </div>
              {!battle && !duel && (
                <div
                  className="arena-modes filter-buttons"
                  role="group"
                  aria-label="Battle mode"
                >
                  <button
                    className={`filter-button ${mode === "ai" ? "active" : ""}`}
                    aria-pressed={mode === "ai"}
                    onClick={() => setMode("ai")}
                  >
                    <Icon name="shield" size={17} />
                    AI practice
                  </button>
                  <button
                    className={`filter-button ${mode === "local" ? "active" : ""}`}
                    aria-pressed={mode === "local"}
                    onClick={() => setMode("local")}
                  >
                    <Icon name="swords" size={17} />
                    Local PvP
                  </button>
                </div>
              )}
              {duel ? (
                <DuelBoard
                  duel={duel}
                  onMove={(move) =>
                    setDuel((d) => (d ? playDuelMove(d, move) : d))
                  }
                  onAgain={() => setDuel(startDuel(game.selected, rival))}
                  onClose={() => setDuel(null)}
                />
              ) : battle ? (
                <BattleBoard
                  battle={battle}
                  onMove={executeMove}
                  onAgain={beginBattle}
                  onClose={() => setBattle(null)}
                />
              ) : (
                <div className="arena-setup">
                  <section className="arena-choose">
                    <h2>
                      {mode === "local"
                        ? "Player 1: choose your dragon"
                        : "Choose your champion"}
                    </h2>
                    <p className="muted">
                      {mode === "local"
                        ? "Both players use your local dragon collection."
                        : "Select a dragon to take into battle."}
                    </p>
                    <div
                      className="champion-options"
                      role="radiogroup"
                      aria-label="Choose your battle dragon"
                    >
                      {game.dragons.map((id) => (
                        <label
                          className={`champion-option ${game.selected === id ? "selected" : ""}`}
                          key={id}
                        >
                          <input
                            type="radio"
                            name="champion"
                            checked={game.selected === id}
                            onChange={() =>
                              setGame((g) => ({ ...g, selected: id }))
                            }
                          />
                          <DragonArt element={DRAGONS[id].element} />
                          <span>
                            <span className="dragon-name">
                              {DRAGONS[id].name}
                            </span>
                            <span className="muted">
                              {DRAGONS[id].element} · {DRAGONS[id].hp} HP ·{" "}
                              {DRAGONS[id].attack} attack
                            </span>
                          </span>
                          <span className="radio-indicator">
                            {game.selected === id && <span />}
                          </span>
                        </label>
                      ))}
                    </div>
                    <a className="inline-link" href="#hatchery">
                      <Icon name="egg" size={17} />
                      Hatch more dragons
                      <Icon name="arrow" size={16} />
                    </a>
                  </section>
                  <section className="arena-entry">
                    <ArenaArt />
                    <div className="arena-entry-copy">
                      <h2>
                        {mode === "local"
                          ? "A duel between keepers"
                          : "The training grounds"}
                      </h2>
                      <p className="muted">
                        {mode === "local"
                          ? "Two players. One device. Your arena."
                          : "A safe place to find your fire."}
                      </p>
                      {mode === "local" ? (
                        <div className="local-rival-field">
                          <label className="field-label" htmlFor="rival-dragon">
                            Player 2: choose your dragon
                          </label>
                          <select
                            id="rival-dragon"
                            value={rival}
                            onChange={(event) =>
                              setRival(event.target.value as DragonId)
                            }
                          >
                            {game.dragons.map((id) => (
                              <option value={id} key={id}>
                                {DRAGONS[id].name} · {DRAGONS[id].element}
                              </option>
                            ))}
                          </select>
                          <p className="field-hint">
                            Take turns using the same device. Mirror matches are
                            welcome.
                          </p>
                        </div>
                      ) : (
                        <fieldset className="difficulty-field">
                          <legend>Choose difficulty</legend>
                          <div>
                            {(["scout", "veteran"] as Difficulty[]).map(
                              (level) => (
                                <label
                                  className={
                                    difficulty === level ? "active" : ""
                                  }
                                  key={level}
                                >
                                  <input
                                    type="radio"
                                    name="difficulty"
                                    value={level}
                                    checked={difficulty === level}
                                    onChange={() => setDifficulty(level)}
                                  />
                                  {level === "scout" ? "Scout" : "Veteran"}
                                  <span>
                                    {level === "scout"
                                      ? "Learn the ropes"
                                      : "Test your strategy"}
                                  </span>
                                </label>
                              ),
                            )}
                          </div>
                        </fieldset>
                      )}
                      <Button
                        variant="primary"
                        onClick={() =>
                          mode === "local"
                            ? setDuel(startDuel(game.selected, rival))
                            : beginBattle()
                        }
                      >
                        <Icon name="swords" size={18} />
                        {mode === "local" ? "Start local duel" : "Start battle"}
                        <Icon name="arrow" size={18} />
                      </Button>
                      <span className="arena-note">
                        Free entry · Full health every battle
                      </span>
                    </div>
                  </section>
                </div>
              )}
              <div className="arena-disclosure">
                <Icon name="help" size={17} />
                <p>
                  AI practice and local two-player duels. Online matchmaking is
                  not connected.
                </p>
                <button
                  className="text-button"
                  onClick={() => setModal({ type: "help" })}
                >
                  Battle tips
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            </>
          )}

          <footer className="footer">
            <span>
              <BrandMark small />A little egg. A legendary journey.
            </span>
            <span>
              {warning ? "Progress on this tab only" : "Saved on this device"}
              <span className="dot-divider">·</span>
              <button onClick={() => setModal({ type: "help" })}>
                Keeper’s guide
                <Icon name="arrow" size={14} />
              </button>
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <a
            key={item.view}
            href={`#${item.view}`}
            className={view === item.view ? "active" : ""}
            aria-current={view === item.view ? "page" : undefined}
          >
            <Icon name={item.icon} size={21} />
            <span>
              {item.view === "dragons"
                ? "Dragons"
                : item.view === "arena"
                  ? "Arena"
                  : item.label}
            </span>
          </a>
        ))}
      </nav>
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {status}
      </div>
      {modal && (
        <Modal
          key={modal.type}
          title={
            modal.type === "help"
              ? "The keeper’s guide"
              : modal.type === "profile"
                ? "Your keeper profile"
                : modal.type === "reset"
                  ? "Start a new journey?"
                  : modal.type === "hatch"
                    ? "A legend is waiting."
                    : modal.type === "reveal"
                      ? "A new legend awakens."
                      : DRAGONS[modal.dragon].name
          }
          close={() => setModal(null)}
          wide={modal.type === "help"}
        >
          {modal.type === "help" && <HelpContent />}
          {modal.type === "profile" && (
            <ProfileForm
              game={game}
              save={(name) => {
                setGame((g) => ({ ...g, name }));
                setModal(null);
                announce("Your keeper name has been saved.");
              }}
              showReset={() => setModal({ type: "reset" })}
              announce={announce}
            />
          )}
          {modal.type === "reset" && (
            <>
              <p className="modal-description">
                This removes your dragons, battle results, and keeper name from
                this browser. You’ll start again with Ashwing and three eggs.
                This cannot be undone.
              </p>
              <div className="button-row">
                <Button onClick={() => setModal({ type: "profile" })}>
                  Keep my progress
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setGame(newGame());
                    setBattle(null);
                    setDuel(null);
                    setRival("ashwing");
                    setModal(null);
                    navigate("overview");
                    setSearch("");
                    setEggFilter("All eggs");
                    setDragonFilter("All elements");
                    announce(
                      "A new journey has begun. Your progress was reset.",
                    );
                  }}
                >
                  Reset my progress
                </Button>
              </div>
            </>
          )}
          {modal.type === "hatch" && (
            <div className="hatch-dialog">
              <EggArt element={EGGS[modal.egg].element} large />
              <h3>{EGGS[modal.egg].name}</h3>
              <span
                className={`element-label ${EGGS[modal.egg].element.toLowerCase()}`}
              >
                <Icon name={elementIcon(EGGS[modal.egg].element)} size={16} />
                {EGGS[modal.egg].element} · {EGGS[modal.egg].rarity}
              </span>
              <p>
                Your new companion is ready to meet you.
                <br />
                Hatching is instant and free.
              </p>
              <Button variant="primary" onClick={() => doHatch(modal.egg)}>
                <Icon name="spark" size={18} />
                Hatch {EGGS[modal.egg].name.toLowerCase()}
              </Button>
            </div>
          )}
          {(modal.type === "reveal" || modal.type === "dragon") && (
            <div className="dragon-dialog">
              <DragonArt element={DRAGONS[modal.dragon].element} />
              <h3>
                {modal.type === "reveal"
                  ? `${DRAGONS[modal.dragon].name} has awakened.`
                  : DRAGONS[modal.dragon].name}
              </h3>
              <span
                className={`element-label ${DRAGONS[modal.dragon].element.toLowerCase()}`}
              >
                <Icon
                  name={elementIcon(DRAGONS[modal.dragon].element)}
                  size={16}
                />
                {DRAGONS[modal.dragon].element} · {DRAGONS[modal.dragon].rarity}
              </span>
              <p>{DRAGONS[modal.dragon].description}</p>
              <div className="detail-stats">
                <div>
                  <Icon name="heart" size={19} />
                  <span>{DRAGONS[modal.dragon].hp}</span>
                  <span>Health</span>
                </div>
                <div>
                  <Icon name="swords" size={19} />
                  <span>{DRAGONS[modal.dragon].attack}</span>
                  <span>Attack</span>
                </div>
                <div>
                  <Icon name="bolt" size={19} />
                  <span>{DRAGONS[modal.dragon].power}</span>
                  <span>Power</span>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => selectDragon(modal.dragon)}
              >
                Select for battle
                <Icon name="swords" size={18} />
              </Button>
              {modal.type === "reveal" && (
                <Button
                  variant="quiet"
                  onClick={() => {
                    setModal(null);
                    navigate("dragons");
                  }}
                >
                  View collection
                  <Icon name="arrow" size={17} />
                </Button>
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
