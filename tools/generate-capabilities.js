'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DEFAULT_SWAGGER = 'https://publicapi.oss.no/swagger/v1.0/swagger.json';
const swaggerUrl = process.argv[2] || DEFAULT_SWAGGER;

function sanitize(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isPrimitiveType(type){
  return ['string','number','integer','boolean'].includes(type);
}

(async function main(){
  console.log('Fetching swagger from', swaggerUrl);
  const res = await axios.get(swaggerUrl);
  const spec = res.data;

  const schemas = spec.definitions || (spec.components && spec.components.schemas) || {};

  const capabilitiesDir = path.resolve(__dirname, '..', 'capabilities');
  ensureDir(capabilitiesDir);

  const mapping = {};
  const capabilityIds = new Set();

  function writeCapability(capId, type, title) {
    const capFile = path.join(capabilitiesDir, `${capId}.json`);
    if (fs.existsSync(capFile)) return;
    const cap = {
      id: capId,
      type: type === 'integer' || type === 'number' ? 'number' : (type === 'boolean' ? 'boolean' : 'string'),
      title: { en: title }
    };
    fs.writeFileSync(capFile, JSON.stringify(cap, null, 2));
  }

  function recurseSchema(schema, prefix) {
    if (!schema) return;
    if (schema.type === 'object' && schema.properties) {
      for (const propName of Object.keys(schema.properties)) {
        const prop = schema.properties[propName];
        const fullPath = prefix ? `${prefix}.${propName}` : propName;
        if (isPrimitiveType(prop.type)) {
          const capId = `oss_${sanitize(fullPath)}`;
          writeCapability(capId, prop.type, fullPath);
          capabilityIds.add(capId);
          mapping[fullPath] = capId;
          // also map short name to cap if not already mapped
          if (!mapping[propName]) mapping[propName] = capId;
        } else if (prop.type === 'array' && prop.items) {
          if (isPrimitiveType(prop.items.type)) {
            const capId = `oss_${sanitize(fullPath)}`;
            writeCapability(capId, prop.items.type, fullPath);
            capabilityIds.add(capId);
            mapping[fullPath] = capId;
            if (!mapping[propName]) mapping[propName] = capId;
          } else {
            recurseSchema(prop.items, fullPath);
          }
        } else if (prop.type === 'object' || prop.properties) {
          recurseSchema(prop, fullPath);
        } else if (prop.$ref) {
          // resolve ref
          const ref = prop.$ref.replace('#/definitions/', '').replace('#/components/schemas/','');
          if (schemas[ref]) recurseSchema(schemas[ref], fullPath);
        }
      }
    }
  }

  for (const schemaName of Object.keys(schemas)) {
    try {
      recurseSchema(schemas[schemaName], schemaName);
    } catch (err) {
      console.warn('Error processing schema', schemaName, err && err.message);
    }
  }

  // Update app.json driver capabilities
  const appJsonPath = path.resolve(__dirname, '..', 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  appJson.drivers = appJson.drivers || [];
  if (appJson.drivers.length === 0) appJson.drivers.push({ id: 'oss-resource', name: { en: 'OSS Resource' }, class: 'sensor', capabilities: [] });
  appJson.drivers[0].capabilities = Array.from(capabilityIds);
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

  // Write mapping file
  const dataDir = path.resolve(__dirname, '..', 'data');
  ensureDir(dataDir);
  fs.writeFileSync(path.join(dataDir, 'capability-mapping.json'), JSON.stringify(mapping, null, 2));

  console.log('Generated', capabilityIds.size, 'capabilities.');
  console.log('Wrote mapping to data/capability-mapping.json');
  console.log('Updated app.json with capabilities.');
})();


// End of file
