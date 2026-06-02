interface Props {
  imageUrl: string;
  grid: number[][];
  show: boolean;
}

function heatColor(v: number): string {
  // viridis-ish: dark violet -> cyan
  const c = Math.max(0, Math.min(1, v));
  const r = Math.round(68 + (33 - 68) * c);
  const g = Math.round(1 + (200 - 1) * c);
  const b = Math.round(84 + (220 - 84) * c);
  return `rgba(${r}, ${g}, ${b}, ${0.15 + c * 0.55})`;
}

export function AttentionMap({ imageUrl, grid, show }: Props) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      <img src={imageUrl} alt="attention base" className="block w-full" />
      {show && rows > 0 && (
        <div
          className="pointer-events-none absolute inset-0 grid"
          style={{
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {grid.flatMap((row, y) =>
            row.map((v, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  background: heatColor(v),
                  mixBlendMode: "screen",
                }}
              />
            )),
          )}
        </div>
      )}
    </div>
  );
}
