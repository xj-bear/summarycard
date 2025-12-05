import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { config, isS3Configured } from './config.js';
import { v4 as uuidv4 } from 'uuid';

export type OutputMode = 'auto' | 'base64' | 's3' | 'local';

export class StorageService {
    private s3Client: S3Client | null = null;

    constructor() {
        if (isS3Configured()) {
            this.s3Client = new S3Client({
                region: config.AWS_REGION,
                credentials: {
                    accessKeyId: config.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: config.AWS_SECRET_ACCESS_KEY!,
                },
                endpoint: config.S3_ENDPOINT,
                forcePathStyle: !!config.S3_ENDPOINT, // Needed for MinIO often
            });
        }
    }

    async handleImageOutput(imageBuffer: Buffer, mode: OutputMode = 'auto', filename?: string): Promise<{ type: 'text' | 'image', data: string }> {
        const finalMode = this.resolveMode(mode, filename);
        let name = filename || `card-${uuidv4()}.png`;
        if (filename && !path.extname(name)) {
            name += '.png';
        }

        switch (finalMode) {
            case 's3':
                if (!this.s3Client) throw new Error('S3 is not configured');
                const url = await this.uploadToS3(imageBuffer, name);
                return { type: 'text', data: url };

            case 'local':
                const localPath = await this.saveToLocal(imageBuffer, name);
                return { type: 'text', data: localPath };

            case 'base64':
            default:
                return { type: 'image', data: imageBuffer.toString('base64') };
        }
    }

    private resolveMode(mode: OutputMode, filename?: string): OutputMode {
        if (mode !== 'auto') return mode;

        // Priority 1: S3
        if (isS3Configured()) return 's3';

        // Priority 2: Local (Only if filename is provided, implying intent to save)
        if (filename) return 'local';

        // Priority 3: Base64 (Default fallback)
        return 'base64';
    }

    private async uploadToS3(buffer: Buffer, key: string): Promise<string> {
        if (!this.s3Client || !config.S3_BUCKET_NAME) throw new Error('S3 config missing');

        await this.s3Client.send(new PutObjectCommand({
            Bucket: config.S3_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: 'image/png',
            ACL: 'public-read', // Assuming public access is desired/allowed
        }));

        // Construct URL (Basic construction, might need adjustment for specific S3 providers)
        if (config.S3_ENDPOINT) {
            return `${config.S3_ENDPOINT}/${config.S3_BUCKET_NAME}/${key}`;
        }
        return `https://${config.S3_BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;
    }

    private async saveToLocal(buffer: Buffer, filename: string): Promise<string> {
        await fs.mkdir(config.OUTPUT_DIR, { recursive: true });
        const filePath = path.join(config.OUTPUT_DIR, filename);
        await fs.writeFile(filePath, buffer);
        return filePath;
    }
}
