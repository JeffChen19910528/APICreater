// ─── Java Spring Boot Code Generator ─────────────────────────────────────────

const { groupByResource, getTableMeta } = require('./shared');

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

// ─── DB helpers ───────────────────────────────────────────────────────────────

const JAVA_DB_DEPS = {
  mysql: `    <dependency>
      <groupId>com.mysql</groupId>
      <artifactId>mysql-connector-j</artifactId>
      <scope>runtime</scope>
    </dependency>`,
  postgresql: `    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>`,
  sqlite: `    <dependency>
      <groupId>org.xerial</groupId>
      <artifactId>sqlite-jdbc</artifactId>
      <scope>runtime</scope>
    </dependency>`,
  mssql: `    <dependency>
      <groupId>com.microsoft.sqlserver</groupId>
      <artifactId>mssql-jdbc</artifactId>
      <scope>runtime</scope>
    </dependency>`,
  oracle: `    <dependency>
      <groupId>com.oracle.database.jdbc</groupId>
      <artifactId>ojdbc11</artifactId>
      <scope>runtime</scope>
    </dependency>`
};

const JAVA_SPRING_JDBC_DEP = `    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-jdbc</artifactId>
    </dependency>`;

function buildJavaDbProps(dbConfig) {
  const d = dbConfig;
  let url;
  switch (d.type) {
    case 'mysql':
      url = `jdbc:mysql://${d.host||'localhost'}:${d.port||3306}/${d.database||'mydb'}?useSSL=false&serverTimezone=UTC`;
      break;
    case 'postgresql':
      url = `jdbc:postgresql://${d.host||'localhost'}:${d.port||5432}/${d.database||'mydb'}`;
      break;
    case 'sqlite':
      url = `jdbc:sqlite:${(d.filePath||'./database.db').replace(/\\/g,'/')}`;
      break;
    case 'mssql':
      url = `jdbc:sqlserver://${d.host||'localhost'}:${d.port||1433};databaseName=${d.database||'mydb'};trustServerCertificate=true`;
      break;
    case 'oracle':
      url = `jdbc:oracle:thin:@${d.host||'localhost'}:${d.port||1521}:${d.serviceName||'XEPDB1'}`;
      break;
    default:
      url = '';
  }
  const lines = [`spring.datasource.url=${url}`];
  if (d.type !== 'sqlite') {
    lines.push(`spring.datasource.username=${d.username||''}`);
    lines.push(`spring.datasource.password=${d.password||''}`);
  }
  return lines.join('\n');
}

