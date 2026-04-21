import { TokenStore } from '@/lib/tokenStore';
import { RegistryClient } from '@/api/registry-client';
import type {
  AddExecutionHooks,
  AddOptions,
  AddResult,
  ProjectComponentContext,
  RegistryManifest,
} from '@/types';
import { normalizeOptions, normalizeText } from '@/lib/normalize';
import {
  detectProjectTarget,
  hasFile,
  installDependencies,
  mergeManifestDependencies,
  resolveOutputDirectory,
  resolveProjectRoot,
  shouldInstallManifestDependencies,
  writeManifestFiles,
} from '@/lib/project';
import path from 'node:path';
import { loadWithFrameConfig } from '@/lib/config';
import { confirm } from '@/lib/prompt';

export class ComponentService {
  constructor(
    private readonly tokenStore: TokenStore,
    private readonly registryClient: RegistryClient,
  ) {}

  public async addComponent(
    componentSlug: string,
    opts: AddOptions,
    hooks: AddExecutionHooks = {},
  ): Promise<AddResult> {
    const slug = normalizeText(componentSlug);
    if (!slug) {
      throw new Error('Component slug is required.');
    }

    const options = normalizeOptions(opts);
    const context = await this.resolveContext(options);

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

    const overwriteDecisions = await this.collectOverwriteDecisions({
      projectRoot: context.projectRoot,
      outputDir: context.outputDir,
      files: response.manifest.files,
      yes: Boolean(options.yes),
      hooks,
    });

    hooks.onApplyStart?.();

    const installation = await this.applyManifest({
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

  private async resolveContext(options: AddOptions): Promise<ProjectComponentContext> {
    const projectRoot = resolveProjectRoot(options.cwd);
    const config = await loadWithFrameConfig(projectRoot);
    const target = await detectProjectTarget({
      projectRoot,
      optionTarget: options.target,
      config,
    });
    const outputDir = await resolveOutputDirectory({ projectRoot, config });

    return {
      projectRoot,
      target,
      outputDir,
    };
  }

  private async collectOverwriteDecisions({
    projectRoot,
    outputDir,
    files,
    yes,
    hooks,
  }: {
    projectRoot: string;
    outputDir: string;
    files: RegistryManifest['files'];
    yes: boolean;
    hooks: AddExecutionHooks;
  }): Promise<Map<string, boolean>> {
    const overwriteDecisions = new Map<string, boolean>();
    if (yes) return overwriteDecisions;

    for (const file of files) {
      const relativeFilePath = file.path.replace(/^\/+/, '');
      const destination = path.resolve(projectRoot, outputDir, relativeFilePath);
      const exists = await hasFile(destination);
      if (!exists) continue;

      overwriteDecisions.set(
        destination,
        await this.confirmOverwrite({
          projectRoot,
          absolutePath: destination,
          hooks,
        }),
      );
    }

    return overwriteDecisions;
  }

  private async applyManifest({
    context,
    manifest,
    yes,
    hooks,
    overwriteDecisions,
  }: {
    context: ProjectComponentContext;
    manifest: RegistryManifest;
    yes: boolean;
    hooks: AddExecutionHooks;
    overwriteDecisions: Map<string, boolean>;
  }): Promise<{
    createdFiles: string[];
    overwrittenFiles: string[];
    skippedFiles: string[];
    installedDependencies: string[];
  }> {
    const fileResult = await writeManifestFiles({
      projectRoot: context.projectRoot,
      outputDir: context.outputDir,
      files: manifest.files,
      yes,
      confirmOverwrite: async (absolutePath) => {
        const existingDecision = overwriteDecisions.get(absolutePath);
        if (typeof existingDecision === 'boolean') {
          return existingDecision;
        }

        return this.confirmOverwrite({
          projectRoot: context.projectRoot,
          absolutePath,
          hooks,
        });
      },
    });

    let installedDependencies: string[] = [];
    if (await shouldInstallManifestDependencies(context.projectRoot)) {
      const dependencies = await mergeManifestDependencies({
        projectRoot: context.projectRoot,
        manifest,
      });

      installedDependencies = await installDependencies({
        projectRoot: context.projectRoot,
        runtimeDependencies: dependencies.runtimeToInstall,
        devDependencies: dependencies.devToInstall,
      });
    }

    return {
      createdFiles: fileResult.created,
      overwrittenFiles: fileResult.overwritten,
      skippedFiles: fileResult.skipped,
      installedDependencies,
    };
  }

  private async confirmOverwrite({
    projectRoot,
    absolutePath,
    hooks,
  }: {
    projectRoot: string;
    absolutePath: string;
    hooks: AddExecutionHooks;
  }): Promise<boolean> {
    const relativePath = path.relative(projectRoot, absolutePath);
    if (hooks.confirmOverwrite) {
      return hooks.confirmOverwrite(relativePath);
    }

    return confirm(`File ${relativePath} exists. Overwrite? [y/N] `);
  }
}
