import { create } from 'zustand';
import type { Connection } from '../types/connection';
import { connectionApi } from '../services/tauriApi';

interface ConnectionState {
  connections: Connection[];
  activeConnectionId: string | null;
  selectedDatabase: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ConnectionActions {
  loadConnections: () => Promise<void>;
  saveConnection: (connection: Connection) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  setActiveConnection: (id: string | null) => void;
  setSelectedDatabase: (database: string | null) => void;
  testConnection: (connection: Connection) => Promise<string>;
  clearError: () => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  selectedDatabase: null,
  isLoading: false,
  error: null,

  loadConnections: async () => {
    set({ isLoading: true, error: null });
    try {
      const connections = await connectionApi.list();
      set({ connections, isLoading: false });
    } catch (error) {
      set({ error: toErrorMessage(error), isLoading: false });
    }
  },

  saveConnection: async (connection: Connection) => {
    set({ isLoading: true, error: null });
    try {
      await connectionApi.save(connection);
      await get().loadConnections();
    } catch (error) {
      set({ error: toErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteConnection: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await connectionApi.delete(id);
      const { connections, activeConnectionId } = get();
      const remainingConnections = connections.filter((c) => c.id !== id);

      set({
        connections: remainingConnections,
        isLoading: false,
        activeConnectionId: activeConnectionId === id ? null : activeConnectionId,
      });
    } catch (error) {
      set({ error: toErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  setActiveConnection: (id: string | null) => {
    set({ activeConnectionId: id, selectedDatabase: null });
  },

  setSelectedDatabase: (database: string | null) => {
    set({ selectedDatabase: database });
  },

  testConnection: async (connection: Connection) => {
    const result = await connectionApi.test(connection);
    return result;
  },

  clearError: () => {
    set({ error: null });
  },
}));
