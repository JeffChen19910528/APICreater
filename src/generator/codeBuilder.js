// ─── Project generation entry point (Electron main process only) ────────────
// File-writing wrapper around the pure builders in ./buildFiles.

const fs = require('fs');
const path = require('path');
const { buildFiles, generateDbIndex, generateEnvFile, generateDbController } = require('./buildFiles');

async function generateProject({ apis, projectName, language, version, outputDir, dbConfig }) {
  const files = buildFiles(apis, projectName, language, version, dbConfig);
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(outputDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  }
  return outputDir;
}

async function generatePreview({ apis, projectName, language, version, dbConfig }) {
  return buildFiles(apis, projectName, language, version, dbConfig);
}

module.exports = {
  generateProject,
  generatePreview,
  generateDbIndex,
  generateEnvFile,
  generateDbController
};