function buildJavaDbController(resource, endpoints, dbConfig, basePackage, cfg) {
  const { tableName, pkCol, nonPkCols } = getTableMeta(endpoints, resource);
  const ctrl = toPascal(resource);
  const controllerPkg = `${basePackage}.controller`;
  const jakartaPrefix = cfg.jakartaImport ? 'jakarta' : 'javax';

  let out = `package ${controllerPkg};\n\n`;
  out += `import org.springframework.web.bind.annotation.*;\n`;
  out += `import org.springframework.beans.factory.annotation.Autowired;\n`;
  out += `import org.springframework.http.ResponseEntity;\n`;
  out += `import org.springframework.jdbc.core.JdbcTemplate;\n`;
  out += `import java.util.List;\nimport java.util.Map;\n\n`;
  out += `@RestController\n@RequestMapping("/${resource}")\npublic class ${ctrl}Controller {\n\n`;
  out += `    @Autowired\n    private JdbcTemplate jdbc;\n\n`;

  for (const ep of endpoints) {
    const action = toActionName(ep.method, ep.path);
    const subPath = toSpringPath(ep.path.replace(new RegExp(`^/?${resource}`), '') || '');
    const httpAnn = httpAnnotation(ep.method);
    const routeAttr = subPath ? `("${subPath}")` : '';
    const isByIdPath = ep.path.includes(':');
    const method = ep.method.toUpperCase();

    if (ep.description) out += `    // ${ep.description}\n`;
    out += `    ${httpAnn}${routeAttr}\n`;

    const pkParam = isByIdPath ? `@PathVariable ${toJavaType('int')} ${pkCol}` : '';
    let bodyParams = '';
    if (['POST', 'PUT', 'PATCH'].includes(method) && nonPkCols.length > 0) {
      bodyParams = nonPkCols.map(c => `@RequestParam(required=false) String ${c.name}`).join(', ');
    }
    const allParams = [pkParam, bodyParams].filter(Boolean).join(', ');

    out += `    public ResponseEntity<?> ${action}(${allParams}) {\n`;

    if (method === 'GET' && !isByIdPath) {
      out += `        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM ${tableName}");\n`;
      out += `        return ResponseEntity.ok(rows);\n`;
    } else if (method === 'GET') {
      out += `        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM ${tableName} WHERE ${pkCol} = ?", ${pkCol});\n`;
      out += `        if (rows.isEmpty()) return ResponseEntity.notFound().build();\n`;
      out += `        return ResponseEntity.ok(rows.get(0));\n`;
    } else if (method === 'POST') {
      if (nonPkCols.length > 0) {
        const cols = nonPkCols.map(c=>c.name).join(', ');
        const ph = nonPkCols.map(()=>'?').join(', ');
        const vals = nonPkCols.map(c=>c.name).join(', ');
        out += `        jdbc.update("INSERT INTO ${tableName} (${cols}) VALUES (${ph})", ${vals});\n`;
        out += `        return ResponseEntity.status(201).body(java.util.Map.of(${nonPkCols.slice(0,10).map(c=>`"${c.name}", ${c.name}`).join(', ')}));\n`;
      } else {
        out += `        return ResponseEntity.status(201).body(java.util.Map.of("message", "Created"));\n`;
      }
    } else if (method === 'PUT' || method === 'PATCH') {
      if (nonPkCols.length > 0) {
        const set = nonPkCols.map(c=>`${c.name} = ?`).join(', ');
        const vals = nonPkCols.map(c=>c.name).join(', ');
        out += `        jdbc.update("UPDATE ${tableName} SET ${set} WHERE ${pkCol} = ?", ${vals}, ${pkCol});\n`;
        out += `        return ResponseEntity.ok(java.util.Map.of("${pkCol}", ${pkCol}));\n`;
      } else {
        out += `        return ResponseEntity.ok(java.util.Map.of("message", "Updated"));\n`;
      }
    } else if (method === 'DELETE') {
      out += `        jdbc.update("DELETE FROM ${tableName} WHERE ${pkCol} = ?", ${pkCol});\n`;
      out += `        return ResponseEntity.ok(java.util.Map.of("message", "Deleted"));\n`;
    }

    out += `    }\n\n`;
  }

  out += `}\n`;
  return out;
}

// ─── pom.xml ──────────────────────────────────────────────────────────────────

function buildPom(groupId, artifactId, cfg, dbConfig) {
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
    ${dbConfig ? JAVA_SPRING_JDBC_DEP + '\n    ' + (JAVA_DB_DEPS[dbConfig.type] || '') : ''}
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

function buildJavaFiles(apis, projectName, version = 'springboot3', dbConfig = null) {
  const cfg = JAVA_VERSION_CONFIG[version] || JAVA_VERSION_CONFIG.springboot3;
  const files = {};
  const groups = groupByResource(apis);

  const artifactId = projectName.toLowerCase().replace(/[^a-z0-9\-]/g, '-');
  const groupId = `com.${toPackageName(projectName)}`;
  const basePackage = `${groupId}`;
  const basePath = `src/main/java/${basePackage.replace(/\./g, '/')}`;

  // ── pom.xml ──
  files['pom.xml'] = buildPom(groupId, artifactId, cfg, dbConfig);

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
  const dbProps = dbConfig ? '\n' + buildJavaDbProps(dbConfig) : '';
  files['src/main/resources/application.properties'] = `# Generated by API Generator — ${cfg.label}
server.port=8080
spring.application.name=${projectName}
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html${dbProps}
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
    const hasTableEndpoint = endpoints.some(ep => ep.tableName);

    // Use JdbcTemplate controller if dbConfig + table endpoints
    if (dbConfig && hasTableEndpoint) {
      files[`${controllerPath}/${ctrl}Controller.java`] = buildJavaDbController(resource, endpoints, dbConfig, basePackage, cfg);
      continue;
    }

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

module.exports = { buildJavaFiles, buildJavaDbProps };
