import { Component } from '@angular/core';

@Component({
  selector: 'app-api-docs',
  template: `
    <div class="container py-5" style="max-width:900px">

      <!-- Header -->
      <div class="mb-5">
        <h1 class="fw-bold mb-2">
          <i class="bi bi-code-slash me-2" style="color:var(--bs-primary)"></i>DOME Registry API
        </h1>
        <p class="lead text-muted mb-3">
          REST API for querying, submitting, and exporting DOME Registry entries.
          All endpoints are under <code>https://registry.dome-ml.org/api</code> (production) or
          <code>http://localhost/api</code> (local dev).
        </p>
        <div class="d-flex flex-wrap gap-2">
          <a href="/assets/schema/dome-registry-schema.v2.json" target="_blank"
            class="btn btn-outline-primary btn-sm">
            <i class="bi bi-file-earmark-code me-1"></i>Download JSON Schema
          </a>
          <a routerLink="/upload" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-robot me-1"></i>AI Import (UI)
          </a>
          <a routerLink="/search" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-search me-1"></i>Browse Registry
          </a>
        </div>
      </div>

      <!-- ── Authentication ─────────────────────────────────────── -->
      <div class="card dome-section-card mb-4">
        <div class="card-header py-2"><h5 class="mb-0">Authentication</h5></div>
        <div class="card-body">
          <p>
            Most write endpoints require a <strong>JWT Bearer token</strong> obtained via ORCID OAuth.
            Read endpoints (search, GET entry) are public.
          </p>
          <h6 class="fw-semibold">OAuth flow</h6>
          <ol class="small mb-3">
            <li>Redirect the user to <code>GET /api/auth/orcid</code> — this redirects to ORCID.</li>
            <li>After consent, ORCID redirects to <code>/auth/callback?code=…</code>.</li>
            <li>The frontend exchanges the code and receives a JWT (1 h expiry).</li>
            <li>Include the token in all subsequent requests as <code>Authorization: Bearer &lt;token&gt;</code>.</li>
          </ol>
          <h6 class="fw-semibold">Dev / testing token</h6>
          <p class="small mb-1">
            When running with <code>docker-compose.dev.yml</code>, navigate to
            <code>GET /api/auth/dev-login</code> to receive an admin JWT for testing.
          </p>
          <div class="bg-dark rounded p-3 small">
            <code class="text-light">curl -X GET http://localhost/api/auth/dev-login</code>
          </div>
        </div>
      </div>

      <!-- ── Endpoint Reference ─────────────────────────────────── -->
      <div class="card dome-section-card mb-4">
        <div class="card-header py-2"><h5 class="mb-0">Endpoint Reference</h5></div>
        <div class="card-body p-0">
          <div class="accordion accordion-flush" id="endpointsAccordion">

            <!-- Search -->
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button"
                  data-bs-toggle="collapse" data-bs-target="#ep1">
                  <span class="badge bg-success me-2">GET</span>
                  <code>/api/registry</code>
                  <span class="text-muted ms-3 small">Search &amp; list public entries</span>
                </button>
              </h2>
              <div id="ep1" class="accordion-collapse collapse" data-bs-parent="#endpointsAccordion">
                <div class="accordion-body small">
                  <p class="mb-2"><strong>Auth:</strong> None required.</p>
                  <p class="fw-semibold mb-1">Query parameters</p>
                  <table class="table table-sm table-bordered small mb-3">
                    <thead><tr><th>Param</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>text</code></td><td>string</td><td>Free-text search (title, authors, abstract)</td></tr>
                      <tr><td><code>tags</code></td><td>string</td><td>Comma-separated tag filter</td></tr>
                      <tr><td><code>journal</code></td><td>string</td><td>Filter by journal name</td></tr>
                      <tr><td><code>year</code></td><td>string</td><td>Filter by publication year</td></tr>
                      <tr><td><code>minScore</code></td><td>number</td><td>Minimum DOME score (0–100)</td></tr>
                      <tr><td><code>isAiGenerated</code></td><td>boolean</td><td>Filter AI-assisted entries</td></tr>
                      <tr><td><code>sortBy</code></td><td>string</td><td><code>created</code> | <code>oldest</code> | <code>score</code></td></tr>
                      <tr><td><code>skip</code></td><td>number</td><td>Pagination offset (default 0)</td></tr>
                      <tr><td><code>limit</code></td><td>number</td><td>Page size (default 20, max 100)</td></tr>
                    </tbody>
                  </table>
                  <p class="fw-semibold mb-1">Example</p>
                  <pre class="bg-dark text-light rounded p-2 mb-0" style="font-size:.78rem">curl "https://registry.dome-ml.org/api/registry?text=random+forest&amp;sortBy=score&amp;limit=10"</pre>
                </div>
              </div>
            </div>

            <!-- GET one -->
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button"
                  data-bs-toggle="collapse" data-bs-target="#ep2">
                  <span class="badge bg-success me-2">GET</span>
                  <code>/api/registry/:uuid</code>
                  <span class="text-muted ms-3 small">Retrieve a single entry</span>
                </button>
              </h2>
              <div id="ep2" class="accordion-collapse collapse" data-bs-parent="#endpointsAccordion">
                <div class="accordion-body small">
                  <p><strong>Auth:</strong> None for public entries. JWT required to retrieve draft/held/pending entries you own.</p>
                  <p>Accepts both full UUID and short-id (e.g. <code>abc12345</code>).</p>
                  <p class="fw-semibold mb-1">Example</p>
                  <pre class="bg-dark text-light rounded p-2 mb-0" style="font-size:.78rem">curl "https://registry.dome-ml.org/api/registry/00112233-4455-6677-8899-aabbccddeeff"</pre>
                </div>
              </div>
            </div>

            <!-- POST create -->
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button"
                  data-bs-toggle="collapse" data-bs-target="#ep3">
                  <span class="badge bg-primary me-2">POST</span>
                  <code>/api/registry</code>
                  <span class="text-muted ms-3 small">Create a new draft entry</span>
                </button>
              </h2>
              <div id="ep3" class="accordion-collapse collapse" data-bs-parent="#endpointsAccordion">
                <div class="accordion-body small">
                  <p><strong>Auth:</strong> JWT required.</p>
                  <p>Creates a draft entry owned by the authenticated user. Pass an empty body <code>&#123;&#125;</code> to start blank, or include <code>"isAiGenerated": true</code> for AI-assisted entries. Full annotation data is added via PATCH.</p>
                  <pre class="bg-dark text-light rounded p-2 mb-0" style="font-size:.78rem">curl -X POST https://registry.dome-ml.org/api/registry \\
  -H "Authorization: Bearer &lt;token&gt;" \\
  -H "Content-Type: application/json" \\
  -d '&#123;&#125;'</pre>
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button"
                  data-bs-toggle="collapse" data-bs-target="#ep4">
                  <span class="badge bg-warning text-dark me-2">PATCH</span>
                  <code>/api/registry/:uuid</code>
                  <span class="text-muted ms-3 small">Update entry data</span>
                </button>
              </h2>
              <div id="ep4" class="accordion-collapse collapse" data-bs-parent="#endpointsAccordion">
                <div class="accordion-body small">
                  <p><strong>Auth:</strong> JWT required. Must be owner or admin.</p>
                  <p>Every PATCH creates an immutable version snapshot (full history preserved). Send only changed fields — unmentioned fields are preserved.</p>
                  <p class="fw-semibold mb-1">Body structure</p>
                  <pre class="bg-dark text-light rounded p-2 mb-2" style="font-size:.78rem" [textContent]="patchExample"></pre>
                  <p class="text-muted small mb-0">Field paths follow the DOME schema structure (e.g. <code>data.provenance.datasetSource</code>). See the schema file for all valid paths.</p>
                </div>
              </div>
            </div>

            <!-- POST submit -->
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button"
                  data-bs-toggle="collapse" data-bs-target="#ep5">
                  <span class="badge bg-primary me-2">POST</span>
                  <code>/api/registry/:uuid/submit</code>
                  <span class="text-muted ms-3 small">Submit draft for moderation review</span>
                </button>
              </h2>
              <div id="ep5" class="accordion-collapse collapse" data-bs-parent="#endpointsAccordion">
                <div class="accordion-body small">
                  <p><strong>Auth:</strong> JWT required. Must be owner.</p>
                  <p>Transitions state from <code>draft</code> → <code>pending</code>. A moderator will review the entry before it becomes <code>public</code>. Optionally include <code>"journalId"</code> in the body to route to a specific journal queue.</p>
                  <pre class="bg-dark text-light rounded p-2 mb-0" style="font-size:.78rem">curl -X POST https://registry.dome-ml.org/api/registry/&lt;uuid&gt;/submit \\
  -H "Authorization: Bearer &lt;token&gt;" \\
  -H "Content-Type: application/json" \\
  -d '&#123;&#125;'</pre>
                </div>
              </div>
            </div>

            <!-- GET history -->
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button"
                  data-bs-toggle="collapse" data-bs-target="#ep6">
                  <span class="badge bg-success me-2">GET</span>
                  <code>/api/registry/:uuid/history</code>
                  <span class="text-muted ms-3 small">Retrieve full edit history</span>
                </button>
              </h2>
              <div id="ep6" class="accordion-collapse collapse" data-bs-parent="#endpointsAccordion">
                <div class="accordion-body small">
                  <p><strong>Auth:</strong> None for public entries; JWT for private.</p>
                  <p>Returns an array of <code>VersionSnapshot</code> objects in reverse-chronological order, each containing the full entry JSON at that version, the editor ORCID, and a timestamp.</p>
                </div>
              </div>
            </div>

            <!-- POST copilot -->
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button"
                  data-bs-toggle="collapse" data-bs-target="#ep7">
                  <span class="badge bg-primary me-2">POST</span>
                  <code>/api/copilot/process</code>
                  <span class="text-muted ms-3 small">AI annotation from PDF</span>
                </button>
              </h2>
              <div id="ep7" class="accordion-collapse collapse" data-bs-parent="#endpointsAccordion">
                <div class="accordion-body small">
                  <p><strong>Auth:</strong> JWT required. Subject to daily quota (default 5 calls/day).</p>
                  <p>Upload a PDF file (<code>multipart/form-data</code>, field name <code>pdf</code>) and receive AI-extracted DOME annotations keyed by schema path.</p>
                  <table class="table table-sm table-bordered small mb-3">
                    <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>pdf</code></td><td>file</td><td>Yes</td><td>Text-based PDF, max 20 MB</td></tr>
                      <tr><td><code>doi</code></td><td>string</td><td>No</td><td>Paper DOI to aid metadata extraction</td></tr>
                      <tr><td><code>sections</code></td><td>string</td><td>No</td><td>Comma-separated DOME sections to extract (default: all)</td></tr>
                    </tbody>
                  </table>
                  <p class="fw-semibold mb-1">Response</p>
                  <pre class="bg-dark text-light rounded p-2 mb-0" style="font-size:.78rem" [textContent]="copilotResponseExample"></pre>
                </div>
              </div>
            </div>

          </div><!-- /accordion -->
        </div>
      </div>

      <!-- ── Bulk Submission ────────────────────────────────────── -->
      <div class="card dome-section-card mb-4">
        <div class="card-header py-2"><h5 class="mb-0">Bulk Submission</h5></div>
        <div class="card-body">
          <p>
            There is no dedicated batch endpoint — use the standard three-step per-entry flow in a loop.
            Respect rate limits (429 responses) by adding a short delay between entries.
          </p>
          <p class="fw-semibold mb-1">Three-step pattern per entry</p>
          <pre class="bg-dark text-light rounded p-3 mb-3" style="font-size:.78rem" [textContent]="bulkExample"></pre>
          <p class="text-muted small mb-0">
            <i class="bi bi-info-circle me-1"></i>
            Copilot AI extraction counts against your per-user daily quota. For bulk AI import,
            contact the registry administrators to discuss increased limits.
          </p>
        </div>
      </div>

      <!-- ── JSON Download ──────────────────────────────────────── -->
      <div class="card dome-section-card mb-4">
        <div class="card-header py-2"><h5 class="mb-0">JSON Download &amp; Schema</h5></div>
        <div class="card-body">
          <p>
            Each entry page has a <strong>JSON</strong> download button that exports the full entry document,
            including every schema field (empty fields are present as <code>null</code>). This is generated
            client-side from the live schema and entry data — no special endpoint required.
          </p>
          <p>To fetch an entry's raw data programmatically:</p>
          <pre class="bg-dark text-light rounded p-3 mb-3" style="font-size:.78rem">curl "https://registry.dome-ml.org/api/registry/&lt;uuid&gt;"</pre>
          <p>
            The canonical JSON Schema governing all entries is available at:
          </p>
          <pre class="bg-dark text-light rounded p-2 mb-0" style="font-size:.78rem">GET /assets/schema/dome-registry-schema.v2.json</pre>
          <p class="text-muted small mt-2 mb-0">
            Field paths use dot-notation (e.g. <code>data.provenance.datasetSource</code>) in the TypeScript
            interfaces, and slash-notation (e.g. <code>data/provenance/datasetSource</code>) in Copilot API responses.
          </p>
        </div>
      </div>

      <!-- ── Rate Limits & Quotas ───────────────────────────────── -->
      <div class="card dome-section-card mb-4">
        <div class="card-header py-2"><h5 class="mb-0">Rate Limits &amp; Quotas</h5></div>
        <div class="card-body">
          <table class="table table-sm table-bordered small mb-0">
            <thead><tr><th>Endpoint</th><th>Limit</th><th>Scope</th></tr></thead>
            <tbody>
              <tr>
                <td><code>POST /api/copilot/process</code></td>
                <td>5 calls / day (default)</td>
                <td>Per ORCID</td>
              </tr>
              <tr>
                <td>All other write endpoints</td>
                <td>Default NestJS rate limiter (60 req/min)</td>
                <td>Per IP</td>
              </tr>
              <tr>
                <td>Read endpoints</td>
                <td>No quota enforced</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
          <p class="text-muted small mt-3 mb-0">
            Quota errors return HTTP <code>429 Too Many Requests</code>.
            Contact the registry administrators to request increased LLM quotas.
          </p>
        </div>
      </div>

      <!-- ── DOME Score ─────────────────────────────────────────── -->
      <div class="card dome-section-card mb-4">
        <div class="card-header py-2"><h5 class="mb-0">DOME Score</h5></div>
        <div class="card-body small">
          <p>
            Every entry carries a computed <strong>DOME Score</strong> (0–100) reflecting how completely
            the DOME checklist is satisfied. It is recalculated on every PATCH.
          </p>
          <ul>
            <li><strong>REQUIREMENT</strong> fields contribute <strong>1.0</strong> point each.</li>
            <li><strong>RECOMMENDATION</strong> fields contribute <strong>0.5</strong> points each.</li>
            <li>Score = (sum of filled field weights / max possible weight) × 100.</li>
          </ul>
          <p class="mb-0">
            The weight map is at
            <a href="https://github.com/BioComputingUP/dome-registry-v2/blob/main/schema/scoring-weights.json"
              target="_blank" rel="noopener">schema/scoring-weights.json</a>
            in the repository.
          </p>
        </div>
      </div>

    </div>
  `,
})
export class ApiDocsComponent {
  readonly patchExample = `{
  "data": {
    "publication": {
      "title": "DeepBind: Predicting transcription factor binding",
      "authors": "Alipanahi B, ...",
      "journal": "Nature Methods",
      "year": 2015,
      "doi": "10.1038/nmeth.3547"
    },
    "data": {
      "provenance": {
        "datasetSource": "Public repository",
        "pointsPerClass": 5000
      }
    }
  },
  "changeNote": "Added publication metadata"
}`;

  readonly copilotResponseExample = `{
  "annotations": {
    "publication/title": "DeepBind: Predicting...",
    "publication/authors": "Alipanahi B, ...",
    "data/provenance/datasetSource": "Public repository",
    "optimization/algorithm/algorithmClass": "Deep learning",
    ...
  }
}`;

  readonly bulkExample = `TOKEN="your-jwt-token"
BASE="https://registry.dome-ml.org/api"

for ENTRY in entries/*.json; do
  # Step 1: Create draft
  UUID=$(curl -s -X POST "$BASE/registry" \\
    -H "Authorization: Bearer $TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{}' | jq -r .uuid)

  # Step 2: Patch with annotation data
  DATA=$(cat "$ENTRY")
  curl -s -X PATCH "$BASE/registry/$UUID" \\
    -H "Authorization: Bearer $TOKEN" \\
    -H "Content-Type: application/json" \\
    -d "$DATA"

  # Step 3: Submit for review
  curl -s -X POST "$BASE/registry/$UUID/submit" \\
    -H "Authorization: Bearer $TOKEN" \\
    -H "Content-Type: application/json" \\
    -d '{}'

  sleep 0.5  # respect rate limits
done`;
}
