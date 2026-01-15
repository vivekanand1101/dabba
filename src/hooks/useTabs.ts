import { useState, useCallback, useEffect } from 'react';

export interface Tab {
  id: string;
  title: string;
  connectionId?: string;
}

interface UseTabsReturn {
  tabs: Tab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  createTab: () => void;
  closeTab: (tabId: string) => void;
}

function generateTabId(): string {
  return Date.now().toString();
}

function createDefaultTab(): Tab {
  return { id: generateTabId(), title: 'New Tab' };
}

export function useTabs(): UseTabsReturn {
  const [tabs, setTabs] = useState<Tab[]>([createDefaultTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

  const createTab = useCallback(() => {
    const newTab = createDefaultTab();
    setTabs((prevTabs) => [...prevTabs, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prevTabs) => {
      const remainingTabs = prevTabs.filter((tab) => tab.id !== tabId);
      if (remainingTabs.length === 0) {
        const defaultTab = createDefaultTab();
        setActiveTabId(defaultTab.id);
        return [defaultTab];
      }
      return remainingTabs;
    });

    setActiveTabId((prevActiveId) => {
      if (prevActiveId !== tabId) {
        return prevActiveId;
      }
      const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
      return remainingTabs.length > 0 ? remainingTabs[0].id : prevActiveId;
    });
  }, [tabs]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        createTab();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [createTab]);

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    createTab,
    closeTab,
  };
}
