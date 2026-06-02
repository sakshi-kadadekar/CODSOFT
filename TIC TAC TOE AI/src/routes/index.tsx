import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neon Tic-Tac-Toe — VS AI" },
      { name: "description", content: "A cinematic, dark-themed Tic-Tac-Toe with glowing neon visuals and an unbeatable AI." },
      { property: "og:title", content: "Neon Tic-Tac-Toe — VS AI" },
      { property: "og:description", content: "Cinematic neon Tic-Tac-Toe vs AI. Easy, Hard, or Unbeatable." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@400;500;600&display=swap" },
    ],
  }),
  component: Index,
});

type Cell = "X" | "O" | null;
type Difficulty = "Easy" | "Hard" | "Unbeatable";
type Score = { wins: number; losses: number; draws: number };

const LINES: [number, number, number][] = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(b: Cell[]): { winner: Cell; line: number[] | null } {
  for (const [a,b1,c] of LINES) {
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return { winner: b[a], line: [a,b1,c] };
  }
  return { winner: null, line: null };
}
const isFull = (b: Cell[]) => b.every(Boolean);

function minimax(b: Cell[], player: "X" | "O"): { score: number; move: number } {
  const { winner } = checkWinner(b);
  if (winner === "O") return { score: 10, move: -1 };
  if (winner === "X") return { score: -10, move: -1 };
  if (isFull(b)) return { score: 0, move: -1 };

  let best = player === "O" ? { score: -Infinity, move: -1 } : { score: Infinity, move: -1 };
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = player;
    const { score } = minimax(b, player === "O" ? "X" : "O");
    b[i] = null;
    if (player === "O" ? score > best.score : score < best.score) best = { score, move: i };
  }
  return best;
}

function pickMove(board: Cell[], difficulty: Difficulty): number {
  const empty = board.map((c,i) => c ? -1 : i).filter(i => i >= 0);
  if (empty.length === 0) return -1;

  if (difficulty === "Easy") return empty[Math.floor(Math.random() * empty.length)];

  if (difficulty === "Hard") {
    // Try to win
    for (const i of empty) { const b=[...board]; b[i]="O"; if (checkWinner(b).winner==="O") return i; }
    // Block
    for (const i of empty) { const b=[...board]; b[i]="X"; if (checkWinner(b).winner==="X") return i; }
    // 70% optimal, 30% random
    if (Math.random() < 0.7) return minimax([...board], "O").move;
    return empty[Math.floor(Math.random() * empty.length)];
  }
  return minimax([...board], "O").move;
}

const SCORE_KEY = "neon-ttt-score-v1";
const DIFF_KEY = "neon-ttt-difficulty-v1";

