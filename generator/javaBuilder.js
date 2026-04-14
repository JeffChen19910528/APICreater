// ─── Java Spring Boot Code Generator ─────────────────────────────────────────

// ─── Version Configurations ───────────────────────────────────────────────────

const JAVA_VERSION_CONFIG = {
  springboot3: {
    springBootVersion: '3.2.0',
    javaVersion: '17',
    groupId: '',          // filled at runtime
    jakartaImport: true,  // Spring Boot 3 uses jakarta.*
    label: 'Spring Boot 3.2 (Java 17)'
  },
  springboot2: {
    springBootVersion: '2.7.18',
    javaVersion: '11',
    groupId: '',
    jakartaImport: false, // Spring Boot 2 uses javax.*
    label: 'Spring Boot 2.7 (Java 11)'
  }
};

// ─── Type Mapping ─────────────────────────────────────────────────────────────

function toJavaType(val) {
  if (typeof val === 'object' && val !== null) return 'Object';
  switch (val) {
    case 'string':  return 'String';
    case 'int':     return 'Integer';
    case 'number':  return 'Double';
    case 'boolean': return 'Boolean';
    case 'array':   return 'java.util.List<Object>';
    default:        return 'Object';
  }
}

function toJavaDefault(val) {
  if (typeof val === 'object' && val !== null) return 'null';
  switch (val) {
    case 'string':  return '"example"';
    case 'int':     return '0';
    case 'number':  return '0.0';
    case 'boolean': return 'false';
    case 'array':   return 'new java.util.ArrayList<>()';
    default:        return 'null';
  }
}

// ─── Naming helpers ───────────────────────────────────────────────────────────

