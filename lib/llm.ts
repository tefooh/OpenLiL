/**
 * OpenLiL AI — LLM Wrapper
 * Wraps llama.rn for model download, load, inference, and stop.
 * All inference is 100% on-device.
 *
 * ⚠️  llama.rn requires a DEVELOPMENT BUILD (expo-dev-client).
 *     It will NOT work in Expo Go because it needs native C++ code.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { ModelInfo } from './modelConfig';

// Lazy-import llama.rn — may crash in Expo Go
let llamaModule: typeof import('llama.rn') | null = null;
let llamaLoadError: string | null = null;

try {
  llamaModule = require('llama.rn');
} catch (e) {
  llamaLoadError = e instanceof Error ? e.message : String(e);
  console.error('[LLM] Failed to load llama.rn native module:', llamaLoadError);
}

type LlamaContext = any; // avoid import crash

const MODEL_DIR = `${FileSystem.documentDirectory}models/`;

let activeContext: LlamaContext | null = null;

/**
 * Check if llama.rn native module is available
 */
export function isNativeModuleAvailable(): boolean {
  return llamaModule !== null && llamaLoadError === null;
}

export function getNativeModuleError(): string {
  return llamaLoadError || 'llama.rn requires a development build (expo-dev-client). It cannot run in Expo Go.';
}

/**
 * Ensure models directory exists
 */
async function ensureModelDir(): Promise<void> {
  console.log('[LLM] ensureModelDir: MODEL_DIR =', MODEL_DIR);
  const info = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!info.exists) {
    console.log('[LLM] Creating models directory...');
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }
}

/**
 * Get local path for a model
 */
export function getModelPath(model: ModelInfo): string {
  return `${MODEL_DIR}${model.id}.gguf`;
}

/**
 * Check if model is already downloaded
 */
export async function isModelDownloaded(model: ModelInfo): Promise<boolean> {
  try {
    const path = getModelPath(model);
    const info = await FileSystem.getInfoAsync(path);
    console.log('[LLM] isModelDownloaded:', model.id, '| exists:', info.exists, '| size:', (info as any).size);
    if (!info.exists) return false;
    const size = (info as any).size;
    if (size && size < 1_000_000) {
      console.warn('[LLM] Model file too small:', size);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[LLM] isModelDownloaded error:', error);
    return false;
  }
}

/**
 * Download a model with progress callback
 */
export async function downloadModel(
  model: ModelInfo,
  onProgress: (progress: number) => void,
): Promise<string> {
  console.log('[LLM] ===== DOWNLOAD START =====');
  console.log('[LLM] Model:', model.id, '| URL:', model.url);

  await ensureModelDir();
  const path = getModelPath(model);

  // Delete any existing partial download
  const existingInfo = await FileSystem.getInfoAsync(path);
  if (existingInfo.exists) {
    console.log('[LLM] Deleting existing file...');
    await FileSystem.deleteAsync(path, { idempotent: true });
  }

  onProgress(0.01);

  console.log('[LLM] Starting download to:', path);

  const downloadResumable = FileSystem.createDownloadResumable(
    model.url,
    path,
    { headers: { 'User-Agent': 'OpenLiL-AI/1.0' } },
    (downloadProgress) => {
      if (downloadProgress.totalBytesExpectedToWrite > 0) {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        onProgress(Math.max(0.01, Math.min(0.99, progress)));
      }
    },
  );

  try {
    const result = await downloadResumable.downloadAsync();
    console.log('[LLM] Download result:', JSON.stringify(result));

    if (!result || !result.uri) {
      throw new Error('Download returned null/no URI');
    }

    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    console.log('[LLM] Downloaded file:', JSON.stringify(fileInfo));

    if (!fileInfo.exists) {
      throw new Error('File does not exist after download');
    }

    console.log('[LLM] ===== DOWNLOAD SUCCESS =====');
    onProgress(1);
    return result.uri;
  } catch (error) {
    console.error('[LLM] ===== DOWNLOAD FAILED =====', error);
    throw error;
  }
}

/**
 * Delete a downloaded model
 */
export async function deleteModel(model: ModelInfo): Promise<void> {
  const path = getModelPath(model);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
    console.log('[LLM] Deleted model:', model.id);
  }
}

/**
 * Load a model into memory via llama.rn
 * ⚠️  Will fail in Expo Go — requires development build
 */
export async function loadModel(
  model: ModelInfo,
  onProgress?: (progress: number) => void,
): Promise<LlamaContext> {
  console.log('[LLM] ===== LOAD MODEL START =====');

  if (!llamaModule) {
    const errMsg = 'llama.rn native module not available.\n\nYou need a development build (expo-dev-client) to run AI models. Expo Go does not support native C++ modules.\n\nRun: npx expo run:ios or npx expo run:android';
    console.error('[LLM]', errMsg);
    throw new Error(errMsg);
  }

  // Release previous context
  if (activeContext) {
    console.log('[LLM] Releasing previous context...');
    await releaseModel();
  }

  const path = getModelPath(model);
  const fileInfo = await FileSystem.getInfoAsync(path);
  console.log('[LLM] File check:', JSON.stringify(fileInfo));

  if (!fileInfo.exists) {
    throw new Error(`Model file not found at: ${path}`);
  }

  const rawPath = path.replace('file://', '');
  console.log('[LLM] Raw path:', rawPath);

  try {
    const context = await llamaModule.initLlama(
      {
        model: rawPath,
        n_ctx: 2048,
        n_batch: 512,
        n_threads: 4,
        use_mlock: true,
        use_mmap: true,
        use_progress_callback: !!onProgress,
      },
      onProgress,
    );
    console.log('[LLM] ===== LOAD MODEL SUCCESS =====');
    activeContext = context;
    return context;
  } catch (error) {
    console.error('[LLM] ===== LOAD MODEL FAILED =====');
    console.error('[LLM] Error:', error);

    // Check if it's the JSI install error (Expo Go)
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('install') && msg.includes('null')) {
      throw new Error(
        'llama.rn native module failed to initialize.\n\n' +
        'This happens in Expo Go because it cannot load native C++ code.\n\n' +
        'To fix: create a development build:\n' +
        '  npx expo install expo-dev-client\n' +
        '  npx expo run:ios\n' +
        '  (or npx expo run:android)'
      );
    }

    throw error;
  }
}

/**
 * Release the current model from memory
 */
export async function releaseModel(): Promise<void> {
  if (activeContext) {
    try {
      await activeContext.release();
    } catch (e) {
      console.error('[LLM] Error releasing model:', e);
    }
    activeContext = null;
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Run inference with streaming token callback
 */
export async function runInference(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  onComplete: () => void,
): Promise<void> {
  if (!activeContext) {
    throw new Error('No model loaded');
  }

  try {
    const result = await activeContext.completion(
      {
        messages,
        n_predict: 1024,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        stop: ['<|im_end|>', '<|end|>', '</s>', '<|eot_id|>'],
      },
      (data: { token: string }) => {
        onToken(data.token);
      },
    );
    onComplete();
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('abort')) {
      onComplete();
    } else {
      throw error;
    }
  }
}

export function stopInference(): void {
  if (activeContext) {
    activeContext.stopCompletion();
  }
}

export function getActiveContext(): LlamaContext | null {
  return activeContext;
}
