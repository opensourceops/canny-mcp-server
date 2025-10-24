# Canny MCP Server - Toolset Selection Guide

## Overview

The Canny MCP Server provides flexible toolset selection, allowing you to enable exactly the tools you need for your workflow. This guide explains how to configure and use toolsets.

## Quick Answers

### Q: How many toolsets are there?

**6 toolsets:**

1. **discovery** (5 tools) - Discovery & list operations
2. **posts** (5 tools) - Post management
3. **engagement** (6 tools) - Comments & votes
4. **users** (4 tools) - Users & companies
5. **jira** (2 tools) - Jira integration
6. **batch** (3 tools) - Batch operations

**Total: 25 tools** (9 read-only + 16 write)

### Q: By default, are read-only tools enabled?

**Yes!** The default `toolMode` is `"readonly"`, which enables only the 9 read-only tools for maximum safety.

### Q: Can I enable all toolsets with keyword "all"?

**Yes!** Set `toolMode: "all"` to enable all 25 tools.

### Q: Is the base URL hard-coded?

**No!** The base URL is fully configurable:
- Environment variable: `CANNY_BASE_URL`
- Default value: `https://canny.io/api/v1`
- Supports custom endpoints for proxies or mock servers

## Toolset Configuration

### Configuration Options

```json
{
  "server": {
    "toolMode": "readonly"  // Default
  }
}
```

### Available Modes

| Mode | Tools | Description |
|------|-------|-------------|
| `"readonly"` | 9 | **Default** - Only read-only tools (safest) |
| `"all"` | 25 | All tools (read + write operations) |
| `"discovery"` | 5 | Discovery & list operations only |
| `"posts"` | 5 | Post management operations only |
| `"engagement"` | 6 | Comments & votes operations only |
| `"users"` | 4 | User & company operations only |
| `"jira"` | 2 | Jira integration operations only |
| `"batch"` | 3 | Batch operations only |
| Comma-separated | Mixed | Custom combination of toolsets |

### Environment Variable

```bash
# In .env file
TOOL_MODE=readonly           # Default
TOOL_MODE=all                # All tools
TOOL_MODE=discovery          # Only discovery
TOOL_MODE=discovery,posts    # Discovery + Posts
```

## Toolset Breakdown

### 1. Discovery Toolset (5 tools - all read-only)

```bash
toolMode: "discovery"
```

**Tools:**
- `canny_list_boards` - Get all available boards
- `canny_list_posts` - Search and filter posts
- `canny_get_post` - Get single post details
- `canny_list_tags` - Get available tags
- `canny_list_categories` - Get board categories

**Use case:** Exploring and searching Canny data without modification

### 2. Posts Toolset (5 tools - all write)

```bash
toolMode: "posts"
```

**Tools:**
- `canny_create_post` - Create new feedback post with images, ETA, owner
- `canny_update_post` - Update post details, title, description, ETA, images
- `canny_update_post_status` - Change post status with changerID audit
- `canny_change_category` - Move post to different category
- `canny_create_category` - Create new board category with admin subscriptions

**Use case:** Managing post lifecycle, organization, and board structure

### 3. Engagement Toolset (6 tools - 2 read, 4 write)

```bash
toolMode: "engagement"
```

**Read-only tools:**
- `canny_list_comments` - List post comments with company filtering
- `canny_list_votes` - List post votes

**Write tools:**
- `canny_create_comment` - Add comment to post with image support
- `canny_delete_comment` - Remove comment
- `canny_add_vote` - Vote on behalf of user
- `canny_remove_vote` - Remove vote

**Use case:** Managing user engagement with feedback and company insights

### 4. Users Toolset (4 tools - 2 read, 2 write)

```bash
toolMode: "users"
```

**Read-only tools:**
- `canny_get_user_details` - Get user information by ID, email, or userID
- `canny_list_companies` - List companies

**Write tools:**
- `canny_find_or_create_user` - Get or create user with company associations
- `canny_link_company` - Link user to company with MRR tracking

**Use case:** Managing users, company associations, and revenue tracking

### 5. Jira Toolset (2 tools - all write)

```bash
toolMode: "jira"
```

**Tools:**
- `canny_link_jira_issue` - Link Jira issue to Canny post
- `canny_unlink_jira_issue` - Remove Jira link

