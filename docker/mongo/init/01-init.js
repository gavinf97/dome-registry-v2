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

// ── Seed Users ────────────────────────────────────────────────────────────
const now = new Date().toISOString();

db.users.insertMany([
  {
    orcid: '0000-0001-1111-2222',
    displayName: 'Alice Thornton',
    givenName: 'Alice',
    familyName: 'Thornton',
    email: 'alice.thornton@cam.ac.uk',
    organisation: 'University of Cambridge',
    roles: ['user'],
    journalAssignments: [],
    dailyLLMCalls: 0,
    createdAt: now,
    lastLoginAt: now,
  },
  {
    orcid: '0000-0002-2222-3333',
    displayName: 'Marco Rossi',
    givenName: 'Marco',
    familyName: 'Rossi',
    email: 'marco.rossi@unipd.it',
    organisation: 'University of Padua',
    roles: ['user'],
    journalAssignments: [],
    dailyLLMCalls: 0,
    createdAt: now,
    lastLoginAt: now,
  },
  {
    orcid: '0000-0003-3333-4444',
    displayName: 'Sofia Chen',
    givenName: 'Sofia',
    familyName: 'Chen',
    email: 'sofia.chen@mit.edu',
    organisation: 'MIT CSAIL',
    roles: ['user'],
    journalAssignments: [],
    dailyLLMCalls: 0,
    createdAt: now,
    lastLoginAt: now,
  },
  {
    orcid: '0000-0004-4444-5555',
    displayName: 'David Kumar',
    givenName: 'David',
    familyName: 'Kumar',
    email: 'david.kumar@ebi.ac.uk',
    organisation: 'EMBL-EBI',
    roles: ['user'],
    journalAssignments: [],
    dailyLLMCalls: 0,
    createdAt: now,
    lastLoginAt: now,
  },
  {
    orcid: '0000-0005-5555-6666',
    displayName: 'Elena Martinez',
    givenName: 'Elena',
    familyName: 'Martinez',
    email: 'elena.martinez@pasteur.fr',
    organisation: 'Institut Pasteur',
    roles: ['user'],
    journalAssignments: [],
    dailyLLMCalls: 0,
    createdAt: now,
    lastLoginAt: now,
  },
]);

