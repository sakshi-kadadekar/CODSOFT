import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import type { GenerationSettings } from "@/hooks/useCaptionSession";

interface Props {
  settings: GenerationSettings;
  onChange: (s: GenerationSettings) => void;
}

function Row({ label, value, fmt, children }: { label: string; value: number; fmt?: (v: number) => string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-mono text-xs text-foreground">{fmt ? fmt(value) : value}</span>
      </div>
      {children}
    </div>
  );
}

export function SettingsDrawer({ settings, onChange }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
          <Settings2 className="h-3.5 w-3.5" />
          beam search
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[360px] sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-mono">generation_params</SheetTitle>
          <SheetDescription className="font-mono text-xs">
            tune decoding behavior for the next inference
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 py-6">
          <Row label="beam_width" value={settings.beamWidth}>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[settings.beamWidth]}
              onValueChange={([v]) => onChange({ ...settings, beamWidth: v })}
            />
          </Row>
          <Row label="max_length" value={settings.maxLength}>
            <Slider
              min={10}
              max={50}
              step={1}
              value={[settings.maxLength]}
              onValueChange={([v]) => onChange({ ...settings, maxLength: v })}
            />
          </Row>
          <Row label="temperature" value={settings.temperature} fmt={(v) => v.toFixed(2)}>
            <Slider
              min={0.1}
              max={2}
              step={0.05}
              value={[settings.temperature]}
              onValueChange={([v]) => onChange({ ...settings, temperature: v })}
            />
          </Row>
        </div>
      </SheetContent>
    </Sheet>
  );
}
