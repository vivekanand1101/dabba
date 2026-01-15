import { useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import DatabaseExplorer from './components/DatabaseExplorer/DatabaseExplorer';
import QueryEditor from './components/QueryEditor/QueryEditor';
import { useTabs } from './hooks/useTabs';

function App(): JSX.Element {
  const { tabs, activeTabId, setActiveTabId, createTab, closeTab } = useTabs();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen flex flex-col"
      tabIndex={0}
      role="main"
    >
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-100 border-b border-gray-300 px-2 py-1">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="tab"
              aria-selected={activeTabId === tab.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer
                ${activeTabId === tab.id ? 'bg-white border border-b-0' : 'bg-gray-200 hover:bg-gray-300'}
              `}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="text-sm">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  aria-label="close tab"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          className="ml-2 px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
          onClick={createTab}
          title="New Tab (Cmd+T)"
        >
          +
        </button>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Database Explorer Sidebar */}
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <DatabaseExplorer />
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-500 transition-colors cursor-col-resize" />

          {/* Main Content Area */}
          <Panel defaultSize={80}>
            <QueryEditor />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
