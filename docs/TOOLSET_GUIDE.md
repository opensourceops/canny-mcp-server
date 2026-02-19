# Toolset Guide

## Overview

The Canny MCP Server organizes its 24 tools into 6 toolsets. You enable toolsets through the `CANNY_TOOL_MODE` environment variable or `config/default.json`.

## Tool Modes

| Mode | Tools Enabled | Description |
|------|---------------|-------------|
| `readonly` | 10 | Read-only tools only (default) |
| `all` | 24 | All tools |
| `discovery` | 7 | Discovery & list operations |
| `posts` | 4 | Post write operations |
| `engagement` | 6 | Comments & votes |
| `users` | 4 | Users & companies |
| `jira` | 2 | Jira integration |
| `batch` | 1 | Batch operations |
| Comma-separated | Mixed | Custom combination (e.g., `discovery,posts`) |

## Configuration

### Environment variable

```bash
CANNY_TOOL_MODE=readonly           # Default
CANNY_TOOL_MODE=all                # All tools
CANNY_TOOL_MODE=discovery          # Only discovery
CANNY_TOOL_MODE=discovery,posts    # Discovery + Posts
```

### Config file

```json
{
  "server": {
    "toolMode": "readonly"
  }
}
```

## Toolset Breakdown

### 1. Discovery (7 tools: 6 read-only, 1 write)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `canny_list_boards` | Yes | List all boards |
| `canny_list_tags` | Yes | List tags (optionally by board) |
| `canny_list_categories` | Yes | List categories |
| `canny_list_posts` | Yes | List posts with filters |
| `canny_filter_posts` | Yes | Filter by category, company, segment, tag, date range |
| `canny_get_post` | Yes | Get full post details |
| `canny_create_category` | No | Create a board category |

### 2. Posts (4 tools: all write)

| Tool | Description |
|------|-------------|
| `canny_create_post` | Create a post (images, ETA, owner) |
| `canny_update_post` | Update title, description, ETA, images |
| `canny_update_post_status` | Change status with optional notification |
| `canny_change_category` | Move a post to a different category |

### 3. Engagement (6 tools: 2 read-only, 4 write)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `canny_list_comments` | Yes | List comments (filterable by company) |
| `canny_list_votes` | Yes | List votes |
| `canny_create_comment` | No | Add a comment (images, internal flag) |
| `canny_delete_comment` | No | Remove a comment |
| `canny_add_vote` | No | Add a vote |
| `canny_remove_vote` | No | Remove a vote |

### 4. Users (4 tools: 2 read-only, 2 write)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `canny_get_user_details` | Yes | Look up user by ID, email, or userID |
| `canny_list_companies` | Yes | List companies with MRR data |
| `canny_find_or_create_user` | No | Find or create a user |
| `canny_link_company` | No | Link a user to a company |

### 5. Jira (2 tools: all write)

| Tool | Description |
|------|-------------|
| `canny_link_jira_issue` | Link a Jira issue to a post |
| `canny_unlink_jira_issue` | Unlink a Jira issue |

### 6. Batch (1 tool: write)

| Tool | Description |
|------|-------------|
| `canny_batch_update_status` | Update multiple post statuses at once |

## Read-Only Mode

The default `readonly` mode enables 10 tools:

- All 6 read-only tools from **discovery**
- 2 read-only tools from **engagement** (`list_comments`, `list_votes`)
- 2 read-only tools from **users** (`get_user_details`, `list_companies`)

No data modification is possible in this mode.

## Common Configurations

### Demo or reporting (read-only)

```json
{ "server": { "toolMode": "readonly" } }
```

10 tools. Safe for demonstrations and reporting.

### Product manager workflow

```json
{ "server": { "toolMode": "discovery,posts,engagement" } }
```

17 tools. Discover, manage posts, and engage with users.

### Integration focus

```json
{ "server": { "toolMode": "jira,users" } }
```

6 tools. Jira linking and user management.

### Full access

```json
{ "server": { "toolMode": "all" } }
```

All 24 tools.

## Backward Compatibility

The deprecated `readOnlyMode` setting still works:

```json
{
  "server": {
    "readOnlyMode": true
  }
}
```

This maps to `toolMode: "readonly"`. Use `toolMode` instead.

## Security

- Default mode is `readonly` -- no accidental writes
- You must explicitly enable write toolsets
- The server blocks calls to unavailable tools at runtime
- Prefer specific toolsets (`discovery,engagement`) over `all`
