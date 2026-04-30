// ---- User / Auth models ----

export interface JwtPayload {
  orcid: string;
  displayName: string;
  roles: string[];
  exp?: number;
}

export interface UserProfile {
  orcid: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  organisation?: string;
  roles: string[];
  journalAssignments: JournalAssignment[];
  dailyLLMCalls: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface JournalAssignment {
  journalId: string;
  journalName: string;
}

// ---- Registry entry models ----

export type ModerationStatus = 'draft' | 'pending' | 'public' | 'held' | 'rejected';

export interface RegistryEntry {
  _id?: string;
  uuid: string;
  shortid: string;
  user: string;             // ORCID iD
  public: boolean;
  isAiGenerated: boolean;
  created: string;
  updated: string;
  moderationStatus: ModerationStatus;
  journalId?: string;
  score: number;
  tags: string[];
  publication: Record<string, unknown>;
  data: Record<string, unknown>;
  optimization: Record<string, unknown>;
  model: Record<string, unknown>;
  evaluation: Record<string, unknown>;
}

export interface VersionSnapshot {
  _id: string;
  entryId: string;
  schemaVersion: string;
  data: Partial<RegistryEntry>;
  editedBy: string;         // ORCID iD
  editedAt: string;
  changeNote?: string;
}

export interface SearchResult {
  total: number;
  entries: RegistryEntry[];
}

// ---- Copilot ----

export interface CopilotResponse {
  annotations: Record<string, unknown>;
  confidence?: Record<string, number>;
}
