import { create } from 'zustand';

export type TabContentType = 'query' | 'table-data' | 'table-structure';

export interface Tab {
  id: string;
  title: string;
  contentType: TabContentType;
  // For table-data and table-structure tabs
  tableInfo?: {
    connectionId: string;
    database: string;
    table: string;
  };
}

interface TabState {
  tabs: Tab[];
  activeTabId: string;
}

interface TabActions {
  createQueryTab: () => void;
  createTableDataTab: (connectionId: string, database: string, table: string) => void;
  createTableStructureTab: (connectionId: string, database: string, table: string) => void;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
}

type TabStore = TabState & TabActions;

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function createDefaultTab(): Tab {
  return {
    id: generateTabId(),
    title: 'Query',
    contentType: 'query',
  };
}

const initialTab = createDefaultTab();

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [initialTab],
  activeTabId: initialTab.id,

  createQueryTab: () => {
    const newTab: Tab = {
      id: generateTabId(),
      title: 'Query',
      contentType: 'query',
    };
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  createTableDataTab: (connectionId: string, database: string, table: string) => {
    const newTab: Tab = {
      id: generateTabId(),
      title: table,
      contentType: 'table-data',
      tableInfo: { connectionId, database, table },
    };
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  createTableStructureTab: (connectionId: string, database: string, table: string) => {
    const newTab: Tab = {
      id: generateTabId(),
      title: `${table} - Structure`,
      contentType: 'table-structure',
      tableInfo: { connectionId, database, table },
    };
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  closeTab: (tabId: string) => {
    const { tabs, activeTabId } = get();

    if (tabs.length === 1) {
      // Don't close the last tab, just reset it to a query tab
      const defaultTab = createDefaultTab();
      set({
        tabs: [defaultTab],
        activeTabId: defaultTab.id,
      });
      return;
    }

    const remainingTabs = tabs.filter((tab) => tab.id !== tabId);

    // If we're closing the active tab, switch to another one
    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      const closingTabIndex = tabs.findIndex((tab) => tab.id === tabId);
      // Try to activate the next tab, or the previous one if it's the last tab
      const nextTabIndex = closingTabIndex < remainingTabs.length ? closingTabIndex : closingTabIndex - 1;
      newActiveTabId = remainingTabs[nextTabIndex]?.id || remainingTabs[0].id;
    }

    set({
      tabs: remainingTabs,
      activeTabId: newActiveTabId,
    });
  },

  updateTabTitle: (tabId: string, title: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, title } : tab
      ),
    }));
  },
}));
