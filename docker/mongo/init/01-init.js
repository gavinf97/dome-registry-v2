// MongoDB initialisation — runs once on first container start
// Creates collections with JSON Schema validation

db = db.getSiblingDB('dome-registry-v2');

// ── Users collection ──────────────────────────────────────────────────────
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['orcid', 'roles', 'createdAt'],
      properties: {
        orcid: {
          bsonType: 'string',
          pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$',
          description: 'ORCID iD — required, unique primary key'
        },
        roles: {
          bsonType: 'array',
          minItems: 1,
          items: { bsonType: 'string', enum: ['user', 'admin', 'journal_owner'] }
        }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'error'
});

db.users.createIndex({ orcid: 1 }, { unique: true });

// ── Registry entries collection ───────────────────────────────────────────
db.createCollection('registry', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['uuid', 'shortid', 'user', 'created', 'updated', 'moderationStatus'],
      properties: {
        uuid: { bsonType: 'string' },
        shortid: { bsonType: 'string' },
        user: {
          bsonType: 'string',
          pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$',
          description: 'ORCID iD of creator'
        },
        moderationStatus: {
          bsonType: 'string',
          enum: ['draft', 'pending', 'public', 'held', 'rejected']
        }
      }
    }
  },
  validationLevel: 'moderate',
  validationAction: 'error'
});

db.registry.createIndex({ uuid: 1 }, { unique: true });
db.registry.createIndex({ shortid: 1 }, { unique: true });
db.registry.createIndex({ user: 1 });
db.registry.createIndex({ moderationStatus: 1 });
db.registry.createIndex({ 'publication.title': 'text', tags: 'text' });

// ── Version history collection ────────────────────────────────────────────
db.createCollection('versions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['entryId', 'schemaVersion', 'editedBy', 'editedAt'],
      properties: {
        entryId: { bsonType: 'string' },
        schemaVersion: { bsonType: 'string' },
        editedBy: {
          bsonType: 'string',
          pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$'
        },
        editedAt: { bsonType: 'string' }
      }
    }
  }
});

db.versions.createIndex({ entryId: 1, editedAt: -1 });

print('DOME Registry V2 — MongoDB initialised successfully.');
