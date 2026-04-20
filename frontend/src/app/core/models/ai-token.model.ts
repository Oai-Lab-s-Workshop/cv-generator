export type AiTokenStatus = 'active' | 'revoked' | 'expired';

export interface AiToken {
  id: string;
  token_hash: string;
  token_prefix: string;
  user: string;
  label: string;
  status: AiTokenStatus;
  expiresAt?: string;
  canChooseTemplate?: boolean;
  allowedTemplates?: string[];
  maxProfileCreates?: number | null;
  profileCreatesCount?: number;
  lastUsedAt?: string;
  created?: string;
  updated?: string;
}

export interface CreateAiTokenInput {
  label: string;
  expiresAt?: string | null;
  canChooseTemplate: boolean;
  allowedTemplates: string[];
  maxProfileCreates?: number | null;
}

export interface CreatedAiTokenResult {
  record: AiToken;
  rawToken: string;
}
