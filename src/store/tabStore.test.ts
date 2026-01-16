import { describe, it, expect, beforeEach } from 'vitest';
import { useTabStore } from './tabStore';

describe('TabStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useTabStore.getState();
    store.tabs.forEach(tab => {
      if (store.tabs.length > 1) {
        store.closeTab(tab.id);
      }
    });
  });

  describe('Initialization', () => {
    it('should initialize with one tab', () => {
      const { tabs } = useTabStore.getState();
      expect(tabs).toHaveLength(1);
    });

    it('should have activeTabId matching the initial tab id', () => {
      const { tabs, activeTabId } = useTabStore.getState();
      expect(activeTabId).toBe(tabs[0].id);
    });

    it('should initialize with a query tab', () => {
      const { tabs } = useTabStore.getState();
      expect(tabs[0].contentType).toBe('query');
      expect(tabs[0].title).toBe('Query');
    });
  });

  describe('createTableDataTab', () => {
    it('should create a new table-data tab', () => {
      const store = useTabStore.getState();
      const initialTabCount = store.tabs.length;

      store.createTableDataTab('conn-1', 'testdb', 'users');

      const { tabs } = useTabStore.getState();
      expect(tabs).toHaveLength(initialTabCount + 1);

      const newTab = tabs[tabs.length - 1];
      expect(newTab.contentType).toBe('table-data');
      expect(newTab.title).toBe('users');
      expect(newTab.tableInfo).toEqual({
        connectionId: 'conn-1',
        database: 'testdb',
        table: 'users',
      });
    });

    it('should set the new table-data tab as active', () => {
      const store = useTabStore.getState();

      store.createTableDataTab('conn-1', 'testdb', 'users');

      const { tabs, activeTabId } = useTabStore.getState();
      const newTab = tabs[tabs.length - 1];
      expect(activeTabId).toBe(newTab.id);
    });

    it('should allow finding the active table-data tab', () => {
      const store = useTabStore.getState();

      store.createTableDataTab('conn-1', 'testdb', 'users');

      const { tabs, activeTabId } = useTabStore.getState();
      const activeTab = tabs.find(tab => tab.id === activeTabId);

      expect(activeTab).toBeDefined();
      expect(activeTab?.contentType).toBe('table-data');
      expect(activeTab?.tableInfo?.table).toBe('users');
    });
  });

  describe('createTableStructureTab', () => {
    it('should create a new table-structure tab', () => {
      const store = useTabStore.getState();

      store.createTableStructureTab('conn-1', 'testdb', 'users');

      const { tabs } = useTabStore.getState();
      const newTab = tabs[tabs.length - 1];

      expect(newTab.contentType).toBe('table-structure');
      expect(newTab.title).toBe('users - Structure');
      expect(newTab.tableInfo).toEqual({
        connectionId: 'conn-1',
        database: 'testdb',
        table: 'users',
      });
    });

    it('should set the new structure tab as active', () => {
      const store = useTabStore.getState();

      store.createTableStructureTab('conn-1', 'testdb', 'users');

      const { tabs, activeTabId } = useTabStore.getState();
      const newTab = tabs[tabs.length - 1];
      expect(activeTabId).toBe(newTab.id);
    });
  });

  describe('createQueryTab', () => {
    it('should create a new query tab', () => {
      const store = useTabStore.getState();
      const initialTabCount = store.tabs.length;

      store.createQueryTab();

      const { tabs } = useTabStore.getState();
      expect(tabs).toHaveLength(initialTabCount + 1);

      const newTab = tabs[tabs.length - 1];
      expect(newTab.contentType).toBe('query');
      expect(newTab.title).toBe('Query');
    });

    it('should set the new query tab as active', () => {
      const store = useTabStore.getState();

      store.createQueryTab();

      const { tabs, activeTabId } = useTabStore.getState();
      const newTab = tabs[tabs.length - 1];
      expect(activeTabId).toBe(newTab.id);
    });
  });

  describe('setActiveTab', () => {
    it('should change the active tab', () => {
      const store = useTabStore.getState();

      store.createQueryTab();
      const { tabs } = useTabStore.getState();
      const firstTabId = tabs[0].id;

      store.setActiveTab(firstTabId);

      const { activeTabId } = useTabStore.getState();
      expect(activeTabId).toBe(firstTabId);
    });
  });

  describe('closeTab', () => {
    it('should close a tab when there are multiple tabs', () => {
      const store = useTabStore.getState();

      store.createQueryTab();
      const initialCount = useTabStore.getState().tabs.length;
      const tabToClose = useTabStore.getState().tabs[0].id;

      store.closeTab(tabToClose);

      const { tabs } = useTabStore.getState();
      expect(tabs).toHaveLength(initialCount - 1);
      expect(tabs.find(tab => tab.id === tabToClose)).toBeUndefined();
    });

    it('should switch to another tab when closing the active tab', () => {
      const store = useTabStore.getState();

      store.createQueryTab();
      const { tabs, activeTabId } = useTabStore.getState();

      store.closeTab(activeTabId);

      const newState = useTabStore.getState();
      expect(newState.activeTabId).not.toBe(activeTabId);
      expect(newState.tabs.find(tab => tab.id === newState.activeTabId)).toBeDefined();
    });

    it('should not close the last tab, but reset it to default', () => {
      const store = useTabStore.getState();
      const { tabs } = store;

      // Should have only one tab initially
      expect(tabs).toHaveLength(1);

      store.closeTab(tabs[0].id);

      const newState = useTabStore.getState();
      expect(newState.tabs).toHaveLength(1);
      expect(newState.tabs[0].contentType).toBe('query');
    });
  });

  describe('updateTabTitle', () => {
    it('should update the title of a specific tab', () => {
      const store = useTabStore.getState();
      const tabId = store.tabs[0].id;

      store.updateTabTitle(tabId, 'New Title');

      const { tabs } = useTabStore.getState();
      const updatedTab = tabs.find(tab => tab.id === tabId);
      expect(updatedTab?.title).toBe('New Title');
    });

    it('should not affect other tabs', () => {
      const store = useTabStore.getState();

      store.createQueryTab();
      const { tabs } = useTabStore.getState();
      const firstTabId = tabs[0].id;
      const secondTabTitle = tabs[1].title;

      store.updateTabTitle(firstTabId, 'Updated Title');

      const newState = useTabStore.getState();
      expect(newState.tabs[1].title).toBe(secondTabTitle);
    });
  });

  describe('Bug Fix Verification', () => {
    it('should ensure activeTabId always points to an existing tab', () => {
      const { tabs, activeTabId } = useTabStore.getState();

      const activeTab = tabs.find(tab => tab.id === activeTabId);
      expect(activeTab).toBeDefined();
      expect(activeTab?.id).toBe(activeTabId);
    });

    it('should maintain valid activeTabId after creating table data tab', () => {
      const store = useTabStore.getState();

      store.createTableDataTab('conn-1', 'testdb', 'users');

      const { tabs, activeTabId } = useTabStore.getState();
      const activeTab = tabs.find(tab => tab.id === activeTabId);

      expect(activeTab).toBeDefined();
      expect(activeTab?.tableInfo).toBeDefined();
      expect(activeTab?.tableInfo?.table).toBe('users');
    });

    it('should have unique tab IDs', () => {
      const store = useTabStore.getState();

      store.createQueryTab();
      store.createTableDataTab('conn-1', 'db1', 'table1');
      store.createTableStructureTab('conn-1', 'db1', 'table1');

      const { tabs } = useTabStore.getState();
      const tabIds = tabs.map(tab => tab.id);
      const uniqueIds = new Set(tabIds);

      expect(uniqueIds.size).toBe(tabIds.length);
    });
  });
});
