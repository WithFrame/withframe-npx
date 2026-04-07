import { access } from 'node:fs/promises';
import path from 'node:path';
import { loadWithFrameConfig } from '@/lib/config';
import { confirm } from '@/lib/prompt';
import {
  detectProjectTarget,
  installDependencies,
  mergeManifestDependencies,
  resolveOutputDirectory,
  resolveProjectRoot,
  writeManifestFiles,
} from '@/lib/project';
import type { AddExecutionHooks, AddOptions, ProjectTarget, RegistryManifest } from '@/types';

export interface ProjectComponentContext {
  projectRoot: string;
  target: ProjectTarget;
  outputDir: string;
}

const hasFile = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export class ProjectComponentService {
  async resolveContext(options: AddOptions): Promise<ProjectComponentContext> {
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

  async collectOverwriteDecisions({
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
    if (yes) {
      return overwriteDecisions;
    }

    for (const file of files) {
      const relativeFilePath = file.path.replace(/^\/+/, '');
      const destination = path.resolve(projectRoot, outputDir, relativeFilePath);
      const exists = await hasFile(destination);
      if (!exists) {
        continue;
      }

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

  async applyManifest({
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

    const dependencies = await mergeManifestDependencies({
      projectRoot: context.projectRoot,
      manifest,
    });

    const installedDependencies = await installDependencies({
      projectRoot: context.projectRoot,
      runtimeDependencies: dependencies.runtimeToInstall,
      devDependencies: dependencies.devToInstall,
    });

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
