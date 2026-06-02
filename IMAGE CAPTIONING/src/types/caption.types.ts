export type ModelId = "resnet50" | "vgg16" | "vit";

export interface CaptionRequest {
  imageBase64: string;
  model: ModelId;
  beamWidth: number;
  maxLength: number;
  temperature: number;
}

export interface CaptionResponse {
  caption: string;
  confidence: number;
  attention_map?: number[][];
}

export interface HistoryEntry {
  id: string;
  imageUrl: string;
  caption: string;
  confidence: number;
  model: ModelId;
  timestamp: number;
  attention_map?: number[][];
}

export interface ModelInfo {
  id: ModelId;
  name: string;
  description: string;
  supportsAttention: boolean;
}

export const MODELS: ModelInfo[] = [
  { id: "resnet50", name: "ResNet-50", description: "Fast CNN backbone — balanced speed and accuracy.", supportsAttention: false },
  { id: "vgg16", name: "VGG-16", description: "Classic CNN — slower, deeper feature maps.", supportsAttention: false },
  { id: "vit", name: "ViT", description: "Vision Transformer — highest accuracy, exposes attention.", supportsAttention: true },
];
