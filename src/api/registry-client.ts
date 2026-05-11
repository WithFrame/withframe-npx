import { getEnvValue } from '@/lib/env';
import { requestJson } from '@/lib/http';
import type {
  DevicePollResponse,
  DeviceStartResponse,
  ProjectTarget,
  RegistryComponentResponse,
  ShotCollectionsResponse,
  ShotUploadResult,
  UploadResult,
} from '@/types';

const sanitizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, '');
const CALLBACK_URL_TYPE = {
  DEV: 'DEV',
  STAGE: 'STAGE',
  PROD: 'PROD',
} as const;
type CallbackUrlType = (typeof CALLBACK_URL_TYPE)[keyof typeof CALLBACK_URL_TYPE];

const isLocalHost = (hostname: string): boolean => {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
};

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`http://${value}`);
    } catch {
      return null;
    }
  }
};

const formatCallback = (url: string): CallbackUrlType => {
  const parsed = parseUrl(url.trim());
  if (!parsed) {
    return CALLBACK_URL_TYPE.PROD;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'stage.withfra.me') {
    return CALLBACK_URL_TYPE.STAGE;
  }

  if (hostname === 'withfra.me') {
    return CALLBACK_URL_TYPE.PROD;
  }

  if (isLocalHost(hostname)) {
    return CALLBACK_URL_TYPE.DEV;
  }

  return CALLBACK_URL_TYPE.PROD;
};

export class RegistryClient {
  private getRegistryBaseUrl(): string {
    return getEnvValue('WITHFRAME_REGISTRY_URL') as string;
  }

  private getCallbackUrlType(): CallbackUrlType {
    return formatCallback(this.getRegistryBaseUrl());
  }

  private toUrl(endpoint: string): string {
    const baseUrl = this.getRegistryBaseUrl();

    return `${sanitizeBaseUrl(baseUrl)}${endpoint}`;
  }

  startDeviceFlow({
    clientName = 'withframe-cli',
  }: { clientName?: string } = {}): Promise<DeviceStartResponse> {
    return requestJson<DeviceStartResponse>(this.toUrl('/api/cli/device/start'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientName }),
    });
  }

  pollDeviceFlow({ deviceCode }: { deviceCode: string }): Promise<DevicePollResponse> {
    return requestJson<DevicePollResponse>(this.toUrl('/api/cli/device/poll'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceCode }),
    });
  }

  fetchComponent({
    slug,
    target,
    variant,
    token,
  }: {
    slug: string;
    target: ProjectTarget;
    variant: string;
    token: string;
  }): Promise<RegistryComponentResponse> {
    const params = new URLSearchParams({
      target,
      variant,
    });

    return requestJson<RegistryComponentResponse>(
      this.toUrl(`/api/cli/registry/components/${encodeURIComponent(slug)}?${params.toString()}`),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  uploadComponent({
    content,
    fileName,
    token,
  }: {
    content: string;
    fileName: string;
    token: string;
  }): Promise<UploadResult> {
    const callback = this.getCallbackUrlType();

    return requestJson<UploadResult>(this.toUrl('/api/cli/registry/components/upload'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, fileName, callback }),
    });
  }

  fetchShotCollections({
    token,
    offset = 0,
    limit = 40,
  }: {
    token: string;
    offset?: number;
    limit?: number;
  }): Promise<ShotCollectionsResponse> {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });

    return requestJson<ShotCollectionsResponse>(
      this.toUrl(`/api/cli/shots/collections?${params.toString()}`),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  uploadShot({
    token,
    fileName,
    mimeType,
    content,
    collectionId,
    collectionTitle,
    createNewCollection,
    color,
  }: {
    token: string;
    fileName: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/jpg';
    content: Buffer;
    collectionId?: string;
    collectionTitle?: string;
    createNewCollection?: boolean;
    color?: string;
  }): Promise<ShotUploadResult> {
    const callback = this.getCallbackUrlType();
    const formData = new FormData();
    const fileContent = Uint8Array.from(content);
    formData.append('file', new Blob([fileContent], { type: mimeType }), fileName);
    formData.append('callback', callback);

    if (collectionId) {
      formData.append('collectionId', collectionId);
    }

    if (collectionTitle) {
      formData.append('collectionTitle', collectionTitle);
    }

    if (createNewCollection) {
      formData.append('createNewCollection', 'true');
    }

    if (color) {
      formData.append('color', color);
    }

    return requestJson<ShotUploadResult>(this.toUrl('/api/cli/shots/upload'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData as unknown as RequestInit['body'],
    });
  }
}
