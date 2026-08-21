// ─── C# ASP.NET Core Code Generator ──────────────────────────────────────────

const { groupByResource, getTableMeta } = require('./shared');

// ─── Version Configurations ───────────────────────────────────────────────────

const CSHARP_VERSION_CONFIG = {
  net8: {
    targetFramework: 'net8.0',
    swashbuckleVersion: '6.5.0',
    openApiPackage: 'Microsoft.AspNetCore.OpenApi',
    openApiVersion: '8.0.0',
    minimalHosting: true,
    label: '.NET 8.0 LTS'
  },
  net6: {
    targetFramework: 'net6.0',
    swashbuckleVersion: '6.4.0',
    openApiPackage: 'Microsoft.AspNetCore.OpenApi',
    openApiVersion: '6.0.0',
    minimalHosting: true,
    label: '.NET 6.0 LTS'
  },
  net5: {
    targetFramework: 'net5.0',
    swashbuckleVersion: '5.6.3',
    openApiPackage: null,
    openApiVersion: null,
    minimalHosting: true,
    label: '.NET 5.0'
  },
  net31: {
    targetFramework: 'netcoreapp3.1',
    swashbuckleVersion: '5.6.3',
    openApiPackage: null,
    openApiVersion: null,
    minimalHosting: false,  // uses Startup.cs
    label: '.NET Core 3.1 LTS'
  }
};

// ─── Type Mapping ─────────────────────────────────────────────────────────────

function toCsharpType(val) {
  if (typeof val === 'object' && val !== null) return 'object';
  switch (val) {
    case 'string':  return 'string';
    case 'int':     return 'int';
    case 'number':  return 'double';
    case 'boolean': return 'bool';
    case 'array':   return 'List<object>';
    default:        return 'object';
  }
}

function toCsharpDefault(val) {
  if (typeof val === 'object' && val !== null) return 'new()';
  switch (val) {
    case 'string':  return '"example"';
    case 'int':     return '0';
    case 'number':  return '0.0';
    case 'boolean': return 'false';
    case 'array':   return 'new List<object>()';
    default:        return 'null!';
  }
}

function toPascal(str) {
  return str.split(/[_\-\/]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

function toActionName(method, path) {
  const parts = path.replace(/^\//, '').split('/').map(p =>
    p.startsWith(':') ? 'By' + toPascal(p.slice(1)) : toPascal(p)
  );
  return toPascal(method.toLowerCase()) + parts.slice(1).join('');
}

function httpAttribute(method) {
  return { GET: 'HttpGet', POST: 'HttpPost', PUT: 'HttpPut', PATCH: 'HttpPatch', DELETE: 'HttpDelete' }[method] || 'HttpGet';
}

function toAspNetPath(path) {
  return path.replace(/:(\w+)/g, '{$1}');
}

// ─── Build Model Properties ───────────────────────────────────────────────────

function buildProps(schema, indent = '    ') {
  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) return '';
  return Object.entries(schema).map(([key, val]) => {
    const csType = toCsharpType(val);
    const propName = toPascal(key);
    const defVal = toCsharpDefault(val);
    return `${indent}public ${csType} ${propName} { get; set; } = ${defVal};`;
  }).join('\n');
}

function buildReturnObj(schema, indent = '        ') {
  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) {
    return 'new { message = "ok" }';
  }
  const entries = Object.entries(schema).map(([k, v]) => {
    const val = toCsharpDefault(v).replace(/^"(.*)"$/, '"$1"');
    return `${indent}    ${toPascal(k)} = ${val}`;
  }).join(',\n');
  return `new\n${indent}{\n${entries}\n${indent}}`;
}

// ─── Program.cs — Minimal Hosting (.NET 5/6/8) ───────────────────────────────

function buildProgramMinimal(safeProjectName, cfg) {
  const openApiUsing = cfg.openApiPackage
    ? `builder.Services.AddEndpointsApiExplorer();\n`
    : '';
  return `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
${openApiUsing}builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = builder.Environment.ApplicationName, Version = "v1" });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
`;
}

