const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectOutputDir:  () => ipcRenderer.invoke('select-output-dir'),
  selectSqliteFile: () => ipcRenderer.invoke('select-sqlite-file'),
  dbConnect:        (dbConfig) => ipcRenderer.invoke('db-connect', dbConfig),
  generateProject:  (opts) => ipcRenderer.invoke('generate-project', opts),
  previewCode:      (opts) => ipcRenderer.invoke('preview-code', opts)
});
