/**
 * OpenLiL AI — Model Store
 * Manages: selected model, download states, loaded model instance
 * 🔧 DEBUGGING: Added console.log throughout
 */

import { create } from 'zustand';
import { ModelInfo, DEFAULT_MODEL, MODELS } from '../lib/modelConfig';
import {
  downloadModel as downloadModelFile,
  isModelDownloaded,
  loadModel as loadModelFile,
  releaseModel,
  deleteModel as deleteModelFile,
} from '../lib/llm';

export type DownloadStatus = 'idle' | 'downloading' | 'downloaded' | 'loading' | 'ready' | 'error';

interface DownloadState {
  status: DownloadStatus;
  progress: number;
  error?: string;
}

interface ModelState {
  selectedModel: ModelInfo;
  downloadStates: Record<string, DownloadState>;
  loadedModelId: string | null;
  isGenerating: boolean;

  // Actions
  selectModel: (model: ModelInfo) => void;
  checkDownloadStates: () => Promise<void>;
  downloadModel: (model: ModelInfo) => Promise<void>;
  loadModel: (model: ModelInfo) => Promise<void>;
  unloadModel: () => Promise<void>;
  deleteModel: (model: ModelInfo) => Promise<void>;
  setGenerating: (generating: boolean) => void;
}

export const useModelStore = create<ModelState>((set, get) => ({
  selectedModel: DEFAULT_MODEL,
  downloadStates: {},
  loadedModelId: null,
  isGenerating: false,

  selectModel: (model) => {
    console.log('[ModelStore] selectModel:', model.id);
    set({ selectedModel: model });
  },

  checkDownloadStates: async () => {
    console.log('[ModelStore] checkDownloadStates: checking all models...');
    const states: Record<string, DownloadState> = {};
    for (const model of MODELS) {
      try {
        const downloaded = await isModelDownloaded(model);
        states[model.id] = {
          status: downloaded ? 'downloaded' : 'idle',
          progress: downloaded ? 1 : 0,
        };
        console.log('[ModelStore]', model.id, '→', states[model.id].status);
      } catch (e) {
        console.error('[ModelStore] Error checking', model.id, ':', e);
        states[model.id] = { status: 'idle', progress: 0 };
      }
    }
    // Preserve 'ready' status for the loaded model
    const loadedId = get().loadedModelId;
    if (loadedId && states[loadedId]) {
      states[loadedId] = { status: 'ready', progress: 1 };
    }
    set({ downloadStates: states });
    console.log('[ModelStore] checkDownloadStates done');
  },

  downloadModel: async (model) => {
    console.log('[ModelStore] downloadModel:', model.id);
    set((state) => ({
      downloadStates: {
        ...state.downloadStates,
        [model.id]: { status: 'downloading', progress: 0 },
      },
    }));

    try {
      await downloadModelFile(model, (progress) => {
        set((state) => ({
          downloadStates: {
            ...state.downloadStates,
            [model.id]: { status: 'downloading', progress },
          },
        }));
      });

      console.log('[ModelStore] downloadModel SUCCESS:', model.id);
      set((state) => ({
        downloadStates: {
          ...state.downloadStates,
          [model.id]: { status: 'downloaded', progress: 1 },
        },
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[ModelStore] downloadModel FAILED:', model.id, '|', errorMsg);
      set((state) => ({
        downloadStates: {
          ...state.downloadStates,
          [model.id]: { status: 'error', progress: 0, error: errorMsg },
        },
      }));
      throw error;
    }
  },

  loadModel: async (model) => {
    console.log('[ModelStore] loadModel:', model.id);
    const state = get();

    // Release current model if different
    if (state.loadedModelId && state.loadedModelId !== model.id) {
      console.log('[ModelStore] Releasing previous model:', state.loadedModelId);
      await releaseModel();
      set((s) => ({
        downloadStates: {
          ...s.downloadStates,
          [state.loadedModelId!]: { status: 'downloaded', progress: 1 },
        },
      }));
    }

    set((s) => ({
      downloadStates: {
        ...s.downloadStates,
        [model.id]: { status: 'loading', progress: 0 },
      },
    }));

    try {
      await loadModelFile(model, (progress) => {
        set((s) => ({
          downloadStates: {
            ...s.downloadStates,
            [model.id]: { status: 'loading', progress },
          },
        }));
      });

      console.log('[ModelStore] loadModel SUCCESS:', model.id);
      set((s) => ({
        loadedModelId: model.id,
        selectedModel: model,
        downloadStates: {
          ...s.downloadStates,
          [model.id]: { status: 'ready', progress: 1 },
        },
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[ModelStore] loadModel FAILED:', model.id, '|', errorMsg);
      set((s) => ({
        downloadStates: {
          ...s.downloadStates,
          [model.id]: { status: 'error', progress: 0, error: errorMsg },
        },
      }));
      throw error;
    }
  },

  unloadModel: async () => {
    const { loadedModelId } = get();
    console.log('[ModelStore] unloadModel:', loadedModelId);
    await releaseModel();
    if (loadedModelId) {
      set((s) => ({
        loadedModelId: null,
        downloadStates: {
          ...s.downloadStates,
          [loadedModelId]: { status: 'downloaded', progress: 1 },
        },
      }));
    }
  },

  deleteModel: async (model) => {
    console.log('[ModelStore] deleteModel:', model.id);
    const { loadedModelId } = get();
    if (loadedModelId === model.id) {
      await releaseModel();
      set({ loadedModelId: null });
    }
    await deleteModelFile(model);
    set((state) => ({
      downloadStates: {
        ...state.downloadStates,
        [model.id]: { status: 'idle', progress: 0 },
      },
    }));
  },

  setGenerating: (generating) => {
    set({ isGenerating: generating });
  },
}));
