import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { input, select } from '@inquirer/prompts';
import { RegistryClient } from '@/api/registry-client';
import { detectDevice } from '@/lib/shot-devices';
import { normalizeText } from '@/lib/normalize';
import { hasFile } from '@/lib/project';
import { TokenStore } from '@/lib/token-store';
import type { ShotCollectionListItem, ShotOptions, ShotUploadResult } from '@/types';

const CREATE_NEW_COLLECTION = '__create_new_collection__';
const SUPPORTED_SHOT_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
} as const;
type SupportedShotMimeType =
  (typeof SUPPORTED_SHOT_MIME_TYPES)[keyof typeof SUPPORTED_SHOT_MIME_TYPES];

interface ShotUploadExecutionHooks {
  onUploadStart?: () => void;
}

interface CollectionSelectionResult {
  collectionId: string | null;
  createNewCollection?: boolean;
  collectionTitle?: string;
}

export class ShotService {
  constructor(
    private readonly tokenStore: TokenStore,
    private readonly registryClient: RegistryClient,
  ) {}

  public async uploadShot(
    opts: ShotOptions,
    hooks: ShotUploadExecutionHooks = {},
  ): Promise<ShotUploadResult> {
    const filePath = await this.resolveFilePath(opts.file);
    const mimeType = this.resolveMimeType(filePath);

    const tokenResult = await this.tokenStore.resolveAccessToken();

    const content = await this.readFileContent(filePath);
    const { Jimp } = await import('jimp');
    const workingImage = await Jimp.read(content);
    const device = detectDevice(workingImage.bitmap, opts.device);
    const selectedColor = await this.selectDeviceColor(device);

    const collections = await this.registryClient.fetchShotCollections({
      token: tokenResult.token,
      offset: 0,
      limit: 40,
    });

    const selectedCollection = await this.selectCollection(collections.items);

    hooks.onUploadStart?.();

    return this.registryClient.uploadShot({
      token: tokenResult.token,
      fileName: path.basename(filePath),
      mimeType,
      content,
      collectionId: selectedCollection.collectionId || undefined,
      collectionTitle: selectedCollection.collectionTitle || undefined,
      createNewCollection: selectedCollection.createNewCollection,
      color: selectedColor,
    });
  }

  private async selectDeviceColor(device: ReturnType<typeof detectDevice>): Promise<string> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error('Interactive color selection requires a TTY.');
    }

    const availableColors = device.colors.filter((color) => !color.unavailable);
    const fallbackColors = device.colors;
    const colorChoices = availableColors.length > 0 ? availableColors : fallbackColors;

    if (!colorChoices.length) {
      throw new Error(`No frame colors available for device "${device.id}".`);
    }

    if (colorChoices.length === 1) {
      return colorChoices[0].id;
    }

    return select<string>({
      message: `Select device color for ${device.name}:`,
      default: colorChoices[0].id,
      choices: colorChoices.map((color) => ({
        name: `${color.name} (${color.id})`,
        value: color.id,
        description: color.hex,
      })),
    });
  }

  private async resolveFilePath(filePath: string): Promise<string> {
    const normalizedPath = normalizeText(filePath);
    if (!normalizedPath) {
      throw new Error('Screenshot file path is required.');
    }

    const absolutePath = path.resolve(process.cwd(), normalizedPath);
    const exists = await hasFile(absolutePath);
    if (!exists) {
      throw new Error(`File not found at path: ${absolutePath}`);
    }

    return absolutePath;
  }

  private async readFileContent(filePath: string): Promise<Buffer> {
    try {
      await access(filePath);
      return await readFile(filePath);
    } catch {
      throw new Error('File read error. Please check the file path and permissions.');
    }
  }

  private resolveMimeType(filePath: string): SupportedShotMimeType {
    const extension = path.extname(filePath).toLowerCase();
    const mimeType = SUPPORTED_SHOT_MIME_TYPES[extension as keyof typeof SUPPORTED_SHOT_MIME_TYPES];

    if (!mimeType) {
      throw new Error('Unsupported screenshot file type. Supported formats: .png, .jpg, .jpeg');
    }

    return mimeType;
  }

  private async selectCollection(
    items: ShotCollectionListItem[],
  ): Promise<CollectionSelectionResult> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error('Interactive collection selection requires a TTY.');
    }

    const selected = await select<string>({
      message: 'Select collection for screenshot upload:',
      default: CREATE_NEW_COLLECTION,
      choices: [
        {
          name: 'Create new collection',
          value: CREATE_NEW_COLLECTION,
          description: 'Upload into a new screenshot collection',
        },
        ...items.map((item) => ({
          name: `${item.title} (${item.collectionId.slice(0, 8)}...)`,
          value: item.collectionId,
          description: `${item.screenshotsCount} screenshot(s)`,
        })),
      ],
    });

    if (selected !== CREATE_NEW_COLLECTION) {
      return {
        collectionId: selected,
      };
    }

    const collectionTitle = normalizeText(
      await input({
        message: 'Collection title (optional, leave empty for auto-name):',
        default: '',
      }),
    );

    return {
      collectionId: null,
      createNewCollection: true,
      collectionTitle: collectionTitle || undefined,
    };
  }
}
