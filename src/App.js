import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ApiDesigner from './pages/ApiDesigner';
import CodePreview from './pages/CodePreview';
import ExportPage from './pages/ExportPage';
import DatabaseImport from './pages/DatabaseImport';
import { getDefaultVersion } from './utils/versions';
import './App.css';

const PAGES = {
  designer: ApiDesigner,
  preview:  CodePreview,
  export:   ExportPage,
  database: DatabaseImport
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('designer');
  const [apis, setApis] = useState([]);
  const [projectName, setProjectName] = useState('my-api-project');
  const [language, setLanguage] = useState('nodejs');
  const [version, setVersion] = useState(getDefaultVersion('nodejs'));
  const [dbConfig, setDbConfig] = useState(null);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setVersion(getDefaultVersion(newLang));
  };

  const PageComponent = PAGES[currentPage];

  return (
    <div className="app">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        language={language}
        onLanguageChange={handleLanguageChange}
        version={version}
        onVersionChange={setVersion}
        apiCount={apis.length}
        dbConfig={dbConfig}
      />
      <main className="main-content">
        <PageComponent
          apis={apis}
          setApis={setApis}
          projectName={projectName}
          language={language}
          version={version}
          dbConfig={dbConfig}
          setDbConfig={setDbConfig}
          onNavigate={setCurrentPage}
        />
      </main>
    </div>
  );
}
