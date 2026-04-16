import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { InitService } from '@/api/init-service';

describe('InitService', () => {
  it('creates withframe.config.json from explicit options', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'withframe-init-'));
    const projectDir = path.join(tempRoot, 'project');
    const configPath = path.join(projectDir, 'withframe.config.json');

    await mkdir(projectDir, { recursive: true });

    const service = new InitService();
    const result = await service.createConfig({
      cwd: projectDir,
      outputDir: 'src/components/withframe',
      target: 'expo',
    });

    expect(result.overwritten).toBe(false);
    expect(result.configPath).toBe(configPath);
    expect(result.config).toEqual({
      outputDir: 'src/components/withframe',
      target: 'expo',
    });

    const rawConfig = await readFile(configPath, 'utf8');
    expect(JSON.parse(rawConfig)).toEqual({
      outputDir: 'src/components/withframe',
      target: 'expo',
    });
  });

  it('does not overwrite existing config without --force', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'withframe-init-'));
    const projectDir = path.join(tempRoot, 'project');
    const configPath = path.join(projectDir, 'withframe.config.json');

    await mkdir(projectDir, { recursive: true });
    await writeFile(configPath, JSON.stringify({ outputDir: 'legacy' }, null, 2), 'utf8');

    const service = new InitService();

    await expect(service.createConfig({ cwd: projectDir, target: 'expo' })).rejects.toThrow(
      /already exists/,
    );
    const unchanged = JSON.parse(await readFile(configPath, 'utf8'));
    expect(unchanged).toEqual({ outputDir: 'legacy' });
  });

  it('overwrites config when --force is enabled', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'withframe-init-'));
    const projectDir = path.join(tempRoot, 'project');
    const configPath = path.join(projectDir, 'withframe.config.json');

    await mkdir(projectDir, { recursive: true });
    await writeFile(
      configPath,
      JSON.stringify({ outputDir: 'legacy/components', target: 'expo' }, null, 2),
      'utf8',
    );

    const service = new InitService();
    const result = await service.createConfig({
      cwd: projectDir,
      force: true,
      outputDir: 'ui/withframe',
      target: 'react_native',
    });

    expect(result.overwritten).toBe(true);
    expect(result.config).toEqual({
      outputDir: 'ui/withframe',
      target: 'react_native',
    });

    const saved = JSON.parse(await readFile(configPath, 'utf8'));
    expect(saved).toEqual({
      outputDir: 'ui/withframe',
      target: 'react_native',
    });
  });

  it('calls onInitializeStart before writing config file', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'withframe-init-'));
    const projectDir = path.join(tempRoot, 'project');
    const configPath = path.join(projectDir, 'withframe.config.json');

    await mkdir(projectDir, { recursive: true });

    const service = new InitService();
    let hookCalled = false;
    let fileExistsWhenHookCalled = true;

    await service.createConfig(
      {
        cwd: projectDir,
        outputDir: 'src/components/withframe',
        target: 'expo',
      },
      {
        onInitializeStart: () => {
          hookCalled = true;
          fileExistsWhenHookCalled = existsSync(configPath);
        },
      },
    );

    expect(hookCalled).toBe(true);
    expect(fileExistsWhenHookCalled).toBe(false);
  });
});
