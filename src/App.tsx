import React, { useState } from 'react';
import { Moon, Sun, FileText, Eye, GitCompare, Code } from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { JsonFormatter } from './components/JsonFormatter';
import { JsonViewer } from './components/JsonViewer';
import { JsonDiffChecker } from './components/JsonDiffChecker';
import { JsonParser } from './components/JsonParser';

const tabs = [
  { id: 'formatter', label: 'Formatter', icon: FileText, component: JsonFormatter },
  { id: 'viewer', label: 'Viewer', icon: Eye, component: JsonViewer },
  { id: 'parser', label: 'Parser', icon: Code, component: JsonParser },
  { id: 'diff', label: 'Diff Checker', icon: GitCompare, component: JsonDiffChecker }
];

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('formatter');
  const { isDark, toggleTheme } = useTheme();

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || JsonFormatter;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  JSON Toolkit
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Format, View, Parse, and Compare JSON data
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActiveComponent />
      </main>
      {/* Footer */}
      {/* <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            <p className="mb-2">
              A comprehensive client-side JSON toolkit for developers
            </p>
            <p>
              Built with React, TypeScript, and Tailwind CSS • All processing happens in your browser
            </p>
          </div>
        </div>
      </footer>  */}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;