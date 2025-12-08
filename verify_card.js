import { CardRenderer } from './dist/src/renderer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
    try {
        const renderer = new CardRenderer();

        const data = {
            pageTitle: "测试页面标题",
            pageDescription: "这是一个用于测试卡片生成功能的页面描述。包含多种卡片类型以验证布局兼容性。",
            items: [
                {
                    type: "full",
                    title: "全宽卡片",
                    category: "测试",
                    description: "这是一个全宽卡片，应该占据整行。",
                    theme: "purple",
                    bgText: "FULL"
                },
                {
                    type: "data",
                    title: "数据卡片",
                    category: "统计",
                    dataValue: "99.9%",
                    subtitle: "SOTA",
                    theme: "orange",
                    bgText: "DATA"
                },
                {
                    type: "list",
                    title: "列表卡片",
                    category: "功能",
                    listItems: [
                        "功能点一：支持多种布局",
                        "功能点二：移动端优先",
                        "功能点三：自动换行兼容性"
                    ],
                    theme: "green",
                    bgText: "LIST"
                },
                {
                    type: "default",
                    title: "普通卡片",
                    category: "信息",
                    description: "这是一个普通卡片，包含较长的文本来测试自动换行功能。LongEnglishWordToTestWordBreakFunctionality.",
                    theme: "blue",
                    bgText: "INFO"
                }
            ],
            style: "default"
        };

        console.log("Generating card...");
        const buffer = await renderer.render(data);

        const outputPath = path.join(__dirname, 'test_output.png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`Card generated successfully at: ${outputPath}`);

    } catch (error) {
        console.error("Error generating card:", error);
    }
}

test();
