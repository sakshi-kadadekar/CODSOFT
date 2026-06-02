import type { CaptionRequest, CaptionResponse } from "@/types/caption.types";

const SAMPLE_CAPTIONS = [
  "a person standing on a rocky cliff overlooking the ocean at sunset",
  "a small brown dog playing with a red ball on green grass",
  "a busy city street with cars and pedestrians during rush hour",
  "a plate of pasta with tomato sauce and fresh basil leaves",
  "a snow-covered mountain peak under a clear blue sky",
];

function generateAttentionGrid(size = 7): number[][] {
  const cx = Math.random() * size;
  const cy = Math.random() * size;
  const grid: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy);
      row.push(Math.max(0, 1 - d / size + (Math.random() - 0.5) * 0.2));
    }
    grid.push(row);
  }
  return grid;
}

export async function mockCaption(req: CaptionRequest): Promise<CaptionResponse> {
  const delay = 900 + Math.random() * 800;
  await new Promise((r) => setTimeout(r, delay));
  const caption = SAMPLE_CAPTIONS[Math.floor(Math.random() * SAMPLE_CAPTIONS.length)];
  const tempBoost = Math.min(0.15, req.temperature * 0.05);
  return {
    caption,
    confidence: Math.min(0.99, 0.72 + Math.random() * 0.2 + tempBoost),
    attention_map: req.model === "vit" ? generateAttentionGrid(7) : undefined,
  };
}
