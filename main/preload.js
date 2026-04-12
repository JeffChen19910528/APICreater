const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),
  generateProject: (opts) => ipcRenderer.invoke('generate-project', opts),
  previewCode: (opts) => ipcRenderer.invoke('preview-code', opts)
});
