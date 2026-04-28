import { DEFAULT_REGISTRY_URL } from '@/constants';
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

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, '');

export class RegistryClient {
  private toUrl(endpoint: string): string {
    const baseUrl = getEnvValue('WITHFRAME_REGISTRY_URL') || DEFAULT_REGISTRY_URL;

    return `${normalizeBaseUrl(baseUrl)}${endpoint}`;
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
    return requestJson<UploadResult>(this.toUrl('/api/cli/registry/components/upload'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, fileName }),
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
    const formData = new FormData();
    const fileContent = Uint8Array.from(content);
    formData.append('file', new Blob([fileContent], { type: mimeType }), fileName);

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
