export type AiTokenStatus = 'active' | 'revoked' | 'expired';

export interface AiToken {
  id: string;
  token_hash: string;
  token_prefix: string;
  user: string;
  label: string;
  status: AiTokenStatus;
  expiresAt?: string;
  lastUsedAt?: string;
  created?: string;
  updated?: string;
}

export interface CreateAiTokenInput {
  label: string;
  expiresAt?: string | null;
}

export interface CreateAiTokenDebugInfo {
  currentUserId: string;
}

export interface CreatedAiTokenResult {
  record: AiToken;
  rawToken: string;
  debug: CreateAiTokenDebugInfo;
}
