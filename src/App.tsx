import { useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import DatabaseExplorer from './components/DatabaseExplorer/DatabaseExplorer';
import QueryEditor from './components/QueryEditor/QueryEditor';
import TableDataViewer from './components/TableViewer/TableDataViewer';
import TableStructureView from './components/TableViewer/TableStructureView';
import { useTabStore } from './store/tabStore';

function App(): JSX.Element {
  const { tabs, activeTabId, setActiveTab, closeTab, createQueryTab } = useTabStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Keyboard shortcut for new tab
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        createQueryTab();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [createQueryTab]);

  const renderTabContent = () => {
    if (!activeTab) return null;

    switch (activeTab.contentType) {
      case 'query':
        return <QueryEditor />;

      case 'table-data':
        if (!activeTab.tableInfo) return null;
        return (
          <TableDataViewer
            connectionId={activeTab.tableInfo.connectionId}
            database={activeTab.tableInfo.database}
            table={activeTab.tableInfo.table}
          />
        );

      case 'table-structure':
        if (!activeTab.tableInfo) return null;
        return (
          <TableStructureView
            connectionId={activeTab.tableInfo.connectionId}
            database={activeTab.tableInfo.database}
            table={activeTab.tableInfo.table}
          />
        );

      default:
        return <QueryEditor />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-screen flex flex-col"
      tabIndex={0}
      role="main"
    >
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-100 border-b border-gray-300 px-2 py-1">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="tab"
              aria-selected={activeTabId === tab.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer whitespace-nowrap
                ${activeTabId === tab.id ? 'bg-white border border-b-0' : 'bg-gray-200 hover:bg-gray-300'}
              `}
              onClick={() => setActiveTab(tab.id)}
            >
              {/* Icon based on content type */}
              {tab.contentType === 'query' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {tab.contentType === 'table-data' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {tab.contentType === 'table-structure' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )}
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
          onClick={createQueryTab}
          title="New Query Tab (Cmd+T)"
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
            {renderTabContent()}
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
