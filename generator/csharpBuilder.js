// ─── C# ASP.NET Core Code Generator ──────────────────────────────────────────

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

function groupByResource(apis) {
  const groups = {};
  for (const api of apis) {
    const parts = api.path.replace(/^\//, '').split('/');
    const resource = parts[0] || 'Index';
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(api);
  }
  return groups;
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

// ─── Main builder ─────────────────────────────────────────────────────────────

function buildCsharpFiles(apis, projectName, version = 'net8') {
  const cfg = CSHARP_VERSION_CONFIG[version] || CSHARP_VERSION_CONFIG.net8;
  const files = {};
  const groups = groupByResource(apis);
  const safeProjectName = toPascal(projectName.replace(/[^a-zA-Z0-9_\-]/g, '_'));

  // ── Program.cs ──
  if (cfg.minimalHosting) {
    files['Program.cs'] = buildProgramMinimal(safeProjectName, cfg);
  } else {
    files['Program.cs'] = buildProgramLegacy(safeProjectName);
    files['Startup.cs'] = buildStartupLegacy(safeProjectName);
  }

  // ── .csproj ──
  files[`${safeProjectName}.csproj`] = buildCsproj(safeProjectName, cfg);

  // ── appsettings.json ──
  files['appsettings.json'] = JSON.stringify({
    Logging: {
      LogLevel: { Default: 'Information', 'Microsoft.AspNetCore': 'Warning' }
    },
    AllowedHosts: '*'
  }, null, 2);

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

module.exports = { buildCsharpFiles };
