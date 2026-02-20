# Quick Start Guide

Get up and running with Canny MCP Server.

## Prerequisites

- Node.js 18.18+, 20.9+, or 22+ (LTS versions)
- Canny API key ([get one here](https://canny.io/admin/settings/api))
- An MCP-compatible client (Claude Code, Continue.dev, etc.)

## Option A: Use with Claude Code (no clone needed)

```bash
claude mcp add --transport stdio canny \
  --scope user \
  --env CANNY_SUBDOMAIN=<COMPANY_SUBDOMAIN> \
  --env CANNY_API_KEY=<CANNY_API_KEY> \
  --env CANNY_DEFAULT_BOARD=<BOARD_ID> \
  --env CANNY_TOOL_MODE=readonly \
  -- npx -y @opensourceops/canny-mcp
```

Replace `<COMPANY_SUBDOMAIN>`, `<CANNY_API_KEY>`, and `<BOARD_ID>` with your values.

Restart Claude Code. Ask:

```
List the available Canny tools.
```

You should see 37 tools.

## Option B: Install globally

```bash
npm install -g @opensourceops/canny-mcp
```

Then configure your MCP client:

```json
{
  "mcpServers": {
    "canny": {
      "command": "canny-mcp-server",
      "env": {
        "CANNY_API_KEY": "your_api_key",
        "CANNY_SUBDOMAIN": "your_subdomain",
        "CANNY_DEFAULT_BOARD": "your_board_id",
        "CANNY_TOOL_MODE": "readonly"
      }
    }
  }
}
```

## Option C: Clone for local development

```bash
git clone https://github.com/opensourceops/canny-mcp-server.git
cd canny-mcp-server
npm install
npm run build
```

Add to Claude Code:

```bash
claude mcp add --transport stdio canny \
  --env CANNY_API_KEY=your_api_key \
  --env CANNY_SUBDOMAIN=your_subdomain \
  --env CANNY_DEFAULT_BOARD=your_board_id \
  --env CANNY_CONFIG_PATH=$(pwd)/config/default.json \
  -- $(which node) $(pwd)/dist/index.js
```

Or add to your MCP client's config file:

```json
{
  "mcpServers": {
    "canny": {
      "command": "node",
      "args": ["/absolute/path/to/canny-mcp-server/dist/index.js"],
      "env": {
        "CANNY_API_KEY": "your_api_key",
        "CANNY_SUBDOMAIN": "your_subdomain",
        "CANNY_DEFAULT_BOARD": "your_board_id",
        "CANNY_CONFIG_PATH": "/absolute/path/to/canny-mcp-server/config/default.json"
      }
    }
  }
}
```

## Finding Your Credentials

1. **API Key** -- Visit [canny.io/admin/settings/api](https://canny.io/admin/settings/api)
2. **Subdomain** -- Your Canny workspace URL: `https://<subdomain>.canny.io`
3. **Board ID** -- Find it in the Canny admin URL, or run `canny_list_boards` after setup

## Test It Out

### List boards

Call `canny_list_boards` (no parameters):

```json
{
  "boards": [
    {
      "id": "board_123",
      "name": "Feature Requests",
      "postCount": 45,
      "isPrivate": false,
      "url": "https://..."
    }
  ]
}
```

### Search posts

Call `canny_list_posts`:

```json
{
  "status": "open",
  "limit": 5,
  "compact": true
}
```

Response:

```json
{
  "posts": [
    {
      "id": "post_456",
      "title": "Add dark mode support",
      "status": "open",
      "score": 42,
      "url": "https://..."
    }
  ],
  "hasMore": true
}
```

### Filter by category

Call `canny_filter_posts`:

```json
{
  "categoryURLNames": ["continuous-integration"],
  "status": ["open"]
}
```

## Common Use Cases

### Sprint Planning

```
You: "Show me open posts sorted by score"

Tool: canny_list_posts
{ "status": "open", "sort": "score", "limit": 20 }

You: "Update these 5 posts to 'planned' status"

Tool: canny_batch_update_status
{ "postIDs": ["post1", "post2", ...], "status": "planned", "comment": "Added to Sprint 24" }
```

### Customer Feedback Review

```
You: "Use the weekly_triage prompt"

Prompt: weekly_triage

[Claude analyzes feedback and identifies top themes, quick wins, and duplicates to merge]
```

### Jira Integration

```
You: "Link Canny post ABC123 to Jira issue PROJ-456"

Tool: canny_link_jira_issue
{ "postID": "ABC123", "issueKey": "PROJ-456" }
```

## Troubleshooting

### "API key is required"

Ensure `CANNY_API_KEY` is set in your environment or `.env` file.

### "Invalid status"

Your Canny workspace may have custom statuses. Add them in `config/default.json` under `customStatuses`.

### "Rate limit exceeded"

The server retries automatically. If the error persists, wait 60 seconds and reduce request frequency.

## Next Steps

- [Toolset Guide](TOOLSET_GUIDE.md) -- Configure which tools are available
- [Prompt Configuration](PROMPT_CONFIGURATION.md) -- Add custom PM workflows
- [Custom Prompts](custom_prompts.md) -- Advanced prompt examples
- [Canny API Docs](https://developers.canny.io/api-reference)
