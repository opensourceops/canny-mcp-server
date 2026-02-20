[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/opensourceops-canny-mcp-server-badge.png)](https://mseep.ai/app/opensourceops-canny-mcp-server)
[![Verified on MseeP](https://mseep.ai/badge.svg)](https://mseep.ai/app/5d4679fa-ba73-46e6-b94e-582a8533f594)
# Canny MCP Server

A Model Context Protocol (MCP) server for Canny feedback management. Connect Canny to any MCP-compatible AI client to manage customer feedback, prioritize features, and streamline product development through natural language.

## Features

- **37 Tools** — Full Canny API coverage: posts, comments, votes, users, categories, tags, changelog, status changes, ideas, insights, groups, opportunities, and Jira integration
- **Token-Optimized** — 70–90% smaller responses than the raw API
- **Jira Integration** — Link posts to Jira issues
- **PM Workflows** — Built-in prompts for weekly triage, sprint planning, and executive reporting
- **Smart Pagination** — Automatic cursor/skip handling
- **Batch Operations** — Bulk status changes
- **Configurable Toolsets** — Readonly by default; enable write tools selectively

## Prerequisites

- **Node.js** v20.9+, v22+, or v24+ (LTS versions)
- **npm** v9+
- **MCP Client** — Claude Code, Continue.dev, or any MCP-compatible client
- **Canny API Key** — Get one at [canny.io/admin/settings/api](https://canny.io/admin/settings/api)

## Quick Start with Claude Code

The fastest way to start: run `npx` directly through Claude Code. No clone, no build.

### Step 1: Get Your Canny Credentials

1. **API Key** — Visit [canny.io/admin/settings/api](https://canny.io/admin/settings/api)
2. **Subdomain** — Your Canny workspace URL: `https://<subdomain>.canny.io`
3. **Board ID** (optional) — Find it via the Canny admin URL or by running `canny_list_boards` after setup

### Step 2: Add the MCP Server

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

### Step 3: Restart Claude Code

Quit and reopen Claude Code for the new server to load.

### Step 4: Verify

Ask Claude:

```
List the available Canny tools.
```

You should see 37 tools, including `canny_list_posts`, `canny_get_post`, and `canny_list_ideas`.

## Global Install

To install the package globally:

```bash
npm install -g @opensourceops/canny-mcp
```

Then configure your MCP client to run `canny-mcp-server` instead of `npx`:

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

## Available Tools

### Discovery (9 tools: 8 read-only, 1 write)
- `canny_list_boards` — List all boards
- `canny_list_tags` — List tags (optionally by board)
- `canny_create_tag` — Create a new tag on a board
- `canny_list_categories` — List categories
- `canny_list_posts` — List posts with filters (status, author, company, tags)
- `canny_filter_posts` — Filter by category, company, segment, tag slugs, and date ranges
- `canny_get_post` — Get full post details with comments and votes
- `canny_list_status_changes` — List post status change history for auditing
- `canny_create_category` — Create a board category

### Posts (6 write tools)
- `canny_create_post` — Create a post (supports images, ETA, owner)
- `canny_update_post` — Update title, description, ETA, or images
- `canny_update_post_status` — Change status with optional voter notification
- `canny_change_category` — Move a post to a different category
- `canny_add_post_tag` — Add a tag to a post
- `canny_remove_post_tag` — Remove a tag from a post

### Engagement (6 tools: 2 read-only, 4 write)
- `canny_list_comments` — List comments (filterable by company)
- `canny_list_votes` — List votes
- `canny_create_comment` — Add a comment (supports images, internal flag)
- `canny_delete_comment` — Remove a comment
- `canny_add_vote` — Add a vote
- `canny_remove_vote` — Remove a vote

### Users & Companies (4 tools: 2 read-only, 2 write)
- `canny_get_user_details` — Look up a user by ID, email, or custom userID
- `canny_list_companies` — List companies with MRR data
- `canny_find_or_create_user` — Find or create a user with company associations
- `canny_link_company` — Link a user to a company

### Jira (2 write tools)
- `canny_link_jira_issue` — Link a Jira issue to a post
- `canny_unlink_jira_issue` — Unlink a Jira issue

### Changelog (2 tools: 1 read-only, 1 write)
- `canny_list_changelog_entries` — List changelog entries
- `canny_create_changelog_entry` — Create a changelog entry to communicate product updates

### Ideas Ecosystem (7 read-only tools)
- `canny_list_groups` — List groups (cursor-based pagination)
- `canny_get_group` — Get a group by ID or URL name
- `canny_list_ideas` — List ideas with filtering, search, and sorting
- `canny_get_idea` — Get an idea by ID or URL name
- `canny_list_insights` — List insights, optionally filtered by idea
- `canny_get_insight` — Get an insight by ID
- `canny_list_opportunities` — List Salesforce opportunities linked to Canny

### Batch (1 write tool)
- `canny_batch_update_status` — Update multiple post statuses at once

## Configuration

### Tool Modes

The server runs in **readonly** mode by default (19 read-only tools). To enable write operations, set `CANNY_TOOL_MODE`:

| Mode | Tools | Description |
|------|-------|-------------|
| `readonly` | 19 | Read-only tools only (default) |
| `all` | 37 | All tools, including writes |
| `discovery,posts` | varies | Specific toolsets (comma-separated) |

Set via environment variable or `config/default.json`:

```json
{
  "server": {
    "toolMode": "all"
  }
}
```

Rebuild after changing `config/default.json`:

```bash
npm run build
```

### Environment Variables

**Canny API (required)**

| Variable | Default | Description |
|----------|---------|-------------|
| `CANNY_API_KEY` | -- | Your Canny API key (required) |
| `CANNY_BASE_URL` | `https://canny.io/api/v1` | Canny API base URL |
| `CANNY_SUBDOMAIN` | auto-detected | Your Canny subdomain; auto-detected from `CANNY_BASE_URL` if `*.canny.io` |
| `CANNY_CONFIG_PATH` | `config/default.json` | Path to the JSON config file |

**Workspace**

| Variable | Default | Description |
|----------|---------|-------------|
| `CANNY_DEFAULT_BOARD` | -- | Default board ID |
| `CANNY_WORKSPACE_NAME` | `Default` | Workspace display name |
| `CANNY_CUSTOM_STATUSES` | `open,under review,planned,in progress,complete,closed` | Comma-separated list of valid statuses |

**Jira Integration**

| Variable | Default | Description |
|----------|---------|-------------|
| `CANNY_JIRA_ENABLED` | `false` | Enable Jira integration (`true`/`false`) |
| `CANNY_JIRA_PROJECT_KEY` | -- | Jira project key (e.g., `PROJ`) |

**Pagination & Display**

| Variable | Default | Description |
|----------|---------|-------------|
| `CANNY_PAGINATION_LIMIT` | `10` | Results per page |
| `CANNY_PAGINATION_MAX` | `50` | Maximum total results |
| `CANNY_COMPACT_MODE` | `true` | Return compact responses (`true`/`false`) |

**Cache**

| Variable | Default | Description |
|----------|---------|-------------|
| `CANNY_CACHE_ENABLED` | `true` | Enable response caching (`true`/`false`) |
| `CANNY_CACHE_MAX_SIZE` | `100` | Maximum cache entries |

**Rate Limiting**

| Variable | Default | Description |
|----------|---------|-------------|
| `CANNY_RATE_LIMIT_REQUESTS` | `100` | Maximum requests per window |
| `CANNY_RATE_LIMIT_WINDOW` | `60000` | Rate limit window in milliseconds |

**Server**

| Variable | Default | Description |
|----------|---------|-------------|
| `CANNY_TOOL_MODE` | `readonly` | `readonly`, `all`, or comma-separated toolsets |
| `SERVER_TRANSPORT` | `stdio` | Transport mode: `stdio`, `http`, or `both` |
| `SERVER_HTTP_PORT` | `3000` | HTTP server port (when transport includes `http`) |
| `SERVER_HTTP_HOST` | `0.0.0.0` | HTTP server bind address |

**Logging**

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | `json` | Log format: `json` or `pretty` |

### Custom Prompts

The server ships with 5 built-in prompts (`weekly_triage`, `sprint_planning`, `executive_summary`, `jira_sync_status`, `customer_impact`). Add your own in `config/default.json`:

```json
{
  "prompts": [
    {
      "name": "my_workflow",
      "description": "Custom triage workflow",
      "template": "Analyze feedback and..."
    }
  ]
}
```

See [Prompt Configuration](docs/PROMPT_CONFIGURATION.md) for the full guide and [Custom Prompts](docs/custom_prompts.md) for advanced examples.

## Local Development Environment

Clone the repository to modify the server, run tests, or contribute.

### Step 1: Clone and Build

```bash
git clone https://github.com/opensourceops/canny-mcp-server.git
cd canny-mcp-server
npm install
npm run build
```

### Step 2: Configure Your MCP Client

#### Option A: Claude Code (via CLI)

```bash
claude mcp add --transport stdio canny \
  --env CANNY_API_KEY=your_api_key \
  --env CANNY_SUBDOMAIN=your_subdomain \
  --env CANNY_DEFAULT_BOARD=your_board_id \
  --env CANNY_CONFIG_PATH=$(pwd)/config/default.json \
  -- $(which node) $(pwd)/dist/index.js
```

#### Option B: Manual JSON Configuration

Add to your MCP client's config file:

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

### Step 3: Restart and Verify

Restart your MCP client, then ask:

```
Show me the latest feature requests from Canny.
```

## Documentation

- [Quick Start Guide](docs/QUICKSTART.md)
- [Toolset Guide](docs/TOOLSET_GUIDE.md)
- [Prompt Configuration](docs/PROMPT_CONFIGURATION.md)
- [Custom Prompts](docs/custom_prompts.md)

## Troubleshooting

### API Key Issues

Test your key directly:

```bash
curl https://canny.io/api/v1/boards/list --data apiKey=YOUR_API_KEY
```

This should return your boards.

### Tools Not Appearing

1. Rebuild after config changes: `npm run build`
2. Restart your MCP client (quit and reopen)
3. Check `CANNY_TOOL_MODE` — `readonly` excludes write tools
4. Use absolute paths in manual JSON configuration

### Node.js Version Warnings

Use Node.js LTS versions (20.9+, 22+, or 24+). Odd-numbered releases (23, 25) are non-LTS and unsupported. Switch with `nvm use 20` or `nvm use 22`.

Deprecated package warnings (ESLint, glob) affect only devDependencies and do not affect production runtime.

## Security

- Never commit `.env` files or API keys
- Use `readonly` mode for general use
- Enable write tools only when needed
- Keep `CANNY_API_KEY` secret

## Project Structure

```
canny-mcp-server/
├── src/                 # TypeScript source
│   ├── index.ts         # Entry point
│   ├── server.ts        # MCP server
│   ├── api/             # Canny API client
│   ├── tools/           # MCP tools
│   ├── prompts/         # Built-in prompts
│   └── types/           # Type definitions
├── config/
│   └── default.json     # Server configuration
├── docs/                # Documentation
├── dist/                # Compiled output (generated)
├── package.json
└── tsconfig.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

Apache 2.0 — See [LICENSE](LICENSE).

## Support

- **Issues** — [GitHub Issues](https://github.com/opensourceops/canny-mcp-server/issues)
- **API Reference** — [Canny API Documentation](https://developers.canny.io/api-reference)
