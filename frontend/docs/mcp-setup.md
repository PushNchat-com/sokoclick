# Setting Up Supabase MCP Integration

This guide explains how to configure the Model Context Protocol (MCP) to connect your AI development tools with Supabase.

## What is MCP?

The Model Context Protocol (MCP) allows AI assistants like Claude in Cursor to interact directly with your Supabase projects, making it easier to:
- Query your database
- Create tables
- Fetch project configurations
- Generate and test queries

## Setup Steps

### 1. Create a Supabase Personal Access Token (PAT)

1. Sign in to your [Supabase dashboard](https://app.supabase.com)
2. Navigate to your profile settings
3. Select "Access Tokens"
4. Create a new token with a name like "SokoClick MCP"
5. Copy the generated token (you'll only see it once)

### 2. Configure MCP in Cursor

For Windows environments, the MCP configuration in `.cursor/mcp.json` should be:

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
        "<personal-access-token>"
      ]
    }
  }
}
```

Replace `<personal-access-token>` with your actual Supabase PAT.

### 3. Verify Configuration

1. Open Cursor and navigate to **Settings/MCP** 
2. You should see a green active status when the server is successfully connected
3. Try asking your AI assistant about your Supabase project

## Security Considerations

- **Never commit your access token to version control**
- Our `.gitignore` already excludes `.cursor/mcp.json`
- Use `.cursor/mcp.example.json` as a template without real tokens
- Consider using a dedicated read-only token for querying operations
- Regularly rotate your access tokens

## Troubleshooting

If you encounter issues:

1. **Connection failures**: Verify your token is valid and has not expired
2. **Permission errors**: Ensure your token has appropriate permissions
3. **Windows-specific issues**: Try running the command manually in CMD to check for errors
4. **Network issues**: Check your firewall isn't blocking the connection

## For Local Supabase Development

If working with a local Supabase instance, consider using the Postgres MCP server instead:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c", 
        "npx", 
        "-y", 
        "@modelcontextprotocol/server-postgres", 
        "<connection-string>"
      ]
    }
  }
}
```

Replace `<connection-string>` with your local database connection string. 