**Use case:** Integrating Canny feedback with Jira development workflow

### 6. Batch Toolset (3 tools - all write)

```bash
toolMode: "batch"
```

**Tools:**
- `canny_batch_update_status` - Bulk status updates
- `canny_batch_tag` - Bulk tagging operations
- `canny_batch_merge` - Merge duplicate posts

**Use case:** Efficient bulk operations on multiple posts

## Common Configurations

### 1. Read-Only Access (Default)

**Safest option** - No data modification possible

```json
{
  "server": {
    "toolMode": "readonly"
  }
}
```

**Tools:** 9 read-only tools from discovery, engagement, and users toolsets

### 2. Full Access

**Complete control** - All operations enabled

```json
{
  "server": {
    "toolMode": "all"
  }
}
```

**Tools:** All 25 tools

### 3. Product Manager Workflow

**Discovery + Post Management + Engagement**

```json
{
  "server": {
    "toolMode": "discovery,posts,engagement"
  }
}
```

**Tools:** 16 tools (5 discovery + 5 posts + 6 engagement)

### 4. Integration Focus

**Jira Integration + User Management**

```json
{
  "server": {
    "toolMode": "jira,users"
  }
}
```

**Tools:** 6 tools (2 Jira + 4 users)

### 5. Bulk Operations

**Batch + Discovery (for finding posts to bulk update)**

```json
{
  "server": {
    "toolMode": "discovery,batch"
  }
}
```

**Tools:** 8 tools (5 discovery + 3 batch)

## Security & Safety

### Default Safety

- **Default mode:** `"readonly"` ensures no accidental data modification
- **Explicit opt-in:** Must explicitly set `"all"` or specific write toolsets to enable modifications
- **Granular control:** Enable only the toolsets you need

### Runtime Protection

The server enforces toolMode at runtime:
- Attempts to call unavailable tools return clear errors
- Logs all blocked operations for audit
- No way to bypass toolMode restrictions without config change

### Best Practices

1. **Start with readonly:** Use `"readonly"` for exploration and reporting
2. **Minimize write access:** Only enable write toolsets when needed
3. **Use specific toolsets:** Prefer `"discovery,engagement"` over `"all"`
4. **Document your config:** Comment why specific toolsets are enabled
5. **Review regularly:** Audit which toolsets are enabled and why

## Testing

Verify your toolMode configuration:

```bash
# Run the toolset selection test
npx tsx test-toolset-selection.ts

# Expected: 100% pass rate with all 12 tests passing
```

## Backward Compatibility

The old `readOnlyMode` setting is still supported:

```json
// Old way (deprecated but still works)
{
  "server": {
    "readOnlyMode": true  // Maps to toolMode: "readonly"
  }
}

// New way (recommended)
{
  "server": {
    "toolMode": "readonly"
  }
}
```

## Examples in Practice

### Example 1: Demo Environment

```json
{
  "server": {
    "toolMode": "readonly"
  }
}
```

Safe for demonstrations - users can explore data but cannot modify anything.

### Example 2: PM Daily Workflow

```json
{
  "server": {
    "toolMode": "discovery,posts,engagement,users"
  }
}
```

Full PM workflow - discover, manage posts, engage with users, no batch operations.

### Example 3: Admin Maintenance

```json
{
  "server": {
    "toolMode": "all"
  }
}
```

Complete access for administrative tasks and data cleanup.

### Example 4: Read-Only Reporting

```json
{
  "server": {
    "toolMode": "discovery,engagement,users"
  }
}
```

All read operations available, no write operations possible.

## Troubleshooting

### Tool not available error

```
Error: Tool "canny_create_post" is not available.
Current toolMode: "readonly".
Tool belongs to toolset: "posts".
```

**Solution:** Add the required toolset to toolMode:
```json
{"toolMode": "readonly,posts"}  // or just "all"
```

### How to check current configuration

The server logs the toolMode on startup:
```
Available tools: 9 (toolMode: readonly)
```

## Summary

- **6 toolsets** organize 25 tools by functionality
- **Default is readonly** for maximum safety
- **Flexible configuration** via comma-separated toolsets
- **Keyword "all"** enables everything
- **Base URL is configurable** via environment variable

Use toolsets to enable exactly the capabilities you need, nothing more.
