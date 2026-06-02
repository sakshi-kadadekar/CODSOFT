import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { tag: string; value: number }[];
}

export function TasteRadar({ data }: Props) {
  if (data.length < 3) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
        Like a few more items to see your taste profile.
      </div>
    );
  }
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="tag"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 9 }}
            stroke="var(--color-border)"
          />
          <Radar
            name="Affinity"
            dataKey="value"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
