/**
 * OpenLiL AI — Model Configuration
 * All models < 1B params, GGUF Q4_K_M format, run via llama.rn
 */

export interface ModelInfo {
  id: string;
  name: string;
  shortName: string;
  params: string;
  url: string;
  size: string;
  sizeBytes: number;
  chatTemplate: 'chatml' | 'llama3';
}

export const MODELS: ModelInfo[] = [
  {
    id: 'smollm2-360m',
    name: 'SmolLM2 360M Instruct',
    shortName: 'SmolLM 360M',
    params: '360M',
    url: 'https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-Q4_K_M.gguf',
    size: '250 MB',
    sizeBytes: 250_000_000,
    chatTemplate: 'chatml',
  },
  {
    id: 'qwen2.5-0.5b',
    name: 'Qwen 2.5 0.5B Instruct',
    shortName: 'Qwen 0.5B',
    params: '0.5B',
    url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
    size: '400 MB',
    sizeBytes: 400_000_000,
    chatTemplate: 'chatml',
  },
  {
    id: 'qwen2.5-1b',
    name: 'Qwen 2.5 1B Instruct',
    shortName: 'Qwen 1B',
    params: '1B',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    size: '700 MB',
    sizeBytes: 700_000_000,
    chatTemplate: 'chatml',
  },
  {
    id: 'llama-3.2-1b',
    name: 'Llama 3.2 1B Instruct',
    shortName: 'Llama 1B',
    params: '1B',
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    size: '750 MB',
    sizeBytes: 750_000_000,
    chatTemplate: 'llama3',
  },
];

export const DEFAULT_MODEL = MODELS[1]; // Qwen 0.5B