function Index() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X"); // X = player, O = AI
  const [thinking, setThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("Hard");
  const [score, setScore] = useState<Score>({ wins: 0, losses: 0, draws: 0 });
  const [resetKey, setResetKey] = useState(0);
  const [sparks, setSparks] = useState<{ id: number; cell: number; x: number; y: number }[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  const { winner, line } = useMemo(() => checkWinner(board), [board]);
  const draw = !winner && isFull(board);
  const gameOver = !!winner || draw;

  // Load persisted state
  useEffect(() => {
    try {
      const s = localStorage.getItem(SCORE_KEY);
      if (s) setScore(JSON.parse(s));
      const d = localStorage.getItem(DIFF_KEY) as Difficulty | null;
      if (d === "Easy" || d === "Hard" || d === "Unbeatable") setDifficulty(d);
    } catch {}
  }, []);

  // Persist score
  useEffect(() => {
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(score)); } catch {}
  }, [score]);
  useEffect(() => {
    try { localStorage.setItem(DIFF_KEY, difficulty); } catch {}
  }, [difficulty]);

  // Update score on game end + emit sparks
  const scoredRef = useRef(false);
  useEffect(() => {
    if (!gameOver) { scoredRef.current = false; return; }
    if (scoredRef.current) return;
    scoredRef.current = true;
    setScore(s => ({
      wins: s.wins + (winner === "X" ? 1 : 0),
      losses: s.losses + (winner === "O" ? 1 : 0),
      draws: s.draws + (draw ? 1 : 0),
    }));
    if (winner && line) emitSparks(line);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  // AI move
  useEffect(() => {
    if (gameOver || turn !== "O") return;
    setThinking(true);
    const t = setTimeout(() => {
      setBoard(prev => {
        if (checkWinner(prev).winner || isFull(prev)) return prev;
        const move = pickMove(prev, difficulty);
        if (move < 0) return prev;
        const next = [...prev];
        next[move] = "O";
        return next;
      });
      setTurn("X");
      setThinking(false);
    }, 650);
    return () => { clearTimeout(t); setThinking(false); };
  }, [turn, gameOver, difficulty]);

  const handleCell = useCallback((i: number) => {
    if (gameOver || thinking || board[i] || turn !== "X") return;
    const next = [...board];
    next[i] = "X";
    setBoard(next);
    setTurn("O");
  }, [board, gameOver, thinking, turn]);

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setThinking(false);
    setResetKey(k => k + 1);
    setSparks([]);
  }, []);

  const resetScore = () => setScore({ wins: 0, losses: 0, draws: 0 });

  function emitSparks(cells: number[]) {
    const grid = gridRef.current;
    if (!grid) return;
    const gRect = grid.getBoundingClientRect();
    const next: typeof sparks = [];
    let id = Date.now();
    cells.forEach(idx => {
      const cellEl = grid.querySelector<HTMLElement>(`[data-cell="${idx}"]`);
      if (!cellEl) return;
      const r = cellEl.getBoundingClientRect();
      const cx = r.left - gRect.left + r.width / 2;
      const cy = r.top - gRect.top + r.height / 2;
      for (let k = 0; k < 14; k++) {
        next.push({ id: id++, cell: idx, x: cx, y: cy });
      }
    });
    setSparks(next);
    setTimeout(() => setSparks([]), 1100);
  }

  const statusText = winner === "X" ? "You Win!"
    : winner === "O" ? "AI Wins!"
    : draw ? "Draw!"
    : thinking ? "AI Thinking"
    : "Your Turn";

  const statusColor = winner === "X" ? "glow-x"
    : winner === "O" ? "glow-o"
    : draw ? "text-amber-300"
    : "text-foreground";

  const diffOptions: Difficulty[] = ["Easy", "Hard", "Unbeatable"];

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, #00BFFF, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(circle, #FF4F58, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative w-full max-w-5xl grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Game */}
        <section className="panel scanline relative rounded-2xl p-6 sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display title-glow text-3xl sm:text-4xl font-black tracking-widest">
                <span className="glow-x">VS</span>{" "}
                <span className="glow-o">AI</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 tracking-wide uppercase">Neon Tic-Tac-Toe</p>
            </div>
            <div className="flex gap-2">
              {diffOptions.map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); reset(); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider transition
                    ${difficulty === d
                      ? "neon-badge text-foreground"
                      : "border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </header>

          {/* Status bar */}
          <div className="mb-6 flex items-center justify-center">
            <div key={statusText} className="animate-wipe panel rounded-xl px-6 py-3 min-w-[220px] text-center">
              <p className={`font-display font-bold text-lg sm:text-xl tracking-widest uppercase ${statusColor}`}>
                {statusText}
                {thinking && !gameOver && (
                  <span className="dot-pulse ml-2 inline-flex gap-1 align-middle">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Grid */}
          <div ref={gridRef} className="relative mx-auto aspect-square w-full max-w-md">
            <div key={resetKey} className="grid grid-cols-3 gap-3 sm:gap-4 h-full w-full animate-wipe">
              {board.map((v, i) => {
                const isWin = line?.includes(i);
                return (
                  <button
                    key={i}
                    data-cell={i}
                    onClick={() => handleCell(i)}
                    disabled={!!v || gameOver || thinking || turn !== "X"}
                    className={`cell-base ${isWin ? "cell-win" : ""} rounded-xl flex items-center justify-center text-5xl sm:text-7xl font-display font-black select-none disabled:cursor-not-allowed`}
                    aria-label={`Cell ${i+1}${v ? `, ${v}` : ", empty"}`}
                  >
                    {v && (
                      <span className={`animate-symbol ${v === "X" ? "glow-x" : "glow-o"}`}>
                        {v}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sparks overlay */}
            <div className="pointer-events-none absolute inset-0">
              {sparks.map((s, idx) => {
                const angle = (idx * 47) % 360;
                const dist = 60 + (idx % 5) * 18;
                const tx = Math.cos(angle * Math.PI/180) * dist;
                const ty = Math.sin(angle * Math.PI/180) * dist;
                const color = idx % 2 ? "var(--neon-x)" : "var(--neon-o)";
                return (
                  <span
                    key={s.id}
                    className="spark"
                    style={{
                      left: s.x, top: s.y,
                      background: color,
                      boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
                      ["--tx" as never]: `${tx}px`,
                      ["--ty" as never]: `${ty}px`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button onClick={reset} className="btn-neon font-display font-bold uppercase tracking-widest px-8 py-3 rounded-full text-sm">
              {gameOver ? "Play Again" : "Restart"}
            </button>
          </div>
        </section>

        {/* Right: Scoreboard */}
        <aside className="panel rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="font-display font-bold tracking-widest text-sm uppercase text-muted-foreground">Scoreboard</h2>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <ScoreTile label="Wins" value={score.wins} accent="glow-x" />
            <ScoreTile label="Losses" value={score.losses} accent="glow-o" />
            <ScoreTile label="Draws" value={score.draws} accent="text-amber-300" />
          </div>

          <div className="mt-auto space-y-3">
            <div className="text-xs text-muted-foreground font-display tracking-widest uppercase">
              Difficulty
              <div className="mt-2 neon-badge inline-block px-3 py-1 rounded-full text-foreground font-bold">
                {difficulty}
              </div>
            </div>
            <button
              onClick={resetScore}
              className="w-full text-xs font-display font-bold uppercase tracking-widest py-2 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition"
            >
              Reset Score
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ScoreTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-center">
      <div className={`font-display text-3xl font-black ${accent}`}>{value}</div>
      <div className="mt-1 text-[10px] font-display tracking-widest uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
