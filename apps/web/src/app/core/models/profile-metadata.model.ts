export interface ProfileMetadata {
  id: string;
  user: string;
  writingStyleDescription?: string | null;
  writingStyleUrl?: string | null;
}

export type SaveProfileMetadataInput = Pick<ProfileMetadata, 'writingStyleDescription' | 'writingStyleUrl'>;
