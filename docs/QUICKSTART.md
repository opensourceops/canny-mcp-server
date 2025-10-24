# Quick Start Guide

Get up and running with Canny MCP Server in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Canny account with API access
- Canny API key ([Get it here](https://canny.io/admin/settings/api))

## Installation

```bash
# 1. Navigate to the project directory
cd canny-mcp

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
```

## Configuration

Edit `.env`:

```env
CANNY_API_KEY=your_actual_api_key_here
CANNY_DEFAULT_BOARD=your_board_id_here
```

To find your board ID:
1. Go to your Canny admin dashboard
2. Navigate to Settings > API & Webhooks
3. Click on "Boards" to see board IDs

## Build and Run

```bash
# Build the TypeScript code
npm run build

# Start the server
npm start
```

You should see:
```
{"timestamp":"2025-01-19T10:00:00.000Z","level":"INFO","message":"Canny MCP Server started"}
```

## Test It Out

### Example 1: List Your Boards

Call the `canny_list_boards` tool (no parameters needed):

**Response:**
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

### Example 2: Search for Posts

Call `canny_list_posts`:

```json
{
  "status": "open",
  "limit": 5,
  "compact": true
}
```

**Response (optimized for tokens):**
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

### Example 3: Use a Prompt

Call the `weekly_triage` prompt to analyze feedback:

**Generated Analysis:**
```
Analyze this week's feedback and identify:

1. Top 3 themes by volume
   - What are customers talking about most?
   - Any emerging patterns?

2. High-revenue requests
   - Requests from enterprise customers
   - Features with high ARR impact

[... full prompt template]
```

## Integration with Claude Desktop

1. Open Claude Desktop configuration:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the Canny MCP server:

```json
{
  "mcpServers": {
    "canny": {
      "command": "node",
      "args": ["/full/path/to/canny-mcp/dist/index.js"],
      "env": {
        "CANNY_API_KEY": "your-key-here",
        "CANNY_DEFAULT_BOARD": "board-id-here"
      }
    }
  }
}
```

3. Restart Claude Desktop

4. You should now see Canny tools available!

## Common Use Cases

### Use Case 1: Sprint Planning

```
You: "Show me open posts without Jira links, sorted by score"

Tool: canny_list_posts
{
  "status": "open",
  "sort": "score",
  "limit": 20
}

You: "Update these 5 posts to 'planned' status"

Tool: canny_batch_update_status
{
  "postIDs": ["post1", "post2", "post3", "post4", "post5"],
  "status": "planned",
  "comment": "Added to Sprint 24"
}
```

### Use Case 2: Customer Feedback Review

```
You: "Use the weekly_triage prompt"

Prompt: weekly_triage

[Claude analyzes feedback and identifies:
- Top themes
- Quick wins
- Duplicates to merge
- High-revenue requests]
```

### Use Case 3: Jira Integration

```
You: "Link Canny post ABC123 to Jira issue PROJ-456"

Tool: canny_link_jira_issue
{
  "postID": "ABC123",
  "issueKey": "PROJ-456"
}

Response: { "success": true }
```

## Customization

### Add Custom Statuses

Edit `config/default.json`:

```json
{
  "canny": {
    "workspace": {
      "customStatuses": [
        "open",
        "under review",
        "planned",
        "in progress",
        "complete",
        "closed",
        "long term",      // Your custom status
        "needs research"  // Your custom status
      ]
    }
  }
}
```

### Add Board Aliases

```json
{
  "canny": {
    "workspace": {
      "boards": {
        "features": "board_abc123",
        "bugs": "board_def456",
        "integrations": "board_ghi789"
      }
    }
  }
}
```

Now you can use aliases:
```json
{
  "tool": "canny_list_posts",
  "params": {
    "boardAlias": "features"  // Instead of board ID
  }
}
```

## Troubleshooting

### "API key is required" Error

Make sure `CANNY_API_KEY` is set in `.env` and the file is in the project root.

### "Invalid status" Error

Your Canny workspace might have custom statuses. Add them to `config/default.json` under `customStatuses`.

### "Rate limit exceeded" Error

The server automatically retries. If persistent:
- Wait 60 seconds
- Reduce request frequency
- Check if another process is using the API

## Next Steps

- Read the full [README](./README.md) for all features
- Explore all [24 tools](./README.md#tools-24-total)
- Try [PM-focused prompts](./README.md#prompts)
- Check [Resources](./README.md#resources) for dashboard metrics

## Get Help

- Check [troubleshooting guide](./README.md#troubleshooting)
- Review [Canny API docs](https://developers.canny.io/)
- Open an issue on GitHub

Happy product managing! 🚀
