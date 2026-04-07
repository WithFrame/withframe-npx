import { TokenStore } from '@/lib/tokenStore';
import { RegistryClient } from '@/api/RegistryClient';
import type { AddExecutionHooks, AddOptions, AddResult } from '@/types';
import { normalizeOptions, normalizeText } from '@/lib/normalize';
import { ProjectComponentService } from '@/services/projectComponentService';

export class ComponentService {
  constructor(
    private readonly tokenStore: TokenStore,
    private readonly registryClient: RegistryClient,
    private readonly projectComponentService: ProjectComponentService,
  ) {}

  async addComponent(
    componentSlug: string,
    opts: AddOptions,
    hooks: AddExecutionHooks = {},
  ): Promise<AddResult> {
    const slug = normalizeText(componentSlug);
    if (!slug) {
      throw new Error('Component slug is required.');
    }

    const options = normalizeOptions(opts);
    const context = await this.projectComponentService.resolveContext(options);

    const tokenResult = await this.tokenStore.resolveAccessToken();
    if (!tokenResult) {
      throw new Error('No auth token found. Run `withframe login` first.');
    }

    const response = await this.registryClient.fetchComponent({
      slug,
      target: context.target,
      variant: options.variant || 'default',
      token: tokenResult.token,
    });

    const overwriteDecisions = await this.projectComponentService.collectOverwriteDecisions({
      projectRoot: context.projectRoot,
      outputDir: context.outputDir,
      files: response.manifest.files,
      yes: Boolean(options.yes),
      hooks,
    });

    hooks.onApplyStart?.();

    const installation = await this.projectComponentService.applyManifest({
      context,
      manifest: response.manifest,
      yes: Boolean(options.yes),
      hooks,
      overwriteDecisions,
    });

    return {
      component: response.component,
      target: context.target,
      outputDir: context.outputDir,
      ...installation,
    };
  }
}
