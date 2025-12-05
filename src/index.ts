#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { CardRenderer, CardData } from "./renderer.js";
import { StorageService, OutputMode } from "./storage.js";

// Tool Input Schema
const GenerateCardSchema = z.object({
  pageTitle: z.string().describe("The main title of the summary card"),
  pageDescription: z.string().describe("A brief description or summary of the content"),
  items: z.array(z.object({
    type: z.enum(['default', 'data', 'list', 'full']).optional().describe("Card type: default (text), data (number highlight), list (bullet points), full (wide)"),
    title: z.string().describe("Title of the individual card"),
    description: z.string().optional().describe("Description text"),
    category: z.string().describe("Category label (e.g., 'Key Point', 'Stats')"),
    bgText: z.string().optional().describe("Background decorative text (short, e.g., '01', 'AI')"),
    theme: z.enum(['blue', 'green', 'orange', 'purple', 'red']).optional().describe("Color theme"),
    dataValue: z.string().optional().describe("Value for data cards (e.g., '99%')"),
    listItems: z.array(z.string()).optional().describe("List items for list cards"),
    subtitle: z.string().optional().describe("Small subtitle above headline"),
  })).describe("List of content cards to display"),
  output_mode: z.enum(['auto', 'base64', 's3', 'local']).optional().default('auto').describe("Output format preference"),
  filename: z.string().optional().describe("Filename for local/s3 storage"),
  style: z.enum(['default', 'minimal', 'dark', 'editorial']).optional().default('default').describe("Visual style theme"),
});

async function main() {
  const server = new Server(
    {
      name: "summary-card-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const renderer = new CardRenderer();
  const storage = new StorageService();

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "generate_card",
          description: "Generate a visual summary card from text content. Returns an image (Base64, URL, or Path).",
          inputSchema: {
            type: "object",
            properties: {
              pageTitle: { type: "string", description: "Main title" },
              pageDescription: { type: "string", description: "Main summary/description" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["default", "data", "list", "full"] },
                    title: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    bgText: { type: "string" },
                    theme: { type: "string", enum: ["blue", "green", "orange", "purple", "red"] },
                    dataValue: { type: "string" },
                    listItems: { type: "array", items: { type: "string" } },
                    subtitle: { type: "string" },
                  },
                  required: ["title", "category"],
                },
              },
              output_mode: { type: "string", enum: ["auto", "base64", "s3", "local"] },
              filename: { type: "string" },
              style: { type: "string", enum: ["default", "minimal", "dark", "editorial"], description: "Visual style theme" },
            },
            required: ["pageTitle", "pageDescription", "items"],
          },
        },
      ],
    };
  });

  // Custom schema to allow string arguments (robustness for some clients)
  const LooseCallToolRequestSchema = z.object({
    method: z.literal("tools/call"),
    params: z.object({
      name: z.string(),
      arguments: z.any().optional(),
      _meta: z.any().optional(),
    }),
  });

  server.setRequestHandler(LooseCallToolRequestSchema, async (request) => {
    if (request.params.name === "generate_card") {
      try {
        let args = request.params.arguments;

        // Handle stringified JSON arguments
        if (typeof args === 'string') {
          try {
            args = JSON.parse(args);
          } catch (e) {
            throw new Error(`Invalid JSON in arguments: ${(e as Error).message}`);
          }
        }

        const input = GenerateCardSchema.parse(args);

        // Render
        const imageBuffer = await renderer.render(input as CardData);

        // Store/Format
        const result = await storage.handleImageOutput(
          imageBuffer,
          input.output_mode as OutputMode,
          input.filename
        );

        if (result.type === 'image') {
          return {
            content: [
              {
                type: "image",
                data: result.data,
                mimeType: "image/png",
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: result.data, // URL or Path
              },
            ],
          };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating card: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
    throw new Error("Tool not found");
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Summary Card MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
