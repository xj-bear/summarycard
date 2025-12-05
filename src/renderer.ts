import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

export interface CardItem {
    type?: 'default' | 'data' | 'list' | 'full';
    title: string;
    description?: string;
    category: string;
    bgText?: string;
    theme?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
    dataValue?: string; // For 'data' type
    listItems?: string[]; // For 'list' type
    subtitle?: string;
}

export interface CardData {
    pageTitle: string;
    pageDescription: string;
    items: CardItem[];
    style?: 'default' | 'minimal' | 'dark' | 'editorial';
}

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { config } from './config.js';

export class CardRenderer {
    private templatePath: string;

    constructor() {
        this.templatePath = path.join(__dirname, 'templates', 'card.html');
    }

    async render(data: CardData): Promise<Buffer> {
        const html = await this.generateHtml(data);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            executablePath: config.PUPPETEER_EXECUTABLE_PATH
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });

            // Set viewport to fixed mobile width
            const width = 500;
            await page.setViewport({ width, height: 800, deviceScaleFactor: 2 });

            // Get the height of the container
            const bodyHeight = await page.evaluate(() => {
                const container = document.querySelector('.container');
                return container ? container.scrollHeight + 40 : document.body.scrollHeight;
            });

            await page.setViewport({ width, height: bodyHeight, deviceScaleFactor: 2 });

            const buffer = await page.screenshot({
                fullPage: true,
                type: 'png',
                encoding: 'binary',
            });

            return Buffer.from(buffer);
        } finally {
            await browser.close();
        }
    }

    private async generateHtml(data: CardData): Promise<string> {
        const template = await fs.readFile(this.templatePath, 'utf-8');
        const $ = cheerio.load(template);

        // Set Header
        $('.header h1').text(data.pageTitle);
        $('.header p').text(data.pageDescription);

        // Always add mobile class
        $('body').addClass('mobile-layout');

        // Set Style
        $('body').attr('data-style', data.style || 'default');

        // Clear existing cards
        const grid = $('.card-grid');
        grid.empty();

        // Generate cards
        data.items.forEach(item => {
            const cardHtml = this.createCardHtml(item);
            grid.append(cardHtml);
        });

        return $.html();
    }

    private createCardHtml(item: CardItem): string {
        const theme = item.theme || 'blue';
        const bgText = item.bgText || '';
        const type = item.type || 'default';

        let sizeClass = 'card-small'; // Default 3 columns
        if (type === 'full') sizeClass = 'card-full-width';
        if (type === 'list' || type === 'default') sizeClass = 'card-large'; // 2 columns for list or default text
        // Adjust logic:
        // If user explicitly asks for 'default' but it's just text, maybe small or large?
        // Let's stick to simple mapping:
        // full -> card-full-width
        // list -> card-large
        // data -> card-small
        // default -> card-small (unless description is long?) -> let's default to card-small for 'default' to fit more.

        if (type === 'default') sizeClass = 'card-small';

        // Override size if needed based on content? No, let LLM decide type.

        let contentHtml = '';

        // Common elements
        const category = `<span class="card-category color-${theme}">${item.category}</span>`;
        const subtitle = item.subtitle ? `<h3 class="card-subtitle">${item.subtitle}</h3>` : '';
        const headline = `<h2 class="card-headline">${item.title}</h2>`;
        const desc = item.description ? `<p class="card-description">${item.description}</p>` : '';

        if (type === 'data') {
            const isNumeric = /\d/.test(item.dataValue || '');
            const dataClass = isNumeric ? 'card-data-highlight' : 'card-data-text';
            contentHtml = `
        ${category}
        ${subtitle}
        <div class="${dataClass}">${item.dataValue || 'N/A'}</div>
        ${desc}
      `;
        } else if (type === 'list') {
            const listItems = (item.listItems || []).map(li => `<li>${li}</li>`).join('');
            contentHtml = `
        ${category}
        ${subtitle}
        ${headline}
        <ul class="card-list">
          ${listItems}
        </ul>
      `;
        } else {
            // Default and Full
            contentHtml = `
        ${category}
        ${subtitle}
        ${headline}
        ${desc}
      `;
        }

        return `
      <div class="card ${sizeClass} gradient-${theme}" data-bg-text="${bgText}">
        <div class="card-content">
          ${contentHtml}
        </div>
      </div>
    `;
    }
}
