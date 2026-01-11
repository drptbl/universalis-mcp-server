#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import pkg from '../package.json' with { type: 'json' }
import { getMarketBoard } from './tools/get-market-board.js'

const server = new McpServer({
  name: 'universalis',
  version: pkg.version,
  capabilities: {
    resources: {},
    tools: {},
  },
})

server.tool(
  'get_market_board',
  'Get market board from Universalis',
  {
    itemName: z.string().describe('The name of the item to search for'),
    serverNames: z.array(z.string()).describe('The names of servers to search in. E.g., "Atomos" for global, "초코보" for Korea'),
  },
  async ({ itemName, serverNames }) => {
    return { content: [{ type: 'text', text: JSON.stringify(await getMarketBoard(itemName, serverNames)) }] }
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error in main():', error)
  process.exit(1)
})
