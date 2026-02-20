# Toolset Guide

## Overview

The Canny MCP Server organizes its 37 tools into 8 toolsets. You enable toolsets through the `CANNY_TOOL_MODE` environment variable or `config/default.json`.

## Tool Modes

| Mode | Tools Enabled | Description |
|------|---------------|-------------|
| `readonly` | 19 | Read-only tools only (default) |
| `all` | 37 | All tools |
| `discovery` | 9 | Discovery & list operations |
| `posts` | 6 | Post write operations |
| `engagement` | 6 | Comments & votes |
| `users` | 4 | Users & companies |
| `jira` | 2 | Jira integration |
| `changelog` | 2 | Changelog entries |
| `ideas` | 7 | Ideas, groups, insights, opportunities |
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

### 1. Discovery (9 tools: 8 read-only, 1 write)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `canny_list_boards` | Yes | List all boards |
| `canny_list_tags` | Yes | List tags (optionally by board) |
| `canny_create_tag` | No | Create a new tag on a board |
| `canny_list_categories` | Yes | List categories |
| `canny_list_posts` | Yes | List posts with filters |
| `canny_filter_posts` | Yes | Filter by category, company, segment, tag, date range |
| `canny_get_post` | Yes | Get full post details |
| `canny_list_status_changes` | Yes | List post status change history |
| `canny_create_category` | No | Create a board category |

### 2. Posts (6 tools: all write)

| Tool | Description |
|------|-------------|
| `canny_create_post` | Create a post (images, ETA, owner) |
| `canny_update_post` | Update title, description, ETA, images |
| `canny_update_post_status` | Change status with optional notification |
| `canny_change_category` | Move a post to a different category |
| `canny_add_post_tag` | Add a tag to a post |
| `canny_remove_post_tag` | Remove a tag from a post |

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

### 6. Changelog (2 tools: 1 read-only, 1 write)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `canny_list_changelog_entries` | Yes | List changelog entries |
| `canny_create_changelog_entry` | No | Create a changelog entry |

### 7. Ideas Ecosystem (7 tools: all read-only)

| Tool | Read-Only | Description |
|------|-----------|-------------|
| `canny_list_groups` | Yes | List groups (cursor-based pagination) |
| `canny_get_group` | Yes | Get group by ID or URL name |
| `canny_list_ideas` | Yes | List ideas with filters, search, sorting |
| `canny_get_idea` | Yes | Get idea by ID or URL name |
| `canny_list_insights` | Yes | List insights, filterable by idea |
| `canny_get_insight` | Yes | Get insight by ID |
| `canny_list_opportunities` | Yes | List Salesforce opportunities |

### 8. Batch (1 tool: write)

| Tool | Description |
|------|-------------|
| `canny_batch_update_status` | Update multiple post statuses at once |

## Read-Only Mode

The default `readonly` mode enables 19 tools:

- All 8 read-only tools from **discovery** (`list_boards`, `list_tags`, `list_categories`, `list_posts`, `filter_posts`, `get_post`, `list_status_changes`)
- 2 read-only tools from **engagement** (`list_comments`, `list_votes`)
- 2 read-only tools from **users** (`get_user_details`, `list_companies`)
- 1 read-only tool from **changelog** (`list_changelog_entries`)
- All 7 read-only tools from **ideas** (`list_groups`, `get_group`, `list_ideas`, `get_idea`, `list_insights`, `get_insight`, `list_opportunities`)

No data modification is possible in this mode.

## Common Configurations

### Demo or reporting (read-only)

```json
{ "server": { "toolMode": "readonly" } }
```

19 tools. Safe for demonstrations and reporting.

### Product manager workflow

```json
{ "server": { "toolMode": "discovery,posts,engagement,changelog,ideas" } }
```

30 tools. Discover, manage posts, engage with users, publish changelog entries, and explore ideas.

### Integration focus

```json
{ "server": { "toolMode": "jira,users" } }
```

6 tools. Jira linking and user management.

### Full access

```json
{ "server": { "toolMode": "all" } }
```

All 37 tools.

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