// ── Seed Registry Entries ─────────────────────────────────────────────────
db.registry.insertMany([
  {
    uuid: '11111111-1111-4111-a111-111111111111',
    shortid: 'at001pub',
    user: '0000-0001-1111-2222',
    moderationStatus: 'public',
    isAiGenerated: false,
    public: true,
    score: 82,
    tags: ['deep learning', 'protein structure', 'transformer'],
    created: now,
    updated: now,
    publication: {
      title: 'Transformer-Based Protein Secondary Structure Prediction with Cross-Validation Controls',
      authors: ['Thornton A', 'Kumar D'],
      journal: 'Bioinformatics',
      year: '2024',
      doi: '10.1093/bioinformatics/example001',
    },
    data: {
      provenance: { datasetSource: 'UniProt/Swiss-Prot', pointsPerClass: 4200 },
      dataSplits: { trainTestPoints: '80/20', validationUsed: true },
      availability: { isDataPublic: true, dataUrl: 'https://www.uniprot.org' },
    },
    optimization: {
      algorithm: { algorithmClass: 'Neural network', isAlgorithmNew: false },
      parameters: { numberOfParameters: 86000000, parameterSelectionMethod: 'grid search' },
    },
    model: {
      output: { outputType: 'classification', targetVariable: 'secondary structure class' },
      softwareAvailability: { sourceCodeReleased: true, softwareUrl: 'https://github.com/example/structure-pred' },
    },
    evaluation: {
      method: { evaluationMethod: 'k-fold cross-validation' },
      performanceMeasures: { performanceMetrics: ['accuracy', 'MCC', 'F1'], metricsRepresentative: true },
      confidence: { hasConfidenceIntervals: true, statisticallySignificant: true },
    },
  },
  {
    uuid: '22222222-2222-4222-a222-222222222222',
    shortid: 'mr002pub',
    user: '0000-0002-2222-3333',
    moderationStatus: 'public',
    isAiGenerated: false,
    public: true,
    score: 67,
    tags: ['RNA folding', 'sequence model', 'CNN'],
    created: now,
    updated: now,
    publication: {
      title: 'Convolutional Neural Network Approach for RNA Secondary Structure Prediction',
      authors: ['Rossi M', 'Martinez E'],
      journal: 'Nucleic Acids Research',
      year: '2023',
      doi: '10.1093/nar/example002',
    },
    data: {
      provenance: { datasetSource: 'Rfam', pointsPerClass: 1800 },
      dataSplits: { trainTestPoints: '75/25', validationUsed: true },
    },
    optimization: {
      algorithm: { algorithmClass: 'Convolutional neural network', isAlgorithmNew: false },
      encoding: { dataEncodingMethod: 'one-hot encoding' },
    },
    model: {
      output: { outputType: 'classification', targetVariable: 'base pair probability' },
    },
    evaluation: {
      method: { evaluationMethod: 'independent test set' },
      performanceMeasures: { performanceMetrics: ['AUC', 'precision', 'recall'] },
    },
  },
  {
    uuid: '33333333-3333-4333-a333-333333333333',
    shortid: 'sc003pub',
    user: '0000-0003-3333-4444',
    moderationStatus: 'public',
    isAiGenerated: true,
    public: true,
    score: 55,
    tags: ['gene expression', 'random forest', 'biomarker'],
    created: now,
    updated: now,
    publication: {
      title: 'Random Forest Classification of Cancer Biomarkers from Gene Expression Profiles',
      authors: ['Chen S'],
      journal: 'PLOS Computational Biology',
      year: '2024',
      doi: '10.1371/journal.pcbi.example003',
      pmid: '38000001',
    },
    data: {
      provenance: { datasetSource: 'GEO', pointsPerClass: 350 },
    },
    optimization: {
      algorithm: { algorithmClass: 'Random forest', isAlgorithmNew: false },
      features: { numberOfFeatures: 500, featureSelectionPerformed: true },
    },
    model: {
      output: { outputType: 'classification', targetVariable: 'cancer subtype' },
    },
    evaluation: {
      method: { evaluationMethod: 'leave-one-out cross-validation' },
    },
  },
  {
    uuid: '44444444-4444-4444-a444-444444444444',
    shortid: 'dk004pub',
    user: '0000-0004-4444-5555',
    moderationStatus: 'public',
    isAiGenerated: false,
    public: true,
    score: 88,
    tags: ['variant calling', 'ensemble', 'genomics', 'FAIR'],
    created: now,
    updated: now,
    publication: {
      title: 'Ensemble Methods for Pathogenic Variant Prioritisation in Clinical Genomics',
      authors: ['Kumar D', 'Thornton A', 'Chen S'],
      journal: 'Genome Research',
      year: '2023',
      doi: '10.1101/gr.example004',
    },
    data: {
      provenance: { datasetSource: 'ClinVar + gnomAD', pointsPerClass: 12000 },
      dataSplits: { trainTestPoints: '70/30', validationUsed: true, validationSize: 0.1 },
      redundancy: { splitMethod: 'stratified', setsIndependent: true },
      availability: { isDataPublic: true, dataUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/', dataLicence: 'CC0' },
    },
    optimization: {
      algorithm: { algorithmClass: 'Ensemble (gradient boosting + SVM)', isAlgorithmNew: false },
      parameters: { parameterSelectionMethod: 'Bayesian optimisation' },
      regularization: { regularizationUsed: true, regularizationTechniques: ['L2', 'dropout'] },
      configAvailability: { configReported: true, configUrl: 'https://github.com/example/variant-ensemble' },
    },
    model: {
      interpretability: { interpretabilityType: 'feature importance', xaiMethods: ['SHAP'] },
      output: { outputType: 'binary classification', targetVariable: 'pathogenicity' },
      softwareAvailability: { sourceCodeReleased: true, softwareUrl: 'https://github.com/example/variant-ensemble', softwareLicence: 'MIT' },
    },
    evaluation: {
      method: { evaluationMethod: 'independent hold-out + external benchmark' },
      performanceMeasures: { performanceMetrics: ['AUROC', 'MCC', 'precision@recall'], metricsRepresentative: true },
      comparison: { comparisonPublicMethods: true, comparisonBaselines: true },
      confidence: { hasConfidenceIntervals: true, statisticallySignificant: true, confidenceNumericalValues: '95% CI reported' },
      evaluationAvailability: { rawFilesAvailable: true, rawFilesUrl: 'https://zenodo.org/example', rawFilesLicence: 'CC BY 4.0' },
    },
  },
  {
    uuid: '55555555-5555-4555-a555-555555555555',
    shortid: 'em005drft',
    user: '0000-0005-5555-6666',
    moderationStatus: 'draft',
    isAiGenerated: false,
    public: false,
    score: 28,
    tags: ['drug discovery', 'GNN'],
    created: now,
    updated: now,
    publication: {
      title: 'Graph Neural Networks for Drug-Target Interaction Prediction',
      authors: ['Martinez E'],
      journal: 'Journal of Chemical Information and Modeling',
      year: '2025',
    },
    data: {
      provenance: { datasetSource: 'BindingDB' },
    },
    optimization: {},
    model: {},
    evaluation: {},
  },
  {
    uuid: '66666666-6666-4666-a666-666666666666',
    shortid: 'mr006pend',
    user: '0000-0002-2222-3333',
    moderationStatus: 'pending',
    isAiGenerated: true,
    public: false,
    score: 44,
    tags: ['single-cell', 'clustering', 'dimensionality reduction'],
    created: now,
    updated: now,
    publication: {
      title: 'Self-Supervised Dimensionality Reduction for Single-Cell RNA-seq Clustering',
      authors: ['Rossi M', 'Chen S'],
      journal: 'Cell Systems',
      year: '2024',
      doi: '10.1016/j.cels.example006',
    },
    data: {
      provenance: { datasetSource: 'Human Cell Atlas', pointsPerClass: 8000 },
    },
    optimization: {
      algorithm: { algorithmClass: 'Autoencoder + k-means', isAlgorithmNew: true },
    },
    model: {
      output: { outputType: 'clustering / dimensionality reduction' },
    },
    evaluation: {
      method: { evaluationMethod: 'silhouette score + biological validation' },
    },
  },
  {
    uuid: '77777777-7777-4777-a777-777777777777',
    shortid: 'at007drft',
    user: '0000-0001-1111-2222',
    moderationStatus: 'draft',
    isAiGenerated: false,
    public: false,
    score: 15,
    tags: ['antimicrobial resistance', 'SVM'],
    created: now,
    updated: now,
    publication: {
      title: 'Support Vector Machine Models for Antimicrobial Resistance Prediction from Genomic Data',
      authors: ['Thornton A'],
      journal: 'Microbial Genomics',
      year: '2025',
    },
    data: {},
    optimization: {},
    model: {},
    evaluation: {},
  },
]);

print('DOME Registry V2 — MongoDB initialised successfully.');
print('Seed data: 5 users, 7 registry entries inserted.');
