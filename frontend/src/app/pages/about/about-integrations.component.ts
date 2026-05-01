import { Component } from '@angular/core';

@Component({
  selector: 'app-about-integrations',
  template: `
    <section class="py-5">
      <div class="container">
        <div class="section-label text-secondary fw-semibold small text-uppercase mb-2" style="letter-spacing:.08em">
          External Services &amp; Standards
        </div>
        <h2 class="h3 fw-bold mb-2">Integrations &amp; Standards</h2>
        <p class="text-muted mb-5" style="max-width:800px">
          The DOME Registry leverages several key external services and international standards
          to enhance functionality, interoperability, and alignment with the FAIR principles
          (Findable, Accessible, Interoperable, Reusable).
        </p>

        <div class="row g-4">
          <div *ngFor="let partner of partners" class="col-md-6">
            <div class="card border-0 shadow-sm h-100 dome-section-card">
              <div class="card-body p-4">
                <div class="d-flex align-items-start gap-3">
                  <div class="partner-icon flex-shrink-0 d-flex align-items-center justify-content-center rounded"
                       style="width:3rem;height:3rem;background:rgba(0,57,88,.07)">
                    <i [class]="'bi ' + partner.icon + ' fs-5 text-primary'"></i>
                  </div>
                  <div>
                    <div class="fw-bold mb-1">
                      {{ partner.name }}
                      <span *ngIf="partner.comingSoon" class="badge bg-warning text-dark ms-2" style="font-size:0.65rem;vertical-align:middle">Coming Soon</span>
                    </div>
                    <p class="text-muted small mb-2">{{ partner.desc }}</p>
                    <div class="small text-muted mb-2"><strong>Integration:</strong> {{ partner.integration }}</div>
                    <div class="small text-success mb-2"><strong>Benefit:</strong> {{ partner.benefit }}</div>
                    <div class="d-flex flex-wrap gap-2">
                      <a *ngFor="let link of partner.links" [href]="link.url" target="_blank"
                         rel="noopener" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-box-arrow-up-right me-1"></i>{{ link.label }}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .dome-section-card { border-left: 4px solid #003958; }
  `],
})
export class AboutIntegrationsComponent {
  partners = [
    {
      name: 'ORCID',
      icon: 'bi-person-badge',
      desc: 'ORCID provides a persistent digital identifier (ORCID iD) for researchers, used widely for attribution and authentication in scholarly communication.',
      integration: 'User authentication for the DOME Registry front-end is handled via ORCID Sign-In, linking actions directly to the user\'s verified ORCID iD.',
      benefit: 'Ensures secure login, provides unambiguous attribution, and enables downstream tracking via APICURON.',
      links: [{ url: 'https://orcid.org/', label: 'orcid.org' }],
    },
    {
      name: 'APICURON',
      icon: 'bi-award',
      desc: 'APICURON is a service designed to track and provide recognition for data curation activities across databases and resources.',
      integration: 'By linking submitted entries to the submitter\'s ORCID iD, the DOME Registry enables APICURON to recognize and aggregate curation contributions.',
      benefit: 'Facilitates formal accreditation for curation effort, attributing work directly to the individual\'s ORCID profile.',
      links: [{ url: 'https://apicuron.org/', label: 'apicuron.org' }],
    },
    {
      name: 'Bioschemas',
      icon: 'bi-braces',
      desc: 'Bioschemas develops lightweight semantic annotations for life science websites, making content discoverable by search engines and interoperable for machines.',
      integration: 'The DOME Registry embeds Bioschemas markup within entry pages as machine-readable JSON-LD metadata.',
      benefit: 'Significantly improves Findability and Interoperability of methods. Search engines can better index and understand the content.',
      links: [{ url: 'https://bioschemas.org/', label: 'bioschemas.org' }],
    },

    {
      name: 'FAIRsharing',
      icon: 'bi-diagram-3',
      desc: 'FAIRsharing is a curated resource cataloging data standards, databases, and data policies across scientific disciplines.',
      integration: 'The DOME Registry and DOME Recommendations are both listed within FAIRsharing as a database resource and community standard respectively.',
      benefit: 'Increases Findability and visibility within the standards landscape; positions DOME within the FAIR data ecosystem.',
      links: [
        { url: 'https://fairsharing.org/', label: 'FAIRsharing' },
        { url: 'https://fairsharing.org/6198', label: 'DOME FAIRsharing entry' },
      ],
    },
    {
      name: 'Identifiers.org',
      icon: 'bi-link-45deg',
      desc: 'Identifiers.org provides persistent, location-independent identifiers for data resources in the life sciences.',
      integration: 'Persistent identifiers assigned to DOME Registry entries are registered with Identifiers.org for universal resolution.',
      benefit: 'Enhances Interoperability and Reusability by providing stable, resolvable links to entry components and context.',
      links: [
        { url: 'https://identifiers.org/', label: 'identifiers.org' },
        { url: 'https://registry.identifiers.org/registry/dome', label: 'DOME Identifiers' },
      ],
    },
    {
      name: 'Matomo Analytics',
      icon: 'bi-bar-chart-line',
      desc: 'Matomo is an open-source, self-hosted web analytics platform offering full data ownership and strong GDPR compliance.',
      integration: 'The DOME Registry integrates Matomo to monitor user interactions, with anonymization and consent preferences respected.',
      benefit: 'Full data ownership and GDPR compliance while gathering essential usage analytics to improve services.',
      links: [{ url: 'https://matomo.org/', label: 'matomo.org' }],
    },

    {
      name: 'Zenodo',
      icon: 'bi-archive',
      desc: 'Zenodo is an open-access general-purpose repository operated by CERN, providing DOIs for research artefacts.',
      integration: 'The DOME Registry performs intermittent archival of full resource data dumps to Zenodo, ensuring versioned static snapshots.',
      benefit: 'Provides long-term preservation and a permanent, citable record of the full registry dataset.',
      links: [{ url: 'https://doi.org/10.5281/zenodo.18301460', label: 'DOME on Zenodo' }],
    },
    {
      name: 'EBI Search',
      icon: 'bi-search',
      desc: 'EBI Search is a scalable text-search engine providing access to biological data resources hosted at EMBL-EBI.',
      integration: 'DOME Registry content is indexed by EBI Search, enabling cross-linking with other EMBL-EBI resources via shared identifiers.',
      benefit: 'Methods become visible to a larger audience; promotes cross-resource discovery within the EBI ecosystem.',
      links: [{ url: 'https://www.ebi.ac.uk/ebisearch/', label: 'EBI Search' }],
    },
    {
      name: 'Europe PMC',
      icon: 'bi-journal-text',
      desc: 'Europe PMC provides access to a massive repository of biomedical literature including millions of abstracts and full-text articles.',
      integration: 'Bidirectional discovery via PubMed IDs (PMIDs) and PMCIDs, enabling automated retrieval of full-text articles within the DOME environment.',
      benefit: 'Grounds method metadata in the original research; enables seamless navigation between DOME entries and the underlying publications.',
      links: [{ url: 'https://europepmc.org/', label: 'europepmc.org' }],
    },
    {
      name: 'DCAT',
      icon: 'bi-database-up',
      desc: 'The Data Catalog Vocabulary (DCAT) is an RDF vocabulary designed to facilitate interoperability between data catalogs published on the Web.',
      integration: 'Planned export of DOME Registry metadata into DCAT-compliant RDF formats.',
      benefit: 'Enhances the FAIR principles by making DOME metadata directly machine-readable and seamlessly interoperable with major open science data catalogs globally.',
      links: [{ url: 'https://www.w3.org/TR/vocab-dcat-3/', label: 'DCAT Specification' }],
      comingSoon: true
    },
    {
      name: 'Dublin Core',
      icon: 'bi-card-text',
      desc: 'The Dublin Core Schema is a set of vocabulary terms used to describe web resources and physical resources.',
      integration: 'Planned embedding of Dublin Core metadata tags within all DOME entry headers.',
      benefit: 'Boosts the Findability of ML methods by allowing traditional academic search engines and open science harvesters to index core publication metadata effortlessly.',
      links: [{ url: 'https://dublincore.org/', label: 'dublincore.org' }],
      comingSoon: true
    },
    {
      name: 'OAI-PMH',
      icon: 'bi-broadcast-pin',
      desc: 'The Open Archives Initiative Protocol for Metadata Harvesting (OAI-PMH) is a protocol developed for harvesting metadata descriptions of records in an archive.',
      integration: 'Planned active OAI-PMH endpoint exposing DOME Registry records for automated harvesting.',
      benefit: 'Ensures our open science service is highly Accessible and Interoperable, allowing institutional repositories and aggregators to automatically sync DOME entries.',
      links: [{ url: 'https://www.openarchives.org/pmh/', label: 'OAI-PMH' }],
      comingSoon: true
    },
  ].sort((a, b) => a.name.localeCompare(b.name));
}
