import { DEFAULT_REGISTRY_URL } from '@/constants';
import { getEnvValue } from '@/lib/env';
import { requestJson } from '@/lib/http';
import type {
  DevicePollResponse,
  DeviceStartResponse,
  ProjectTarget,
  RegistryComponentResponse,
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
}
