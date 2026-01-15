import { create } from 'zustand';
import type { QueryResult, QueryHistoryEntry } from '../types/query';
import type { AutocompleteData } from '../types/schema';
import { queryApi, schemaApi } from '../services/tauriApi';

interface QueryState {
  currentResult: QueryResult | null;
  isExecuting: boolean;
  error: string | null;
  history: QueryHistoryEntry[];
  autocompleteData: AutocompleteData | null;
  currentQueryId: string | null;
  cancelledQueries: Set<string>;
}

interface QueryActions {
  executeQuery: (connectionId: string, sql: string, database?: string, page?: number, pageSize?: number) => Promise<void>;
  cancelQuery: () => void;
  loadAutocompleteData: (connectionId: string, database: string) => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
}

type QueryStore = QueryState & QueryActions;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const useQueryStore = create<QueryStore>((set, get) => ({
  currentResult: null,
  isExecuting: false,
  error: null,
  history: [],
  autocompleteData: null,
  currentQueryId: null,
  cancelledQueries: new Set<string>(),

  executeQuery: async (connectionId: string, sql: string, database?: string, page?: number, pageSize?: number) => {
    const queryId = crypto.randomUUID();
    set({ isExecuting: true, error: null, currentQueryId: queryId });
    const startTime = Date.now();

    try {
      const result = await queryApi.execute({
        connection_id: connectionId,
        sql,
        database,
        page,
        page_size: pageSize,
      });

      // Check if this query was cancelled while executing
      const state = get();
      if (state.cancelledQueries.has(queryId)) {
        // Query was cancelled, clean up and don't process the result
        const newCancelledQueries = new Set(state.cancelledQueries);
        newCancelledQueries.delete(queryId);
        set({
          isExecuting: false,
          currentQueryId: null,
          cancelledQueries: newCancelledQueries,
        });
        return;
      }

      set({ currentResult: result, isExecuting: false, currentQueryId: null });

      // Add to history
      const historyEntry: QueryHistoryEntry = {
        id: crypto.randomUUID(),
        connection_id: connectionId,
        sql,
        executed_at: startTime,
        execution_time_ms: Date.now() - startTime,
        success: true,
      };

      set((state) => ({
        history: [historyEntry, ...state.history].slice(0, 50), // Keep last 50
      }));
    } catch (error) {
      // Check if this query was cancelled
      const state = get();
      if (state.cancelledQueries.has(queryId)) {
        const newCancelledQueries = new Set(state.cancelledQueries);
        newCancelledQueries.delete(queryId);
        set({
          isExecuting: false,
          currentQueryId: null,
          cancelledQueries: newCancelledQueries,
        });
        return;
      }

      const errorMessage = toErrorMessage(error);
      set({ error: errorMessage, isExecuting: false, currentResult: null, currentQueryId: null });

      // Add failed query to history
      const historyEntry: QueryHistoryEntry = {
        id: crypto.randomUUID(),
        connection_id: connectionId,
        sql,
        executed_at: startTime,
        execution_time_ms: Date.now() - startTime,
        success: false,
        error_message: errorMessage,
      };

      set((state) => ({
        history: [historyEntry, ...state.history].slice(0, 50),
      }));
    }
  },

  cancelQuery: () => {
    const state = get();
    if (state.currentQueryId) {
      const newCancelledQueries = new Set(state.cancelledQueries);
      newCancelledQueries.add(state.currentQueryId);
      set({
        cancelledQueries: newCancelledQueries,
        isExecuting: false,
        currentQueryId: null,
        error: 'Query cancelled by user',
      });
    }
  },

  loadAutocompleteData: async (connectionId: string, database: string) => {
    try {
      const data = await schemaApi.getAutocompleteData(connectionId, database);
      set({ autocompleteData: data });
    } catch (error) {
      console.error('Failed to load autocomplete data:', error);
    }
  },

  clearResult: () => {
    set({ currentResult: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