function toPascal(str) {
  return str.split(/[_\-\/\s]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

function toCamel(str) {
  const p = toPascal(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function toPackageName(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toActionName(method, path) {
  const parts = path.replace(/^\//, '').split('/').map(p =>
    p.startsWith(':') ? 'By' + toPascal(p.slice(1)) : toPascal(p)
  );
  return toCamel(method.toLowerCase()) + parts.slice(1).join('');
}

function toSpringPath(path) {
  return path.replace(/:(\w+)/g, '{$1}');
}

function httpAnnotation(method) {
  return {
    GET:    '@GetMapping',
    POST:   '@PostMapping',
    PUT:    '@PutMapping',
    PATCH:  '@PatchMapping',
    DELETE: '@DeleteMapping'
  }[method] || '@GetMapping';
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

// ─── Build POJO fields ────────────────────────────────────────────────────────

function buildFields(schema, indent = '    ') {
  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) return '';
  return Object.entries(schema).map(([key, val]) => {
    const jType = toJavaType(val);
    const defVal = toJavaDefault(val);
    return `${indent}private ${jType} ${toCamel(key)} = ${defVal};`;
  }).join('\n');
}

function buildGettersSetters(schema, indent = '    ') {
  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) return '';
  return Object.entries(schema).map(([key, val]) => {
    const jType = toJavaType(val);
    const fieldName = toCamel(key);
    const propName = toPascal(key);
    return [
      `${indent}public ${jType} get${propName}() { return ${fieldName}; }`,
      `${indent}public void set${propName}(${jType} ${fieldName}) { this.${fieldName} = ${fieldName}; }`
    ].join('\n');
  }).join('\n\n');
}

function buildReturnMap(schema) {
  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) {
    return 'java.util.Map.of("message", "ok")';
  }
  const entries = Object.entries(schema).map(([k, v]) => {
    return `"${toCamel(k)}", ${toJavaDefault(v)}`;
  });
  // Map.of supports up to 10 key-value pairs
  if (entries.length <= 10) {
    return `java.util.Map.of(${entries.join(', ')})`;
  }
  // Fallback for larger maps
  const lines = entries.map(e => `            map.put(${e});`).join('\n');
  return `(java.util.function.Supplier<java.util.Map<String,Object>>) (() -> {\n` +
    `            java.util.Map<String,Object> map = new java.util.LinkedHashMap<>();\n` +
    `${lines}\n            return map;\n        }).get()`;
}

// ─── pom.xml ──────────────────────────────────────────────────────────────────

function buildPom(groupId, artifactId, cfg) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
             https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>${cfg.springBootVersion}</version>
    <relativePath/>
  </parent>

  <groupId>${groupId}</groupId>
  <artifactId>${artifactId}</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>${artifactId}</name>
  <description>Generated by API Generator — ${cfg.label}</description>

  <properties>
    <java.version>${cfg.javaVersion}</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
      <version>${cfg.springBootVersion.startsWith('3') ? '2.3.0' : '1.7.0'}</version>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
`;
}

// ─── Main builder ─────────────────────────────────────────────────────────────

function buildJavaFiles(apis, projectName, version = 'springboot3') {
  const cfg = JAVA_VERSION_CONFIG[version] || JAVA_VERSION_CONFIG.springboot3;
  const files = {};
  const groups = groupByResource(apis);

  const artifactId = projectName.toLowerCase().replace(/[^a-z0-9\-]/g, '-');
  const groupId = `com.${toPackageName(projectName)}`;
  const basePackage = `${groupId}`;
  const basePath = `src/main/java/${basePackage.replace(/\./g, '/')}`;

  // ── pom.xml ──
  files['pom.xml'] = buildPom(groupId, artifactId, cfg);

  // ── Application.java ──
  files[`${basePath}/Application.java`] = `package ${basePackage};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
`;

  // ── application.properties ──
  files['src/main/resources/application.properties'] = `# Generated by API Generator — ${cfg.label}
server.port=8080
spring.application.name=${projectName}
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
`;

  // ── README.md ──
  files['README.md'] = `# ${projectName}

Generated by **API Generator** — ${cfg.label}.

## Requirements

- Java ${cfg.javaVersion}+
- Maven 3.6+

## Getting Started

\`\`\`bash
mvn spring-boot:run
\`\`\`

Swagger UI: http://localhost:8080/swagger-ui.html

## Endpoints

${apis.map(api => `### ${api.method} \`${api.path}\`\n${api.description ? `> ${api.description}\n` : ''}`).join('\n')}
`;

  for (const [resource, endpoints] of Object.entries(groups)) {
    const ctrl = toPascal(resource);
    const controllerPkg = `${basePackage}.controller`;
    const modelPkg = `${basePackage}.model`;
    const controllerPath = `${basePath}/controller`;
    const modelPath = `${basePath}/model`;

    // ── Model POJOs ──
    endpoints.forEach(ep => {
      const action = toPascal(toActionName(ep.method, ep.path));

      // Request model
      if (ep.requestSchema && Object.keys(ep.requestSchema).length > 0) {
        const fields = buildFields(ep.requestSchema);
        const gettersSetters = buildGettersSetters(ep.requestSchema);
        files[`${modelPath}/${action}Request.java`] = `package ${modelPkg};

public class ${action}Request {
${fields}

${gettersSetters}
}
`;
      }

      // Response model
      if (ep.responseSchema && Object.keys(ep.responseSchema).length > 0) {
        const fields = buildFields(ep.responseSchema);
        const gettersSetters = buildGettersSetters(ep.responseSchema);
        files[`${modelPath}/${action}Response.java`] = `package ${modelPkg};

public class ${action}Response {
${fields}

${gettersSetters}
}
`;
      }
    });

    // ── Controller ──
    // Collect needed imports
    const importLines = new Set([
      'import org.springframework.web.bind.annotation.*;',
      'import org.springframework.http.ResponseEntity;'
    ]);

    endpoints.forEach(ep => {
      const action = toPascal(toActionName(ep.method, ep.path));
      if (ep.requestSchema && Object.keys(ep.requestSchema).length > 0)
        importLines.add(`import ${modelPkg}.${action}Request;`);
      if (ep.responseSchema && Object.keys(ep.responseSchema).length > 0)
        importLines.add(`import ${modelPkg}.${action}Response;`);
    });

    let ctrlFile = `package ${controllerPkg};

${[...importLines].join('\n')}

@RestController
@RequestMapping("/${resource}")
public class ${ctrl}Controller {

`;

    endpoints.forEach(ep => {
      const action = toActionName(ep.method, ep.path);
      const actionPascal = toPascal(action);
      const subPath = toSpringPath(ep.path.replace(new RegExp(`^/?${resource}`), '') || '');
      const pathParams = (ep.path.match(/:(\w+)/g) || []).map(p => `@PathVariable String ${p.slice(1)}`);
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method) &&
                      ep.requestSchema && Object.keys(ep.requestSchema).length > 0;
      const params = [
        ...pathParams,
        hasBody ? `@RequestBody ${actionPascal}Request body` : null
      ].filter(Boolean).join(', ');

      const httpAnn = httpAnnotation(ep.method);
      const routeAttr = subPath ? `("${subPath}")` : '';
      const retVal = buildReturnMap(ep.responseSchema);

      if (ep.description) ctrlFile += `    // ${ep.description}\n`;
      ctrlFile += `    ${httpAnn}${routeAttr}\n`;
      ctrlFile += `    public ResponseEntity<?> ${action}(${params}) {\n`;
      ctrlFile += `        // TODO: implement logic\n`;
      ctrlFile += `        return ResponseEntity.ok(${retVal});\n`;
      ctrlFile += `    }\n\n`;
    });

    ctrlFile += `}\n`;
    files[`${controllerPath}/${ctrl}Controller.java`] = ctrlFile;
  }

  return files;
}

module.exports = { buildJavaFiles };
