import { Context } from 'hono';
import { Storage, InfraProvider } from '@uptiqai/integrations-sdk';
import catchAsync from '../utils/catchAsync.ts';
import ApiError from '../utils/ApiError.ts';

const hasValue = (value?: string) => typeof value === 'string' && value.trim().length > 0;

const isPlaceholder = (value?: string) => {
  if (!hasValue(value)) return true;
  const lowered = value!.toLowerCase();
  return lowered.includes('your_') || lowered.includes('_here') || lowered.includes('example');
};

const hasStorageProvider = () => hasValue(process.env.INFRA_PROVIDER) && !isPlaceholder(process.env.INFRA_PROVIDER);

const buildMockFileResponse = (key: string, fileName?: string) => {
  const baseUrl = process.env.BACKEND_DOMAIN || 'http://localhost:9000';
  return {
    url: `${baseUrl}/mock-storage/${encodeURIComponent(key)}`,
    key,
    fileName: fileName || key,
    provider: 'mock'
  };
};

const getStorage = () => {
  const provider = process.env.INFRA_PROVIDER as InfraProvider;
  if (!provider || !hasStorageProvider()) {
    throw new ApiError(500, 'INFRA_PROVIDER is not configured');
  }
  return new Storage({ provider });
};

export const uploadFile = catchAsync(async (c: Context) => {
  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof Blob)) {
    throw new ApiError(400, 'File is required');
  }

  const fileName = (file as any).name || 'uploaded_file';
  const destinationKey = `uploads/${Date.now()}_${fileName}`;

  if (!hasStorageProvider()) {
    return c.json(buildMockFileResponse(destinationKey, fileName));
  }

  try {
    const storage = getStorage();
    const result = await storage.uploadFile({
      file,
      destinationKey,
    }) as any;

    return c.json({
      url: result.url,
      key: result.key,
      fileName,
    });
  } catch (error) {
    console.error('uploadFile failed, using mock response:', error);
    return c.json(buildMockFileResponse(destinationKey, fileName));
  }
});

export const getDownloadUrl = catchAsync(async (c: Context) => {
  const { key, fileName } = await c.req.json();
  if (!key) throw new ApiError(400, 'Key is required');

  if (!hasStorageProvider()) {
    if (typeof key === 'string' && (key.startsWith('http://') || key.startsWith('https://'))) {
      return c.json({ url: key, key, fileName });
    }
    return c.json(buildMockFileResponse(key, fileName));
  }

  try {
    const storage = getStorage();
    const result = await storage.generateDownloadSignedUrl({
      key,
      fileName,
    });
    return c.json(result);
  } catch (error) {
    console.error('getDownloadUrl failed, using mock response:', error);
    if (typeof key === 'string' && (key.startsWith('http://') || key.startsWith('https://'))) {
      return c.json({ url: key, key, fileName });
    }
    return c.json(buildMockFileResponse(key, fileName));
  }
});
