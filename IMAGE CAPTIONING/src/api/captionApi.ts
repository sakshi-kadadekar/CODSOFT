import axios from "axios";
import type { CaptionRequest, CaptionResponse } from "@/types/caption.types";
import { mockCaption } from "./mockApi";

const USE_MOCK = true;
const API_URL = "/api/caption";

export async function generateCaption(req: CaptionRequest): Promise<CaptionResponse> {
  if (USE_MOCK) return mockCaption(req);
  const { data } = await axios.post<CaptionResponse>(API_URL, {
    image: req.imageBase64,
    model: req.model,
    beam_width: req.beamWidth,
    max_length: req.maxLength,
    temperature: req.temperature,
  });
  return data;
}
