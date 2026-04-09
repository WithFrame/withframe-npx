import { writeFile } from 'node:fs/promises';
import { CONFIG_FILE_NAME } from '@/constants';
import { getConfigFilePath } from '@/lib/config';
import {
  detectProjectTarget,
  hasFile,
  resolveOutputDirectory,
  resolveProjectRoot,
} from '@/lib/project';
import type { ProjectTarget, WithFrameConfig } from '@/types';
import { select } from '@inquirer/prompts';
import { normalizeProjectTarget } from '@/lib/normalize';

export interface InitConfigOptions {
  cwd?: string;
  outputDir?: string;
  target?: string;
  force?: boolean;
}

export interface InitConfigResult {
  configPath: string;
  config: WithFrameConfig;
  overwritten: boolean;
}

const detectTargetIfPossible = async (
  projectRoot: string,
  preferredTarget: ProjectTarget | undefined,
): Promise<ProjectTarget | undefined> => {
  if (preferredTarget) {
    return preferredTarget;
  }

  try {
    return await detectProjectTarget({
      projectRoot,
      optionTarget: undefined,
      config: {},
    });
  } catch {
    return undefined;
  }
};

export class InitService {
  async createConfig(options: InitConfigOptions): Promise<InitConfigResult> {
    const projectRoot = resolveProjectRoot(options.cwd);
    const configPath = getConfigFilePath(projectRoot);
    const alreadyExists = await hasFile(configPath);

    if (alreadyExists && !options.force) {
      throw new Error(
        `${CONFIG_FILE_NAME} already exists at ${configPath}. Use --force to overwrite.`,
      );
    }

    const target = await detectTargetIfPossible(
      projectRoot,
      await this.resolveTarget(options.target),
    );
    const outputDir =
      options.outputDir ??
      (await resolveOutputDirectory({
        projectRoot,
        config: {},
      }));
    const config: WithFrameConfig = {
      outputDir,
      ...(target ? { target } : {}),
    };

    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

    return {
      configPath,
      config,
      overwritten: alreadyExists,
    };
  }

  private async resolveTarget(optionTarget?: string): Promise<ProjectTarget> {
    const normalizedOption = normalizeProjectTarget(optionTarget);
    if (normalizedOption) {
      return normalizedOption;
    }

    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error(
        'Interactive target selection requires a TTY. Pass --target react_native|expo.',
      );
    }

    return select<ProjectTarget>({
      message: 'Pick your project target:',
      default: 'expo',
      choices: [
        {
          name: 'Expo',
          value: 'expo',
          description: 'Use for Expo-based React Native apps',
        },
        {
          name: 'React Native',
          value: 'react_native',
          description: 'Use for plain React Native projects',
        },
      ],
    });
  }
}
