import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagePath = path.join(__dirname, 'test_style_enforcement.png');

try {
    const buffer = fs.readFileSync(imagePath);
    // Simple PNG header parsing to get width/height
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    // IHDR chunk starts at byte 8
    // Width is 4 bytes at byte 16
    // Height is 4 bytes at byte 20

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    console.log(`Image: ${imagePath}`);
    console.log(`Width: ${width}px`);
    console.log(`Height: ${height}px`);
} catch (e) {
    console.error("Error reading image:", e);
}