// ─── Program.cs + Startup.cs — .NET Core 3.1 ─────────────────────────────────

function buildProgramLegacy(safeProjectName) {
  return `using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace ${safeProjectName}
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
`;
}

function buildStartupLegacy(safeProjectName) {
  return `using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;

namespace ${safeProjectName}
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "${safeProjectName}", Version = "v1" });
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "${safeProjectName} v1"));
            }

            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
`;
}

// ─── .csproj ─────────────────────────────────────────────────────────────────

function buildCsproj(safeProjectName, cfg) {
  const openApiRef = cfg.openApiPackage
    ? `    <PackageReference Include="${cfg.openApiPackage}" Version="${cfg.openApiVersion}" />\n`
    : '';

  return `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>${cfg.targetFramework}</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
${openApiRef}    <PackageReference Include="Swashbuckle.AspNetCore" Version="${cfg.swashbuckleVersion}" />
  </ItemGroup>
</Project>
`;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

const CSHARP_DB_PACKAGES = {
  mysql:      'MySqlConnector',
  postgresql: 'Npgsql',
  sqlite:     'Microsoft.Data.Sqlite',
  mssql:      'Microsoft.Data.SqlClient',
  oracle:     'Oracle.ManagedDataAccess.Core'
};

const CSHARP_DB_NAMESPACES = {
  mysql:      'MySqlConnector',
  postgresql: 'Npgsql',
  sqlite:     'Microsoft.Data.Sqlite',
  mssql:      'Microsoft.Data.SqlClient',
  oracle:     'Oracle.ManagedDataAccess.Client'
};

const CSHARP_DB_CLASS = {
  mysql:      'MySqlConnection',
  postgresql: 'NpgsqlConnection',
  sqlite:     'SqliteConnection',
  mssql:      'SqlConnection',
  oracle:     'OracleConnection'
};

function buildCsharpConnString(dbConfig) {
  const d = dbConfig;
  switch (d.type) {
    case 'mysql':
      return `Server=${d.host||'localhost'};Port=${d.port||3306};Database=${d.database||'mydb'};Uid=${d.username||'root'};Pwd=${d.password||''};`;
    case 'postgresql':
      return `Host=${d.host||'localhost'};Port=${d.port||5432};Database=${d.database||'mydb'};Username=${d.username||'postgres'};Password=${d.password||''};`;
    case 'sqlite':
      return `Data Source=${(d.filePath||'./database.db').replace(/\\/g,'/')};`;
    case 'mssql':
      return `Server=${d.host||'localhost'},${d.port||1433};Database=${d.database||'mydb'};User Id=${d.username||'sa'};Password=${d.password||''};TrustServerCertificate=True;`;
    case 'oracle':
      return `Data Source=${d.host||'localhost'}:${d.port||1521}/${d.serviceName||'XEPDB1'};User Id=${d.username||'hr'};Password=${d.password||''};`;
    default:
      return '';
  }
}

function buildCsharpDbController(resource, endpoints, dbConfig, safeProjectName, cfg) {
  const ctrl = toPascal(resource);
  const dbClass = CSHARP_DB_CLASS[dbConfig.type] || 'IDbConnection';
  const ns = CSHARP_DB_NAMESPACES[dbConfig.type] || '';

  const { tableName, pkCol, nonPkCols } = getTableMeta(endpoints, resource);
  const pkPascal = toPascal(pkCol);

  const indent = cfg.minimalHosting ? '    ' : '        ';
  const inner = cfg.minimalHosting ? '' : '    ';

  let out = `using Dapper;\nusing System.Data;\nusing Microsoft.AspNetCore.Mvc;\n`;
  if (ns) out += `using ${ns};\n`;
  out += '\n';

  if (cfg.minimalHosting) {
    out += `namespace ${safeProjectName}.Controllers;\n\n`;
    out += `[ApiController]\n[Route("[controller]")]\npublic class ${ctrl}Controller : ControllerBase\n{\n`;
    out += `${indent}private readonly IDbConnection _db;\n`;
    out += `${indent}public ${ctrl}Controller(IDbConnection db) => _db = db;\n\n`;
  } else {
    out += `namespace ${safeProjectName}.Controllers\n{\n    [ApiController]\n    [Route("[controller]")]\n    public class ${ctrl}Controller : ControllerBase\n    {\n`;
    out += `${indent}private readonly IDbConnection _db;\n`;
    out += `${indent}public ${ctrl}Controller(IDbConnection db) => _db = db;\n\n`;
  }

  for (const ep of endpoints) {
    const action = toActionName(ep.method, ep.path);
    const subPath = toAspNetPath(ep.path.replace(new RegExp(`^/?${resource}`), '') || '');
    const routeAttr = subPath ? `("${subPath}")` : '';
    const isByIdPath = ep.path.includes(':');
    const method = ep.method.toUpperCase();

    if (ep.description) out += `${indent}// ${ep.description}\n`;
    out += `${indent}[${httpAttribute(ep.method)}${routeAttr}]\n`;
    out += `${indent}public async Task<IActionResult> ${action}(`;

    if (isByIdPath) out += `[FromRoute] int ${pkCol}`;
    if (['POST','PUT','PATCH'].includes(method)) {
      if (isByIdPath) out += ', ';
      if (nonPkCols.length > 0) {
        out += nonPkCols.map(c => `string ${c.name} = ""`).join(', ');
      }
    }
    out += `)\n${indent}{\n`;

    if (method === 'GET' && !isByIdPath) {
      out += `${indent}    var items = await _db.QueryAsync("SELECT * FROM ${tableName}");\n`;
      out += `${indent}    return Ok(items);\n`;
    } else if (method === 'GET') {
      out += `${indent}    var item = await _db.QueryFirstOrDefaultAsync("SELECT * FROM ${tableName} WHERE ${pkCol} = @${pkPascal}", new { ${pkPascal} = ${pkCol} });\n`;
      out += `${indent}    if (item == null) return NotFound();\n`;
      out += `${indent}    return Ok(item);\n`;
    } else if (method === 'POST') {
      if (nonPkCols.length > 0) {
        const cols = nonPkCols.map(c => c.name).join(', ');
        const vals = nonPkCols.map(c => `@${toPascal(c.name)}`).join(', ');
        const anon = nonPkCols.map(c => `${toPascal(c.name)} = ${c.name}`).join(', ');
        out += `${indent}    await _db.ExecuteAsync("INSERT INTO ${tableName} (${cols}) VALUES (${vals})", new { ${anon} });\n`;
        out += `${indent}    return StatusCode(201, new { ${nonPkCols.map(c=>`${c.name}`).join(', ')} });\n`;
      } else {
        out += `${indent}    return StatusCode(201, new { message = "Created" });\n`;
      }
    } else if (method === 'PUT' || method === 'PATCH') {
      if (nonPkCols.length > 0) {
        const set = nonPkCols.map(c => `${c.name} = @${toPascal(c.name)}`).join(', ');
        const anon = [...nonPkCols.map(c => `${toPascal(c.name)} = ${c.name}`), `${pkPascal} = ${pkCol}`].join(', ');
        out += `${indent}    await _db.ExecuteAsync("UPDATE ${tableName} SET ${set} WHERE ${pkCol} = @${pkPascal}", new { ${anon} });\n`;
        out += `${indent}    return Ok(new { ${pkCol}, ${nonPkCols.map(c=>c.name).join(', ')} });\n`;
      } else {
        out += `${indent}    return Ok(new { message = "Updated" });\n`;
      }
    } else if (method === 'DELETE') {
      out += `${indent}    await _db.ExecuteAsync("DELETE FROM ${tableName} WHERE ${pkCol} = @${pkPascal}", new { ${pkPascal} = ${pkCol} });\n`;
      out += `${indent}    return Ok(new { message = "Deleted" });\n`;
    }

    out += `${indent}}\n\n`;
  }

  out += cfg.minimalHosting ? '}\n' : '    }\n}\n';
  return out;
}

// ─── Main builder ─────────────────────────────────────────────────────────────

function buildCsharpFiles(apis, projectName, version = 'net8', dbConfig = null) {
  const cfg = CSHARP_VERSION_CONFIG[version] || CSHARP_VERSION_CONFIG.net8;
  const files = {};
  const groups = groupByResource(apis);
  const safeProjectName = toPascal(projectName.replace(/[^a-zA-Z0-9_\-]/g, '_'));

  // ── Program.cs ──
  let programCs = cfg.minimalHosting ? buildProgramMinimal(safeProjectName, cfg) : buildProgramLegacy(safeProjectName);
  if (dbConfig && cfg.minimalHosting) {
    const dbClass = CSHARP_DB_CLASS[dbConfig.type] || 'IDbConnection';
    const ns = CSHARP_DB_NAMESPACES[dbConfig.type] || '';
    const diLine = `\n// Database connection\nbuilder.Services.AddScoped<System.Data.IDbConnection>(_ =>\n    new ${dbClass}(builder.Configuration.GetConnectionString("DefaultConnection")));\n`;
    const nsUsing = ns ? `using ${ns};\n` : '';
    programCs = nsUsing + 'using Dapper;\n' + programCs.replace(
      'var app = builder.Build();',
      diLine + '\nvar app = builder.Build();'
    );
  }
  if (cfg.minimalHosting) {
    files['Program.cs'] = programCs;
  } else {
    files['Program.cs'] = buildProgramLegacy(safeProjectName);
    files['Startup.cs'] = buildStartupLegacy(safeProjectName);
  }

  // ── .csproj ──
  const dbPackageName = dbConfig ? CSHARP_DB_PACKAGES[dbConfig.type] : null;
  const dbPackageRef = dbPackageName
    ? `    <PackageReference Include="${dbPackageName}" Version="*" />\n    <PackageReference Include="Dapper" Version="2.1.35" />\n`
    : '';
  files[`${safeProjectName}.csproj`] = buildCsproj(safeProjectName, cfg).replace(
    '  </ItemGroup>',
    dbPackageRef + '  </ItemGroup>'
  );

  // ── appsettings.json ──
  const appSettings = {
    Logging: { LogLevel: { Default: 'Information', 'Microsoft.AspNetCore': 'Warning' } },
    AllowedHosts: '*'
  };
  if (dbConfig) {
    appSettings.ConnectionStrings = { DefaultConnection: buildCsharpConnString(dbConfig) };
  }
  files['appsettings.json'] = JSON.stringify(appSettings, null, 2);

  // ── appsettings.Development.json ──
  files['appsettings.Development.json'] = JSON.stringify({
    Logging: { LogLevel: { Default: 'Information', 'Microsoft.AspNetCore': 'Warning' } }
  }, null, 2);

  // ── README.md ──
  const swaggerUrl = cfg.minimalHosting
    ? 'https://localhost:7000/swagger'
    : 'https://localhost:5001/swagger';

  files['README.md'] = `# ${projectName}

Generated by **API Generator** — C# ${cfg.label}.

## Requirements

- .NET SDK ${cfg.targetFramework.replace('netcoreapp', '').replace('net', '')}+

## Getting Started

\`\`\`bash
dotnet restore
dotnet run
\`\`\`

Swagger UI: ${swaggerUrl}

## Endpoints

${apis.map(api => `### ${api.method} \`${api.path}\`\n${api.description ? `> ${api.description}\n` : ''}`).join('\n')}
`;

  for (const [resource, endpoints] of Object.entries(groups)) {
    const ctrl = toPascal(resource);
    const hasTableEndpoint = endpoints.some(ep => ep.tableName);

    // Use DB controller if dbConfig + table endpoints
    if (dbConfig && hasTableEndpoint) {
      files[`Controllers/${ctrl}Controller.cs`] = buildCsharpDbController(resource, endpoints, dbConfig, safeProjectName, cfg);
      files[`Models/${ctrl}Models.cs`] = cfg.minimalHosting
        ? `namespace ${safeProjectName}.Models;\n// Models for ${resource}\n`
        : `namespace ${safeProjectName}.Models\n{\n    // Models for ${resource}\n}\n`;
      continue;
    }

    // ── Models ──
    let modelFile = cfg.minimalHosting
      ? `namespace ${safeProjectName}.Models;\n\n`
      : `namespace ${safeProjectName}.Models\n{\n`;

    endpoints.forEach(ep => {
      const action = toActionName(ep.method, ep.path);
      const reqProps = buildProps(ep.requestSchema);
      const resProps = buildProps(ep.responseSchema);

      if (cfg.minimalHosting) {
        if (reqProps) modelFile += `public class ${action}Request\n{\n${reqProps}\n}\n\n`;
        if (resProps) modelFile += `public class ${action}Response\n{\n${resProps}\n}\n\n`;
      } else {
        // .NET Core 3.1: inside namespace block
        if (reqProps) modelFile += `    public class ${action}Request\n    {\n${reqProps.replace(/^/gm, '    ')}\n    }\n\n`;
        if (resProps) modelFile += `    public class ${action}Response\n    {\n${resProps.replace(/^/gm, '    ')}\n    }\n\n`;
      }
    });

    if (!cfg.minimalHosting) modelFile += '}\n';
    files[`Models/${ctrl}Models.cs`] = modelFile;

    // ── Controller ──
    const nsLine = cfg.minimalHosting
      ? `using Microsoft.AspNetCore.Mvc;\nusing ${safeProjectName}.Models;\n\nnamespace ${safeProjectName}.Controllers;\n`
      : `using Microsoft.AspNetCore.Mvc;\nusing ${safeProjectName}.Models;\n\nnamespace ${safeProjectName}.Controllers\n{`;

    let ctrlContent = `${nsLine}\n\n[ApiController]\n[Route("[controller]")]\npublic class ${ctrl}Controller : ControllerBase\n{\n`;

    if (!cfg.minimalHosting) {
      ctrlContent = `using Microsoft.AspNetCore.Mvc;\nusing ${safeProjectName}.Models;\n\nnamespace ${safeProjectName}.Controllers\n{\n    [ApiController]\n    [Route("[controller]")]\n    public class ${ctrl}Controller : ControllerBase\n    {\n`;
    }

    endpoints.forEach(ep => {
      const action = toActionName(ep.method, ep.path);
      const subPath = toAspNetPath(ep.path.replace(new RegExp(`^/?${resource}`), '') || '');
      const pathParams = (ep.path.match(/:(\w+)/g) || []).map(p => `[FromRoute] string ${p.slice(1)}`);
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method) &&
                      ep.requestSchema && Object.keys(ep.requestSchema).length > 0;
      const params = [...pathParams, hasBody ? `[FromBody] ${action}Request body` : null].filter(Boolean).join(', ');
      const routeAttr = subPath ? `("${subPath}")` : '';
      const retObj = buildReturnObj(ep.responseSchema);
      const indent = cfg.minimalHosting ? '    ' : '        ';

      if (cfg.minimalHosting) {
        if (ep.description) ctrlContent += `${indent}// ${ep.description}\n`;
        ctrlContent += `${indent}[${httpAttribute(ep.method)}${routeAttr}]\n`;
        ctrlContent += `${indent}public IActionResult ${action}(${params})\n${indent}{\n`;
        ctrlContent += `${indent}    // TODO: implement logic\n`;
        ctrlContent += `${indent}    return Ok(${retObj});\n${indent}}\n\n`;
      } else {
        if (ep.description) ctrlContent += `${indent}// ${ep.description}\n`;
        ctrlContent += `${indent}[${httpAttribute(ep.method)}${routeAttr}]\n`;
        ctrlContent += `${indent}public IActionResult ${action}(${params})\n${indent}{\n`;
        ctrlContent += `${indent}    // TODO: implement logic\n`;
        ctrlContent += `${indent}    return Ok(${retObj});\n${indent}}\n\n`;
      }
    });

    ctrlContent += cfg.minimalHosting ? '}\n' : '    }\n}\n';
    files[`Controllers/${ctrl}Controller.cs`] = ctrlContent;
  }

  return files;
}

module.exports = { buildCsharpFiles, buildCsharpConnString };
