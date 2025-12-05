import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const ConfigSchema = z.object({
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().default('us-east-1'),
    S3_BUCKET_NAME: z.string().optional(),
    S3_ENDPOINT: z.string().optional(), // For MinIO or other S3-compatible services
    OUTPUT_DIR: z.string().default(path.join(process.cwd(), 'output')),
    PORT: z.string().transform(Number).default(3000),
    PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
});

export const config = ConfigSchema.parse(process.env);

export const isS3Configured = () => {
    return !!(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY && config.S3_BUCKET_NAME);
};
