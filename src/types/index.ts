export type ProjectTarget = 'react_native' | 'expo';

export interface WithFrameConfig {
  outputDir?: string;
  target?: ProjectTarget;
}

export interface DeviceStartResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  interval: number;
  expiresIn: number;
}

export interface DevicePollPendingResponse {
  status: 'pending';
  interval: number;
}

export interface DevicePollAuthorizedResponse {
  status: 'authorized';
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface DevicePollFailedResponse {
  status: 'denied' | 'expired';
  message: string;
}

export type DevicePollResponse =
  | DevicePollPendingResponse
  | DevicePollAuthorizedResponse
  | DevicePollFailedResponse;

export interface AuthFilePayload {
  accessToken: string;
  createdAt: string;
  expiresAt: string;
}

export interface RegistryManifestFile {
  path: string;
  content: string;
  overwrite: boolean;
}

export interface RegistryManifest {
  files: RegistryManifestFile[];
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  meta: {
    target: ProjectTarget;
    variant: string;
    isDefaultVariant: boolean;
    generatedAt: string;
    source: 'withframe-registry-v1';
  };
}

export interface RegistryComponentPayload {
  id: string;
  slug: string;
  title: string;
  section: string;
  version: number;
}

export interface RegistryComponentResponse {
  component: RegistryComponentPayload;
  manifest: RegistryManifest;
}

export interface AuthTokenResult {
  token: string;
  source: 'env' | 'file';
}

export interface AddOptions {
  variant?: string;
  target?: ProjectTarget;
  cwd?: string;
  yes?: boolean;
}

export interface AddExecutionHooks {
  confirmOverwrite?: (relativePath: string) => Promise<boolean>;
  onApplyStart?: () => void;
}

export interface AddResult {
  component: RegistryComponentPayload;
  target: ProjectTarget;
  outputDir: string;
  createdFiles: string[];
  overwrittenFiles: string[];
  skippedFiles: string[];
  installedDependencies: string[];
}

export interface LoginOptions {
  openBrowser?: boolean;
}
