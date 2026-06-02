import { useCallback, useState } from "react";
import { generateCaption } from "@/api/captionApi";
import type { HistoryEntry, ModelId } from "@/types/caption.types";

export interface GenerationSettings {
  beamWidth: number;
  maxLength: number;
  temperature: number;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useCaptionSession() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [current, setCurrent] = useState<HistoryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (file: File, imageUrl: string, model: ModelId, settings: GenerationSettings) => {
      setIsLoading(true);
      setError(null);
      try {
        const base64 = await fileToBase64(file);
        const res = await generateCaption({
          imageBase64: base64,
          model,
          ...settings,
        });
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          imageUrl,
          caption: res.caption,
          confidence: res.confidence,
          model,
          timestamp: Date.now(),
          attention_map: res.attention_map,
        };
        setCurrent(entry);
        setHistory((h) => [entry, ...h]);
        return entry;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate caption");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const selectFromHistory = useCallback((entry: HistoryEntry) => {
    setCurrent(entry);
  }, []);

  return { history, current, isLoading, error, generate, selectFromHistory };
}
