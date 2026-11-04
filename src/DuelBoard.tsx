import { DragonArt } from "./art";
import { Icon } from "./icons";
import { DRAGONS, type Duel, type Move } from "./game";

export default function DuelBoard({
  duel,
  onMove,
  onAgain,
  onClose,
}: {
  duel: Duel;
  onMove: (move: Move) => void;
  onAgain: () => void;
  onClose: () => void;
}) {
  return (
    <section
      className="battle-board duel-board"
      aria-label="Two-player local duel"
    >
      <div className="battle-heading">
        <span>
          <Icon name="swords" />
          Local PvP duel
        </span>
        <span className="muted">One device · Turn {duel.turn}</span>
      </div>
      <div className="fighters">
        {([0, 1] as const).map((player) => (
          <div
            className={`fighter ${duel.active === player && duel.winner === null ? "active-fighter" : ""}`}
            key={player}
          >
            <div className="fighter-name">
              <h2>{DRAGONS[duel.dragons[player]].name}</h2>
              <span>
                Player {player + 1}
                {duel.guarded[player] ? " · Guarding" : ""}
              </span>
            </div>
            <DragonArt element={DRAGONS[duel.dragons[player]].element} />
            <div className="health-block">
              <div className="health-label">
                <span>
                  <Icon name="heart" size={14} />
                  Health
                </span>
                <span>
                  {duel.hp[player]} / {DRAGONS[duel.dragons[player]].hp}
                </span>
              </div>
              <div
                className={`health-track ${player === 1 ? "rival" : ""}`}
                role="progressbar"
                aria-label={`Player ${player + 1} health`}
                aria-valuenow={duel.hp[player]}
                aria-valuemin={0}
                aria-valuemax={DRAGONS[duel.dragons[player]].hp}
              >
                <span
                  style={{
                    width: `${(duel.hp[player] / DRAGONS[duel.dragons[player]].hp) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {duel.winner === null ? (
        <div className="battle-controls">
          <div className="duel-turn" role="status">
            <Icon name="user" size={20} />
            <div>
              <h3>Player {duel.active + 1}, your move.</h3>
              <p>
                Pass the device to Player {duel.active + 1}, then choose an
                action.
              </p>
            </div>
            <span className="charge">
              <Icon name="bolt" size={15} />
              {duel.charge[duel.active]} / 3
            </span>
          </div>
          <div className="move-buttons">
            <button className="button primary" onClick={() => onMove("strike")}>
              <Icon name="swords" />
              Strike<span>Deal damage</span>
            </button>
            <button
              className="button secondary"
              onClick={() => onMove("guard")}
            >
              <Icon name="shield" />
              Guard<span>Block 70% of next hit</span>
            </button>
            <button
              className="button secondary"
              onClick={() => onMove("burst")}
              disabled={duel.charge[duel.active] < 3}
            >
              <Icon name="bolt" />
              Elemental burst
              <span>
                {duel.charge[duel.active] < 3
                  ? "Needs 3 charge"
                  : "Unleash 2.25× attack"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="battle-result" role="status">
          <Icon name="trophy" size={32} />
          <h2>Player {duel.winner + 1} conquers the arena.</h2>
          <p>
            {DRAGONS[duel.dragons[duel.winner]].name} wins this duel. Local
            duels do not change practice XP.
          </p>
          <div className="button-row">
            <button className="button primary" onClick={onAgain}>
              Start rematch
              <Icon name="swords" size={18} />
            </button>
            <button className="button secondary" onClick={onClose}>
              Choose dragons
            </button>
          </div>
        </div>
      )}
      <div
        className="battle-log"
        role="log"
        aria-label="Duel log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <h3>Duel log</h3>
        <ol>
          {duel.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
