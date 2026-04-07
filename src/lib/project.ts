import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { RegistryManifest, ProjectTarget, WithFrameConfig } from '@/types';
import { isString } from './type-guards';

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

type PackageJson = {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const PACKAGE_NAME_ALIASES: Record<string, string> = {
  '@react-native-async-storage': '@react-native-async-storage/async-storage',
};

// Checks whether a file exists at the given path.
export const hasFile = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

// Checks whether a directory exists at the given path.
const hasDirectory = async (directoryPath: string): Promise<boolean> => {
  try {
    const info = await stat(directoryPath);
    return info.isDirectory();
  } catch {
    return false;
  }
};

// Reads and parses package.json from the project root.
const readPackageJson = async (
  projectRoot: string,
): Promise<{ path: string; data: PackageJson }> => {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const raw = await readFile(packageJsonPath, 'utf8').catch(() => null);

  if (!raw) {
    throw new Error(`Could not find package.json in ${projectRoot}`);
  }

  let data: PackageJson;
  try {
    data = JSON.parse(raw) as PackageJson;
  } catch (error) {
    throw new Error(
      `Failed to parse package.json: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
    );
  }

  return { path: packageJsonPath, data };
};

// Normalizes dependency versions and treats empty or '*' as unpinned.
const normalizeDependencyVersion = (version: string): string => {
  const normalized = version.trim();
  if (!normalized || normalized === '*') {
    return '';
  }

  return normalized;
};

// Normalizes known registry aliases and validates package names.
const normalizePackageName = (name: string): string => {
  const normalized = PACKAGE_NAME_ALIASES[name.trim()] ?? name.trim();
  // Allow scoped and unscoped package names with lowercase letters, numbers, dots, underscores, and hyphens.
  const packageNamePattern = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

  if (!packageNamePattern.test(normalized)) {
    throw new Error(`Invalid package name in manifest: ${name}`);
  }

  return normalized;
};

// Builds dependency specifiers like name@version for install commands.
const toDependencySpecifier = (name: string, version: string): string => {
  const normalizedVersion = normalizeDependencyVersion(version);
  return normalizedVersion ? `${name}@${normalizedVersion}` : name;
};

// Resolves the project root from CLI input or the current working directory.
export const resolveProjectRoot = (cwdOption?: string): string => {
  return !cwdOption ? process.cwd() : path.resolve(cwdOption);
};

// Determines the target platform from options, config, or dependencies.
export const detectProjectTarget = async ({
  projectRoot,
  optionTarget,
  config,
}: {
  projectRoot: string;
  optionTarget?: ProjectTarget;
  config: WithFrameConfig;
}): Promise<ProjectTarget> => {
  if (optionTarget) {
    return optionTarget;
  }

  if (config.target === 'react_native' || config.target === 'expo') {
    return config.target;
  }

  const { data } = await readPackageJson(projectRoot);
  const dependencies = {
    ...(data.dependencies ?? {}),
    ...(data.devDependencies ?? {}),
    ...(data.peerDependencies ?? {}),
  };

  if (isString(dependencies.expo)) {
    return 'expo';
  }

  if (isString(dependencies['react-native'])) {
    return 'react_native';
  }

  throw new Error(
    "Could not detect project target. Install 'expo' or 'react-native', or set target in withframe.config.json.",
  );
};

// Chooses where generated components should be written.
export const resolveOutputDirectory = async ({
  projectRoot,
  config,
}: {
  projectRoot: string;
  config: WithFrameConfig;
}): Promise<string> => {
  if (config.outputDir) {
    return config.outputDir;
  }

  const appComponentsPath = path.join(projectRoot, 'app', 'components');
  if (await hasDirectory(appComponentsPath)) {
    return path.join('app', 'components', 'withframe');
  }

  return path.join('src', 'components', 'withframe');
};

// Detects the package manager by lockfile presence.
export const detectPackageManager = async (projectRoot: string): Promise<PackageManager> => {
  if (await hasFile(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await hasFile(path.join(projectRoot, 'yarn.lock'))) {
    return 'yarn';
  }
  if (
    (await hasFile(path.join(projectRoot, 'bun.lockb'))) ||
    (await hasFile(path.join(projectRoot, 'bun.lock')))
  ) {
    return 'bun';
  }

  return 'npm';
};

// Ensures a destination path is within the project root.
export const isPathInsideRoot = (projectRoot: string, targetPath: string): boolean => {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedTarget = path.resolve(targetPath);

  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`);
};

// Writes manifest files and tracks created, overwritten, and skipped outputs.
export const writeManifestFiles = async ({
  projectRoot,
  outputDir,
  files,
  yes,
  confirmOverwrite,
}: {
  projectRoot: string;
  outputDir: string;
  files: RegistryManifest['files'];
  yes: boolean;
  confirmOverwrite: (filePath: string) => Promise<boolean>;
}): Promise<{ created: string[]; overwritten: string[]; skipped: string[] }> => {
  const created: string[] = [];
  const overwritten: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const relativeFilePath = file.path.replace(/^\/+/, '');
    const destination = path.resolve(projectRoot, outputDir, relativeFilePath);

    if (!isPathInsideRoot(projectRoot, destination)) {
      throw new Error(`Refusing to write outside project root: ${file.path}`);
    }

    const exists = await hasFile(destination);
    if (exists) {
      let shouldOverwrite = yes;
      if (!shouldOverwrite) {
        shouldOverwrite = await confirmOverwrite(destination);
      }

      if (!shouldOverwrite) {
        skipped.push(destination);
        continue;
      }
    }

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content, 'utf8');

    if (exists) {
      overwritten.push(destination);
    } else {
      created.push(destination);
    }
  }

  return { created, overwritten, skipped };
};

