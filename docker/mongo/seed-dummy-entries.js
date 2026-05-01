/**
 * Seed script — inserts 15 realistic dummy DOME registry entries.
 * Run via: docker exec dome-registry-v2-mongodb-1 mongosh dome-registry-v2 /seed/seed-dummy-entries.js
 *
 * All entries are moderationStatus: 'public' so they appear in the browse page.
 * Scores are spread across the three traffic-light tiers (high/partial/low).
 */

const journals = [
  'Nature Methods', 'Bioinformatics', 'GigaScience', 'Nucleic Acids Research',
  'BMC Bioinformatics', 'PLOS Computational Biology', 'Briefings in Bioinformatics',
  'Journal of Chemical Information and Modeling',
];

const tagPool = [
  'protein', 'RNA', 'genomics', 'deep learning', 'random forest', 'drug discovery',
  'structural biology', 'NLP', 'image classification', 'variant calling',
  'methylation', 'single-cell', 'metabolomics', 'sequence alignment', 'phenotype',
];

const papers = [
  { title: 'DeepFold: Protein structure prediction with deep learning', authors: 'Zhang Y, Chen L, Wang H', year: '2024', doi: '10.1234/deepfold2024', score: 88, tags: ['protein', 'deep learning', 'structural biology'] },
  { title: 'RNA-LM: Language models for non-coding RNA classification', authors: 'Smith J, Brown A, Li X', year: '2023', doi: '10.1234/rnalm2023', score: 72, tags: ['RNA', 'NLP', 'deep learning'] },
  { title: 'VariantNet: CNN-based pathogenicity prediction for genomic variants', authors: 'Kumar R, Patel S, O\'Brien T', year: '2024', doi: '10.1234/variantnet2024', score: 95, tags: ['variant calling', 'deep learning', 'genomics'] },
  { title: 'MetaboRF: Random forest ensemble for metabolite identification', authors: 'Garcia M, Anderson K, Nguyen P', year: '2022', doi: '10.1234/metaborf2022', score: 55, tags: ['metabolomics', 'random forest'] },
  { title: 'CellAtlas: Single-cell transcriptomics classification pipeline', authors: 'Lee S, Kim D, Tanaka Y', year: '2023', doi: '10.1234/cellatlas2023', score: 81, tags: ['single-cell', 'deep learning', 'genomics'] },
  { title: 'DrugGNN: Graph neural networks for drug-target interaction', authors: 'Wilson E, Martinez J, Liu W', year: '2024', doi: '10.1234/druggnn2024', score: 34, tags: ['drug discovery', 'deep learning'] },
  { title: 'MethylPredict: Genome-wide DNA methylation pattern analysis', authors: 'Johnson R, Taylor M, White C', year: '2022', doi: '10.1234/methylpredict2022', score: 68, tags: ['methylation', 'genomics', 'random forest'] },
  { title: 'ProteinBERT: Pre-trained transformer for protein function prediction', authors: 'Brandes N, Ofer D, Linial M', year: '2023', doi: '10.1234/proteinbert2023', score: 91, tags: ['protein', 'NLP', 'deep learning'] },
  { title: 'SeqAlign-ML: Machine learning-enhanced multiple sequence alignment', authors: 'Feng Y, Zhou X, Huang T', year: '2024', doi: '10.1234/seqalignml2024', score: 42, tags: ['sequence alignment', 'deep learning'] },
  { title: 'PhenoMap: Phenotype prediction from clinical text using NLP', authors: 'Adams B, Clark S, Robinson H', year: '2023', doi: '10.1234/phenomap2023', score: 76, tags: ['phenotype', 'NLP'] },
  { title: 'StructVAE: Variational autoencoders for molecular generation', authors: 'Wang Q, Sun L, Zhao D', year: '2024', doi: '10.1234/structvae2024', score: 29, tags: ['drug discovery', 'deep learning', 'structural biology'] },
  { title: 'GenomicXGBoost: Boosted trees for regulatory element prediction', authors: 'Miller T, Davis P, Harris N', year: '2022', doi: '10.1234/genomicxgb2022', score: 63, tags: ['genomics', 'random forest'] },
  { title: 'scImageNet: Deep learning for microscopy image classification', authors: 'Thompson E, Yang H, Park J', year: '2023', doi: '10.1234/scimagenet2023', score: 85, tags: ['image classification', 'deep learning', 'single-cell'] },
  { title: 'RiboDetect: Ribosome profiling analysis with neural networks', authors: 'Ivanova A, Petrov B, Smirnov K', year: '2024', doi: '10.1234/ribodetect2024', score: 47, tags: ['RNA', 'deep learning', 'genomics'] },
  { title: 'ChemInformGCN: Graph convolutions for QSAR modelling', authors: 'Lopez F, Santos R, Duarte M', year: '2022', doi: '10.1234/cheminformgcn2022', score: 18, tags: ['drug discovery', 'deep learning'] },
];

function makeShortid() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function makeUUID() {
  const h = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `${h()}${h()}-${h()}-4${h().substring(1)}-${(0x8 + Math.floor(Math.random() * 4)).toString(16)}${h().substring(1)}-${h()}${h()}${h()}`;
}

const entries = papers.map((p, i) => {
  const created = new Date(Date.now() - (papers.length - i) * 86400000 * 2).toISOString();
  return {
    uuid: makeUUID(),
    shortid: makeShortid(),
    user: '0000-0001-0000-0001',
    public: true,
    isAiGenerated: i % 4 === 0,
    created: created,
    updated: created,
    moderationStatus: 'public',
    score: p.score,
    tags: p.tags,
    publication: {
      title: p.title,
      authors: p.authors,
      journal: journals[i % journals.length],
      year: p.year,
      doi: p.doi,
    },
    data: {
      provenance: { datasetSource: 'Public repository' },
      dataSplits: { validationUsed: true },
    },
    optimization: {
      algorithm: { algorithmClass: 'Supervised' },
    },
    model: {
      output: { outputType: 'Classification' },
    },
    evaluation: {
      method: { evaluationMethod: 'Cross-validation' },
    },
  };
});

const result = db.registry.insertMany(entries);
print(`✅ Seeded ${result.insertedIds.length} dummy registry entries.`);
