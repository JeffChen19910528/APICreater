import React, { useState, useEffect } from 'react';
import './CodePreview.css';

const isElectron = () => typeof window !== 'undefined' && window.electronAPI;

// ─── Syntax Highlighters ──────────────────────────────────────────────────────

function escapeHtml(code) {
  return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightJS(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
    .replace(/\b(const|let|var|function|require|module|exports|return|if|else|for|async|await|new)\b/g, '<span class="hl-kw">$1</span>')
    .replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g, '<span class="hl-str">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
}

function highlightPython(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/(#[^\n]*)/g, '<span class="hl-comment">$1</span>')
    .replace(/\b(from|import|def|class|return|if|else|elif|for|in|async|await|True|False|None|with|as)\b/g, '<span class="hl-kw">$1</span>')
    .replace(/(@\w+)/g, '<span class="hl-decorator">$1</span>')
    .replace(/\b(str|int|float|bool|list|dict|Any|Optional|List|BaseModel)\b/g, '<span class="hl-type">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="hl-str">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
}

function highlightCsharp(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
    .replace(/\b(using|namespace|class|public|private|protected|static|void|var|new|return|if|else|string|int|bool|double|object|null)\b/g, '<span class="hl-kw">$1</span>')
    .replace(/(\[[A-Za-z]+[^\]]*\])/g, '<span class="hl-decorator">$1</span>')
    .replace(/\b(IActionResult|ControllerBase|ApiController|FromBody|FromRoute|Ok|NotFound|BadRequest)\b/g, '<span class="hl-type">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-str">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
}

function highlightJava(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
    .replace(/\b(package|import|public|private|protected|class|interface|extends|implements|new|return|if|else|for|while|void|static|final|null|true|false|this|super|throws|throw)\b/g, '<span class="hl-kw">$1</span>')
    .replace(/(@\w+)/g, '<span class="hl-decorator">$1</span>')
    .replace(/\b(String|Integer|Double|Boolean|Object|List|Map|ResponseEntity|RestController|GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping|PathVariable|RequestBody|SpringApplication)\b/g, '<span class="hl-type">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-str">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
}

function highlightJson(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="hl-key">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="hl-str">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="hl-kw">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>');
}

function highlightXml(code) {
  if (!code) return '';
  return escapeHtml(code)
    .replace(/(&lt;\/?[\w.]+)/g, '<span class="hl-kw">$1</span>')
    .replace(/(&gt;)/g, '<span class="hl-kw">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-str">$1</span>');
}

function highlight(code, language, filename) {
  if (!code) return '';
  if (filename && filename.endsWith('.json')) return highlightJson(code);
  if (filename && (filename.endsWith('.csproj') || filename.endsWith('.xml') || filename === 'pom.xml')) return highlightXml(code);
  if (filename && filename.endsWith('.properties')) return highlightJson(code);
  switch (language) {
    case 'python': return highlightPython(code);
    case 'csharp': return highlightCsharp(code);
    case 'java':   return highlightJava(code);
    default:       return highlightJS(code);
  }
}

// ─── Client-side Fallback Generators ────────────────────────────────────────

function buildSampleResponse(schema) {
  if (!schema || typeof schema !== 'object') return {};
  const result = {};
  for (const [key, val] of Object.entries(schema)) {
    if (typeof val === 'object' && !Array.isArray(val)) {
      result[key] = buildSampleResponse(val);
    } else {
      switch (val) {
        case 'string': result[key] = 'example'; break;
        case 'int': case 'number': result[key] = 0; break;
        case 'boolean': result[key] = true; break;
        case 'array': result[key] = []; break;
        default: result[key] = null;
      }
    }
  }
  return result;
}

function toHandlerName(method, path) {
  const parts = path.replace(/^\//, '').split('/').map(p =>
    p.startsWith(':') ? 'By' + p.slice(1).charAt(0).toUpperCase() + p.slice(2) : p
  );
  const suffix = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return method.toLowerCase() + suffix;
}

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

function toPascal(str) {
  return str.split(/[_\-\/]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

// Node.js fallback
function generateNodeFallback(apis, projectName) {
  const files = {};
  const groups = groupByResource(apis);
  const routeImports = Object.keys(groups).map(r =>
    `app.use('/${r}', require('./routes/${r}Route'));`
  ).join('\n');

  files['app.js'] = `const express = require('express');\nconst app = express();\nconst port = process.env.PORT || 3000;\n\napp.use(express.json());\n\n// Routes\n${routeImports}\n\napp.listen(port, () => console.log('${projectName} running on port ' + port));\nmodule.exports = app;`;
  files['package.json'] = JSON.stringify({ name: projectName, version: '1.0.0', main: 'app.js', scripts: { start: 'node app.js' }, dependencies: { express: '^4.18.2' } }, null, 2);

  for (const [resource, endpoints] of Object.entries(groups)) {
    const enriched = endpoints.map(ep => ({
      ...ep,
      subPath: ep.path.replace(new RegExp(`^/?${resource}`), '') || '/',
      handlerName: toHandlerName(ep.method, ep.path)
    }));
    files[`routes/${resource}Route.js`] = `const express = require('express');\nconst router = express.Router();\nconst ctrl = require('../controllers/${resource}Controller');\n\n${enriched.map(ep => `router.${ep.method.toLowerCase()}('${ep.subPath}', ctrl.${ep.handlerName});`).join('\n')}\n\nmodule.exports = router;`;
    files[`controllers/${resource}Controller.js`] = enriched.map(ep =>
      `// ${ep.method} ${ep.path}\nexports.${ep.handlerName} = (req, res) => {\n  res.json(${JSON.stringify(buildSampleResponse(ep.responseSchema), null, 2)});\n};`
    ).join('\n\n');
    files[`models/${resource}Model.js`] = `// Model: ${resource}\n` + endpoints.map(ep =>
      `// ${ep.method} ${ep.path}\n// Request: ${JSON.stringify(ep.requestSchema)}\n// Response: ${JSON.stringify(ep.responseSchema)}`
    ).join('\n\n');
  }
  return files;
}

// Python fallback
function toPythonType(val) {
  const map = { string: 'str', int: 'int', number: 'float', boolean: 'bool', array: 'list' };
  return map[val] || 'Any';
}
function toPythonSample(val) {
  const map = { string: '"example"', int: '0', number: '0.0', boolean: 'True', array: '[]' };
  return map[val] || 'None';
}
function toFastAPIPath(path) { return path.replace(/:(\w+)/g, '{$1}'); }
function toSnake(method, path) {
  const parts = path.replace(/^\//, '').split('/').map(p => p.startsWith(':') ? 'by_' + p.slice(1) : p);
  return method.toLowerCase() + '_' + parts.join('_').replace(/[^a-z0-9_]/g, '');
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function generatePythonFallback(apis, projectName) {
  const files = {};
  const groups = groupByResource(apis);

  files['main.py'] = `from fastapi import FastAPI\n${Object.keys(groups).map(r => `from routers import ${r}`).join('\n')}\n\napp = FastAPI(title="${projectName}")\n\n${Object.keys(groups).map(r => `app.include_router(${r}.router, prefix="/${r}", tags=["${r}"])`).join('\n')}\n\n@app.get("/")\ndef root():\n    return {"message": "${projectName} is running"}\n`;
  files['requirements.txt'] = `fastapi>=0.115.0\nuvicorn[standard]>=0.30.0\npydantic>=2.0.0\n`;
  files['routers/__init__.py'] = '';
  files['models/__init__.py'] = '';

  for (const [resource, endpoints] of Object.entries(groups)) {
    let modelContent = `from pydantic import BaseModel\nfrom typing import Any, Optional, List\n\n`;
    let routerContent = `from fastapi import APIRouter\nfrom typing import Any\n\nrouter = APIRouter()\n\n`;

    endpoints.forEach(ep => {
      const handler = toSnake(ep.method, ep.path);
      const subPath = toFastAPIPath(ep.path.replace(new RegExp(`^/?${resource}`), '') || '/');
      const pathParams = (ep.path.match(/:(\w+)/g) || []).map(p => `${p.slice(1)}: str`);
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method) && ep.requestSchema && Object.keys(ep.requestSchema).length > 0;

      // Model
      if (ep.requestSchema && Object.keys(ep.requestSchema).length > 0) {
        const fields = Object.entries(ep.requestSchema).map(([k, v]) => `    ${k}: ${toPythonType(v)} = ${toPythonSample(v)}`).join('\n');
        modelContent += `class ${capitalize(handler)}Request(BaseModel):\n${fields}\n\n`;
      }
      if (ep.responseSchema && Object.keys(ep.responseSchema).length > 0) {
        const fields = Object.entries(ep.responseSchema).map(([k, v]) => `    ${k}: ${toPythonType(v)} = ${toPythonSample(v)}`).join('\n');
        modelContent += `class ${capitalize(handler)}Response(BaseModel):\n${fields}\n\n`;
      }

      const params = [...pathParams, hasBody ? `body: ${capitalize(handler)}Request` : null].filter(Boolean).join(', ');
      const ret = ep.responseSchema && Object.keys(ep.responseSchema).length > 0
        ? '{' + Object.entries(ep.responseSchema).map(([k, v]) => `"${k}": ${toPythonSample(v)}`).join(', ') + '}'
        : '{"message": "ok"}';
      routerContent += `@router.${ep.method.toLowerCase()}("${subPath || '/'}")\ndef ${handler}(${params}):\n    return ${ret}\n\n`;
    });

    files[`models/${resource}.py`] = modelContent;
    files[`routers/${resource}.py`] = routerContent;
  }
  files['README.md'] = `# ${projectName}\n\nGenerated by **API Generator** — Python FastAPI.\n\n## Getting Started\n\n\`\`\`bash\npip install -r requirements.txt\nuvicorn main:app --reload\n\`\`\`\n\nSwagger UI: http://localhost:8000/docs\n`;
  return files;
}

// C# fallback
function toCsType(val) {
  const map = { string: 'string', int: 'int', number: 'double', boolean: 'bool', array: 'List<object>' };
  return map[val] || 'object';
}
function toCsDefault(val) {
  const map = { string: '"example"', int: '0', number: '0.0', boolean: 'false', array: 'new List<object>()' };
  return map[val] || 'null';
}
function toAspNetPath(path) { return path.replace(/:(\w+)/g, '{$1}'); }
function toActionName(method, path) {
  const parts = path.replace(/^\//, '').split('/').map(p =>
    p.startsWith(':') ? 'By' + toPascal(p.slice(1)) : toPascal(p)
  );
  return toPascal(method.toLowerCase()) + parts.slice(1).join('');
}
function httpAttr(method) {
  return { GET: 'HttpGet', POST: 'HttpPost', PUT: 'HttpPut', PATCH: 'HttpPatch', DELETE: 'HttpDelete' }[method] || 'HttpGet';
}

function generateCsharpFallback(apis, projectName) {
  const files = {};
  const safeProject = toPascal(projectName.replace(/[^a-zA-Z0-9_\-]/g, '_'));
  const groups = groupByResource(apis);

  files['Program.cs'] = `var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddControllers();\nbuilder.Services.AddEndpointsApiExplorer();\nbuilder.Services.AddSwaggerGen();\n\nvar app = builder.Build();\nif (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }\n\napp.UseHttpsRedirection();\napp.UseAuthorization();\napp.MapControllers();\napp.Run();\n`;
  files[`${safeProject}.csproj`] = `<Project Sdk="Microsoft.NET.Sdk.Web">\n  <PropertyGroup>\n    <TargetFramework>net8.0</TargetFramework>\n    <Nullable>enable</Nullable>\n    <ImplicitUsings>enable</ImplicitUsings>\n  </PropertyGroup>\n  <ItemGroup>\n    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />\n  </ItemGroup>\n</Project>\n`;
  files['appsettings.json'] = JSON.stringify({ Logging: { LogLevel: { Default: 'Information', 'Microsoft.AspNetCore': 'Warning' } }, AllowedHosts: '*' }, null, 2);

  for (const [resource, endpoints] of Object.entries(groups)) {
    const ctrl = toPascal(resource);
    let modelContent = `namespace ${safeProject}.Models;\n\n`;
    let ctrlContent = `using Microsoft.AspNetCore.Mvc;\nusing ${safeProject}.Models;\n\nnamespace ${safeProject}.Controllers;\n\n[ApiController]\n[Route("[controller]")]\npublic class ${ctrl}Controller : ControllerBase\n{\n`;

    endpoints.forEach(ep => {
      const action = toActionName(ep.method, ep.path);
      const subPath = toAspNetPath(ep.path.replace(new RegExp(`^/?${resource}`), '') || '');
      const pathParams = (ep.path.match(/:(\w+)/g) || []).map(p => `[FromRoute] string ${p.slice(1)}`);
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method) && ep.requestSchema && Object.keys(ep.requestSchema).length > 0;

      if (ep.requestSchema && Object.keys(ep.requestSchema).length > 0) {
        const props = Object.entries(ep.requestSchema).map(([k, v]) => `    public ${toCsType(v)} ${toPascal(k)} { get; set; } = ${toCsDefault(v)};`).join('\n');
        modelContent += `public class ${action}Request\n{\n${props}\n}\n\n`;
      }
      if (ep.responseSchema && Object.keys(ep.responseSchema).length > 0) {
        const props = Object.entries(ep.responseSchema).map(([k, v]) => `    public ${toCsType(v)} ${toPascal(k)} { get; set; } = ${toCsDefault(v)};`).join('\n');
        modelContent += `public class ${action}Response\n{\n${props}\n}\n\n`;
      }

      const params = [...pathParams, hasBody ? `[FromBody] ${action}Request body` : null].filter(Boolean).join(', ');
      const routeAttr = subPath ? `("${subPath}")` : '("")';
      const retObj = ep.responseSchema && Object.keys(ep.responseSchema).length > 0
        ? `new { ${Object.entries(ep.responseSchema).map(([k, v]) => `${toPascal(k)} = ${toCsDefault(v)}`).join(', ')} }`
        : 'new { message = "ok" }';

      ctrlContent += `    [${httpAttr(ep.method)}${routeAttr}]\n    public IActionResult ${action}(${params})\n    {\n        return Ok(${retObj});\n    }\n\n`;
    });

    ctrlContent += `}\n`;
    files[`Models/${ctrl}Models.cs`] = modelContent;
    files[`Controllers/${ctrl}Controller.cs`] = ctrlContent;
  }
  files['README.md'] = `# ${projectName}\n\nGenerated by **API Generator** — C# ASP.NET Core 8.\n\n## Getting Started\n\n\`\`\`bash\ndotnet restore\ndotnet run\n\`\`\`\n\nSwagger UI: https://localhost:5001/swagger\n`;
  return files;
}

// Java fallback
function toJavaType(val) {
  const map = { string: 'String', int: 'Integer', number: 'Double', boolean: 'Boolean', array: 'java.util.List<Object>' };
  return map[val] || 'Object';
}
function toJavaDefault(val) {
  const map = { string: '"example"', int: '0', number: '0.0', boolean: 'false', array: 'new java.util.ArrayList<>()' };
  return map[val] || 'null';
}
function toJavaCamel(str) {
  const p = toPascal(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
}
function toJavaActionCamel(method, path) {
  const parts = path.replace(/^\//, '').split('/').map(p =>
    p.startsWith(':') ? 'By' + toPascal(p.slice(1)) : toPascal(p)
  );
  return toJavaCamel(method.toLowerCase() + parts.slice(1).join(''));
}
function httpJavaAnn(method) {
  return { GET: '@GetMapping', POST: '@PostMapping', PUT: '@PutMapping', PATCH: '@PatchMapping', DELETE: '@DeleteMapping' }[method] || '@GetMapping';
}
function toSpringPath(path) { return path.replace(/:(\w+)/g, '{$1}'); }

function generateJavaFallback(apis, projectName) {
  const files = {};
  const groups = groupByResource(apis);
  const packageName = `com.${projectName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const basePath = `src/main/java/${packageName.replace(/\./g, '/')}`;

  files['pom.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">\n  <modelVersion>4.0.0</modelVersion>\n  <parent>\n    <groupId>org.springframework.boot</groupId>\n    <artifactId>spring-boot-starter-parent</artifactId>\n    <version>3.2.0</version>\n    <relativePath/>\n  </parent>\n  <groupId>${packageName}</groupId>\n  <artifactId>${projectName.toLowerCase().replace(/[^a-z0-9\-]/g, '-')}</artifactId>\n  <version>0.0.1-SNAPSHOT</version>\n  <properties><java.version>17</java.version></properties>\n  <dependencies>\n    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>\n    <dependency><groupId>org.springdoc</groupId><artifactId>springdoc-openapi-starter-webmvc-ui</artifactId><version>2.3.0</version></dependency>\n  </dependencies>\n  <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>\n</project>\n`;

  files[`${basePath}/Application.java`] = `package ${packageName};\n\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\n\n@SpringBootApplication\npublic class Application {\n    public static void main(String[] args) {\n        SpringApplication.run(Application.class, args);\n    }\n}\n`;
  files['src/main/resources/application.properties'] = `server.port=8080\nspring.application.name=${projectName}\nspringdoc.swagger-ui.path=/swagger-ui.html\n`;

  for (const [resource, endpoints] of Object.entries(groups)) {
    const ctrl = toPascal(resource);
    const controllerPkg = `${packageName}.controller`;
    const modelPkg = `${packageName}.model`;
    const controllerPath = `${basePath}/controller`;
    const modelPath = `${basePath}/model`;

    let ctrlContent = `package ${controllerPkg};\n\nimport org.springframework.web.bind.annotation.*;\nimport org.springframework.http.ResponseEntity;\n\n@RestController\n@RequestMapping("/${resource}")\npublic class ${ctrl}Controller {\n\n`;

    endpoints.forEach(ep => {
      const action = toJavaActionCamel(ep.method, ep.path);
      const actionPascal = toPascal(action);
      const subPath = toSpringPath(ep.path.replace(new RegExp(`^/?${resource}`), '') || '');
      const pathParams = (ep.path.match(/:(\w+)/g) || []).map(p => `@PathVariable String ${p.slice(1)}`);
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method) && ep.requestSchema && Object.keys(ep.requestSchema).length > 0;

      // Model files
      if (ep.requestSchema && Object.keys(ep.requestSchema).length > 0) {
        const fields = Object.entries(ep.requestSchema).map(([k, v]) => `    private ${toJavaType(v)} ${toJavaCamel(k)} = ${toJavaDefault(v)};`).join('\n');
        const getsets = Object.entries(ep.requestSchema).map(([k, v]) => `    public ${toJavaType(v)} get${toPascal(k)}() { return ${toJavaCamel(k)}; }\n    public void set${toPascal(k)}(${toJavaType(v)} ${toJavaCamel(k)}) { this.${toJavaCamel(k)} = ${toJavaCamel(k)}; }`).join('\n\n');
        files[`${modelPath}/${actionPascal}Request.java`] = `package ${modelPkg};\n\npublic class ${actionPascal}Request {\n${fields}\n\n${getsets}\n}\n`;
      }
      if (ep.responseSchema && Object.keys(ep.responseSchema).length > 0) {
        const fields = Object.entries(ep.responseSchema).map(([k, v]) => `    private ${toJavaType(v)} ${toJavaCamel(k)} = ${toJavaDefault(v)};`).join('\n');
        const getsets = Object.entries(ep.responseSchema).map(([k, v]) => `    public ${toJavaType(v)} get${toPascal(k)}() { return ${toJavaCamel(k)}; }\n    public void set${toPascal(k)}(${toJavaType(v)} ${toJavaCamel(k)}) { this.${toJavaCamel(k)} = ${toJavaCamel(k)}; }`).join('\n\n');
        files[`${modelPath}/${actionPascal}Response.java`] = `package ${modelPkg};\n\npublic class ${actionPascal}Response {\n${fields}\n\n${getsets}\n}\n`;
      }

      const params = [...pathParams, hasBody ? `@RequestBody ${actionPascal}Request body` : null].filter(Boolean).join(', ');
      const routeAttr = subPath ? `("${subPath}")` : '';
      const retEntries = ep.responseSchema && Object.keys(ep.responseSchema).length > 0
        ? Object.entries(ep.responseSchema).map(([k, v]) => `"${toJavaCamel(k)}", ${toJavaDefault(v)}`).join(', ')
        : '"message", "ok"';
      const retVal = `java.util.Map.of(${retEntries})`;

      ctrlContent += `    ${httpJavaAnn(ep.method)}${routeAttr}\n    public ResponseEntity<?> ${action}(${params}) {\n        return ResponseEntity.ok(${retVal});\n    }\n\n`;
    });

    ctrlContent += `}\n`;
    files[`${controllerPath}/${ctrl}Controller.java`] = ctrlContent;
  }
  files['README.md'] = `# ${projectName}\n\nGenerated by **API Generator** — Java Spring Boot 3.2.\n\n## Getting Started\n\n\`\`\`bash\nmvn spring-boot:run\n\`\`\`\n\nSwagger UI: http://localhost:8080/swagger-ui.html\n`;
  return files;
}

function generateClientSide(apis, projectName, language) {
  switch (language) {
    case 'python': return generatePythonFallback(apis, projectName);
    case 'csharp': return generateCsharpFallback(apis, projectName);
    case 'java':   return generateJavaFallback(apis, projectName);
    default:       return generateNodeFallback(apis, projectName);
  }
}

// ─── File Tree Groups ─────────────────────────────────────────────────────────

function getFileGroups(files, language) {
  const keys = Object.keys(files);
  if (language === 'python') {
    return {
      'Root': keys.filter(f => !f.includes('/')),
      'Routers': keys.filter(f => f.startsWith('routers/')),
      'Models': keys.filter(f => f.startsWith('models/'))
    };
  }
  if (language === 'csharp') {
    return {
      'Root': keys.filter(f => !f.includes('/')),
      'Controllers': keys.filter(f => f.startsWith('Controllers/')),
      'Models': keys.filter(f => f.startsWith('Models/'))
    };
  }
  if (language === 'java') {
    return {
      'Root': keys.filter(f => !f.includes('/') || f === 'pom.xml'),
      'Application': keys.filter(f => f.endsWith('Application.java') || f.endsWith('application.properties')),
      'Controllers': keys.filter(f => f.includes('/controller/')),
      'Models': keys.filter(f => f.includes('/model/'))
    };
  }
  return {
    'Root': keys.filter(f => !f.includes('/')),
    'Routes': keys.filter(f => f.startsWith('routes/')),
    'Controllers': keys.filter(f => f.startsWith('controllers/')),
    'Models': keys.filter(f => f.startsWith('models/'))
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CodePreview({ apis, projectName, language, version }) {
  const [files, setFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePreview = async () => {
    if (!apis || apis.length === 0) {
      setFiles({});
      setError('尚無 API，請先在「API 設計器」新增 API。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let preview;
      if (isElectron()) {
        const result = await window.electronAPI.previewCode({ apis, projectName, language, version });
        if (!result.success) throw new Error(result.error);
        preview = result.preview;
      } else {
        preview = generateClientSide(apis, projectName, language, version);
      }
      setFiles(preview);
      setSelectedFile(Object.keys(preview)[0] || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePreview();
    // eslint-disable-next-line
  }, [apis, projectName, language, version]);

  const fileGroups = getFileGroups(files, language);

  const langLabel = { nodejs: 'Node.js', python: 'Python', csharp: 'C#', java: 'Java' }[language] || language;

  return (
    <div className="code-preview">
      <div className="preview-sidebar">
        <div className="preview-header">
          <span className="preview-title">程式碼預覽 <span className="lang-tag">{langLabel}</span></span>
          <button className="refresh-btn" onClick={generatePreview} disabled={loading}>
            {loading ? '載入...' : '重整'}
          </button>
        </div>
        <div className="file-tree">
          {error ? (
            <div className="preview-error">{error}</div>
          ) : (
            Object.entries(fileGroups).map(([group, groupFiles]) =>
              groupFiles.length > 0 && (
                <div key={group} className="file-group">
                  <div className="file-group-label">{group}</div>
                  {groupFiles.map(f => (
                    <button
                      key={f}
                      className={`file-item ${selectedFile === f ? 'active' : ''}`}
                      onClick={() => setSelectedFile(f)}
                    >
                      <span className="file-icon">{fileIcon(f)}</span>
                      <span className="file-name">{f.split('/').pop()}</span>
                    </button>
                  ))}
                </div>
              )
            )
          )}
        </div>
      </div>

      <div className="code-area">
        {selectedFile && files[selectedFile] !== undefined ? (
          <>
            <div className="code-tab-bar">
              <span className="code-tab active">{selectedFile}</span>
            </div>
            <div className="code-scroll">
              <pre
                className="code-content"
                dangerouslySetInnerHTML={{ __html: highlight(files[selectedFile], language, selectedFile) }}
              />
            </div>
          </>
        ) : (
          <div className="code-placeholder">
            {apis.length === 0 ? '請先在 API 設計器新增 API' : '選擇左側檔案查看程式碼'}
          </div>
        )}
      </div>
    </div>
  );
}

function fileIcon(filename) {
  if (filename.endsWith('.py')) return 'py';
  if (filename.endsWith('.cs')) return 'cs';
  if (filename.endsWith('.java')) return 'java';
  if (filename.endsWith('.json')) return '{}';
  if (filename.endsWith('.csproj') || filename === 'pom.xml') return 'xml';
  if (filename.endsWith('.txt')) return 'txt';
  if (filename.endsWith('.md')) return 'md';
  if (filename.endsWith('.properties')) return 'cfg';
  return 'js';
}
