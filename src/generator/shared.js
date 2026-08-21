// ─── Shared helpers used by every language builder ───────────────────────────
// Kept dependency-free (no `fs`/`path`) so it can be bundled for the browser
// preview as well as required directly by the Electron main process.

function groupByResource(apis) {
  const groups = {};
  for (const api of apis) {
    const parts = api.path.replace(/^\//, '').split('/');
    const resource = parts[0] || 'index';
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(api);
  }
  return groups;
}

// Extracts the table/column metadata a DB-backed controller needs to generate
// CRUD SQL: which table, its primary key column, and the non-PK columns.
function getTableMeta(endpoints, resource) {
  const tableEndpoint = endpoints.find(ep => ep.tableName);
  const tableName = tableEndpoint ? tableEndpoint.tableName : resource;
  const columns = tableEndpoint ? (tableEndpoint.tableColumns || []) : [];
  const pkCol = (columns.find(c => c.primaryKey) || {}).name || 'id';
  const nonPkCols = columns.filter(c => !c.primaryKey);
  const nonPkNames = nonPkCols.map(c => c.name);
  return { tableName, columns, pkCol, nonPkCols, nonPkNames };
}

module.exports = { groupByResource, getTableMeta };
