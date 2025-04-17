# SokoClick MCP Quick Start Guide

This guide will help you quickly set up and start using the Model Context Protocol (MCP) with SokoClick's Supabase backend.

## Prerequisites

1. Cursor installed on your machine
2. Access to the SokoClick Supabase project
3. Node.js installed

## Setup in 5 Minutes

### Step 1: Get Your Supabase Access Token

1. Log into the [Supabase Dashboard](https://app.supabase.com)
2. Click on your profile picture in the top right
3. Select "Access Tokens"
4. Create a new token named "SokoClick MCP"
5. Copy the token (you'll only see it once!)

### Step 2: Configure MCP in Your Project

1. Create a `.cursor/mcp.json` file in your project root (or copy from `.cursor/mcp.example.json`)
2. Add your token to the configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "your-actual-token-here"
      ]
    }
  }
}
```

3. Replace "your-actual-token-here" with your token

### Step 3: Verify Connection

1. Open Cursor
2. Go to Settings > MCP
3. Look for a green "Active" indicator next to "supabase"

## Try These Starter Queries

Once connected, try asking your AI assistant:

1. **Database exploration**: "What tables are in the SokoClick database?"
2. **Schema details**: "Describe the structure of the auction_slots table"
3. **Join query**: "Show me all active auction slots with their product details"
4. **Data insights**: "What are the most viewed products in the last 30 days?"

## Common Issues

### Connection Problems

If your MCP server doesn't connect:

- Make sure Node.js is installed and `npx` is available
- Check your token hasn't expired
- Try restarting Cursor

### Permission Issues

If queries fail with permission errors:

- Make sure your token has the necessary permissions
- Verify you're connected to the correct Supabase project

## Resources

- [Full MCP setup documentation](./mcp-setup.md)
- [Example queries for SokoClick](./mcp-example-queries.md)
- [Official Supabase MCP documentation](https://supabase.com/docs/guides/getting-started/mcp)

## Feedback and Support

If you encounter issues with the MCP integration, please contact the development team and include:

1. The query you were trying to run
2. Any error messages (without including your token)
3. Your operating system and Cursor version 