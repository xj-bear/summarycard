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
      version: "1.1.0",
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

  if (process.env.TRANSPORT_MODE === 'sse') {
    const express = (await import("express")).default;
    const { SSEServerTransport } = await import("@modelcontextprotocol/sdk/server/sse.js");

    const app = express();
    // app.use(express.json()); // Removed to avoid consuming request stream
    const port = process.env.PORT || 3000;

    // Store active transports and servers
    const sessions = new Map<string, { transport: any, server: Server }>();

    app.get("/sse", async (req, res) => {
      console.log("New SSE connection request");
      const transport = new SSEServerTransport("/messages", res);
      const server = new Server(
        {
          name: "summary-card-mcp",
          version: "1.1.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      // Re-register tools for this new server instance
      server.setRequestHandler(ListToolsRequestSchema, async () => {
        console.log("Handling ListToolsRequest");
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

      server.setRequestHandler(LooseCallToolRequestSchema, async (request) => {
        console.log("Handling Tool Call:", request.params.name);
        if (request.params.name === "generate_card") {
          try {
            let args = request.params.arguments;
            if (typeof args === 'string') {
              try {
                args = JSON.parse(args);
              } catch (e) {
                throw new Error(`Invalid JSON in arguments: ${(e as Error).message}`);
              }
            }
            const input = GenerateCardSchema.parse(args);
            const imageBuffer = await renderer.render(input as CardData);
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
                    text: result.data,
                  },
                ],
              };
            }
          } catch (error: any) {
            console.error("Error in tool call:", error);
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

      await server.connect(transport);

      // Store session
      if (transport.sessionId) {
        console.log("Session created:", transport.sessionId);
        sessions.set(transport.sessionId, { transport, server });
      } else {
        console.error("No sessionId generated for transport");
      }

      // Cleanup on close
      req.on('close', () => {
        if (transport.sessionId) {
          console.log("Session closed:", transport.sessionId);
          sessions.delete(transport.sessionId);
        }
      });
    });

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      console.log("Received message for session:", sessionId);
      if (!sessionId) {
        res.status(400).send("Missing sessionId");
        return;
      }
      const session = sessions.get(sessionId);
      if (session) {
        try {
          await session.transport.handlePostMessage(req, res);
        } catch (error) {
          console.error("Error handling post message:", error);
          res.status(500).send(String(error));
        }
      } else {
        console.warn("Session not found for:", sessionId);
        res.status(404).send("Session not found");
      }
    });

    app.listen(port, () => {
      console.error(`Summary Card MCP Server running on SSE at http://0.0.0.0:${port}/sse`);
    });

  } else {
    // Stdio Mode
    // We need to move the server setup here or reuse it?
    // Since we can't easily reuse the server instance for multiple SSE connections (stateful),
    // we created new ones for SSE. For Stdio, we can use the one created at top of main, 
    // BUT we need to attach handlers to it.
    // The handlers were attached to `server` variable which is local to main.
    // Wait, in my replacement I am replacing the END of main.
    // The `server` variable was created at the top of `main`.
    // So I should use THAT server for Stdio.

    // But I need to attach handlers to it.
    // The handlers are currently attached in the middle of main (lines 48-157).
    // I should probably REFACTOR the handler attachment to a function to avoid code duplication.
    // OR, I can just copy-paste for now to ensure it works without massive refactoring risk.
    // Actually, the `server` variable at line 33 is already configured with handlers in the original code?
    // Yes, lines 48-157 attach handlers to `server`.
    // So if I am in Stdio mode, I just need to connect transport.

    // BUT, for SSE mode, I created NEW servers.
    // So the `server` at line 33 is UNUSED in SSE mode. That's fine.

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Summary Card MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