// Collects missing manifest dependencies and returns install specifiers.
export const mergeManifestDependencies = async ({
  projectRoot,
  manifest,
}: {
  projectRoot: string;
  manifest: RegistryManifest;
}): Promise<{ runtimeToInstall: string[]; devToInstall: string[] }> => {
  const packageJson = await readPackageJson(projectRoot);
  const content = packageJson.data;

  content.dependencies = content.dependencies ?? {};
  content.devDependencies = content.devDependencies ?? {};
  content.peerDependencies = content.peerDependencies ?? {};

  const hasAnyDependency = (name: string): boolean =>
    Boolean(
      content.dependencies?.[name] ??
      content.devDependencies?.[name] ??
      content.peerDependencies?.[name],
    );

  const runtimeToInstall: string[] = [];
  const devToInstall: string[] = [];

  for (const [rawName, version] of Object.entries(manifest.dependencies ?? {})) {
    const name = normalizePackageName(rawName);
    if (hasAnyDependency(name)) {
      continue;
    }

    runtimeToInstall.push(toDependencySpecifier(name, version));
  }

  for (const [rawName, version] of Object.entries(manifest.peerDependencies ?? {})) {
    const name = normalizePackageName(rawName);
    if (hasAnyDependency(name)) {
      continue;
    }

    runtimeToInstall.push(toDependencySpecifier(name, version));
  }

  for (const [rawName, version] of Object.entries(manifest.devDependencies ?? {})) {
    const name = normalizePackageName(rawName);
    if (hasAnyDependency(name)) {
      continue;
    }

    devToInstall.push(toDependencySpecifier(name, version));
  }

  return { runtimeToInstall, devToInstall };
};

// Runs a package manager command and rejects on non-zero exit.
const runPackageCommand = async ({
  projectRoot,
  command,
  args,
}: {
  projectRoot: string;
  command: string;
  args: string[];
}): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
};

// Installs runtime and dev dependencies with the detected package manager.
export const installDependencies = async ({
  projectRoot,
  runtimeDependencies,
  devDependencies,
}: {
  projectRoot: string;
  runtimeDependencies: string[];
  devDependencies: string[];
}): Promise<string[]> => {
  if (!runtimeDependencies.length && !devDependencies.length) {
    return [];
  }

  const manager = await detectPackageManager(projectRoot);

  if (runtimeDependencies.length) {
    if (manager === 'npm') {
      await runPackageCommand({
        projectRoot,
        command: 'npm',
        args: ['install', '--no-progress', ...runtimeDependencies],
      });
    }
    if (manager === 'pnpm') {
      await runPackageCommand({
        projectRoot,
        command: 'pnpm',
        args: ['add', ...runtimeDependencies],
      });
    }
    if (manager === 'yarn') {
      await runPackageCommand({
        projectRoot,
        command: 'yarn',
        args: ['add', ...runtimeDependencies],
      });
    }
    if (manager === 'bun') {
      await runPackageCommand({
        projectRoot,
        command: 'bun',
        args: ['add', ...runtimeDependencies],
      });
    }
  }

  if (devDependencies.length) {
    if (manager === 'npm') {
      await runPackageCommand({
        projectRoot,
        command: 'npm',
        args: ['install', '--no-progress', '--save-dev', ...devDependencies],
      });
    }
    if (manager === 'pnpm') {
      await runPackageCommand({
        projectRoot,
        command: 'pnpm',
        args: ['add', '--save-dev', ...devDependencies],
      });
    }
    if (manager === 'yarn') {
      await runPackageCommand({
        projectRoot,
        command: 'yarn',
        args: ['add', '--dev', ...devDependencies],
      });
    }
    if (manager === 'bun') {
      await runPackageCommand({
        projectRoot,
        command: 'bun',
        args: ['add', '--dev', ...devDependencies],
      });
    }
  }

  return [...runtimeDependencies, ...devDependencies];
};
