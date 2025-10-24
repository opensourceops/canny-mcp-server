# Canny MCP Server

A production-ready Model Context Protocol (MCP) server for Canny feedback management. Integrate Canny with Claude Code to manage customer feedback, prioritize features, and streamline your product development workflow using natural language.

## Features

- **25 Comprehensive Tools** - Full Canny API coverage for posts, comments, votes, users, categories, and Jira integration
- **Token-Optimized** - 70-90% reduction in response size vs raw API
- **Jira Integration** - Link posts to Jira issues seamlessly
- **PM-Focused Prompts** - Built-in workflows for weekly triage, sprint planning, and executive reporting
- **Smart Pagination** - Automatic cursor/skip handling
- **Batch Operations** - Efficient bulk updates for status changes and tagging
- **Configurable** - Flexible toolset selection and custom prompts
- **Image Support**: Add images to posts and comments
- **ETA Management**: Set and update ETAs with public/private visibility
- **Owner Assignment**: Assign post owners for accountability
- **Company Tracking**: Full company association with MRR/monthly spend
- **Multi-Lookup**: Find users by ID, email, or custom userID
- **Company Filtering**: Filter comments by company
- **Status Changes**: Required changerID for audit trails

## Prerequisites

- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- **Claude Code** (Claude desktop app)
- **Canny API Key** - Get yours at [canny.io/admin/settings/api](https://canny.io/admin/settings/api)

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/opensourceops/canny-mcp-server.git
cd canny-mcp-server
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build the Project

```bash
npm run build
```

### Step 4: Get Your Canny Credentials

1. **API Key**: Visit [canny.io/admin/settings/api](https://canny.io/admin/settings/api)
2. **Board ID**: Visit your Canny board and copy the ID from the URL
   - Example: `https://ideas.harness.io/admin/board/feature-request`
   - Board ID is in the URL path or use `canny_list_boards` after setup

### Step 5: Add to Claude Code

Run the following command from within the `canny-mcp-server` directory:

```bash
claude mcp add --transport stdio canny \
  --env CANNY_API_KEY=your_api_key_here \
  --env CANNY_DEFAULT_BOARD=your_board_id_here \
  --env CANNY_CONFIG_PATH=$(pwd)/config/default.json \
  -- $(which node) $(pwd)/dist/index.js
```

Replace `your_api_key_here` and `your_board_id_here` with your actual credentials from Step 4.

**Example:**
```bash
cd /Users/yourname/canny-mcp-server

claude mcp add --transport stdio canny \
  --env CANNY_API_KEY=your_api_key_here \
  --env CANNY_DEFAULT_BOARD=your_board_id_here \
  --env CANNY_CONFIG_PATH=$(pwd)/config/default.json \
  -- $(which node) $(pwd)/dist/index.js

# Output:
✅ MCP server 'canny' added successfully
```

### Step 6: Restart Claude Code

Completely quit and restart Claude Code for changes to take effect.

### Step 7: Verify Installation

In Claude Code, ask:
```
Can you list the available Canny tools?
```

Claude should respond with a list of 25 tools including `canny_list_posts`, `canny_create_post`, `canny_update_post`, `canny_add_vote`, etc.

## Quick Test

Try these commands in Claude Code:

```
Show me the latest feature requests from Canny
```

```
Get details for Canny post ID: <your-post-id>
```

## Available Tools

### Discovery (4 tools)
- `canny_list_boards` - List all boards
- `canny_list_categories` - List categories
- `canny_list_tags` - List available tags
- `canny_list_companies` - List companies

### Posts (7 tools)
- `canny_list_posts` - List posts with filters
- `canny_get_post` - Get detailed post info
- `canny_create_post` - Create new post with images, ETA, owner
- `canny_update_post` - Update post details, title, description, ETA, images
- `canny_update_post_status` - Change post status with notifications
- `canny_change_category` - Move post to different category
- `canny_create_category` - Create new board category

### Engagement (6 tools)
- `canny_list_comments` - List post comments with company filtering
- `canny_create_comment` - Add comment with image support
- `canny_delete_comment` - Remove comment
- `canny_list_votes` - List votes
- `canny_add_vote` - Add vote
- `canny_remove_vote` - Remove vote

### Users (3 tools)
- `canny_find_or_create_user` - Get or create user with company associations
- `canny_get_user_details` - Get user info by ID, email, or userID
- `canny_link_company` - Link user to company with MRR tracking

### Jira (2 tools)
- `canny_link_jira_issue` - Link Jira issue to post
- `canny_unlink_jira_issue` - Unlink Jira issue

### Batch Operations (3 tools)
- `canny_batch_update_status` - Update multiple post statuses
- `canny_batch_tag` - Tag multiple posts
- `canny_batch_merge` - Merge duplicate posts

## Configuration

### Tool Modes

By default, the server runs in **readonly** mode. To enable write operations:

**Edit `config/default.json`:**

```json
{
  "server": {
    "toolMode": "all"  // Enable all tools including write operations
  }
}
```

**Rebuild after changes:**
```bash
npm run build
```

**Available modes:**
- `"readonly"` - Only read operations (default, safe)
- `"all"` - All tools including write operations
- `"posts,engagement"` - Specific toolsets (comma-separated)

### Custom Prompts

Add custom PM workflows by editing `config/default.json`:

```json
{
  "prompts": [
    {
      "name": "my_workflow",
      "description": "My custom workflow",
      "template": "Analyze feedback and..."
    }
  ]
}
```

See [docs/PROMPT_CONFIGURATION.md](docs/PROMPT_CONFIGURATION.md) for details.

## Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get started quickly
- **[Prompt Configuration](docs/PROMPT_CONFIGURATION.md)** - Configure custom prompts
- **[Toolset Guide](docs/TOOLSET_GUIDE.md)** - Understand toolsets and modes
- **[Custom Prompts](docs/custom_prompts.md)** - Advanced prompt examples

## Troubleshooting

### API Key Issues

Test your API key:
```bash
curl https://canny.io/api/v1/boards/list --data apiKey=YOUR_API_KEY
```

Should return your boards list.

### Tools Not Working

1. **Rebuild after config changes:**
   ```bash
   npm run build
   ```

2. **Restart Claude Code completely** (quit and reopen)

3. **Check toolMode** in `config/default.json`

## Security

- **Never commit** `.env` files or API keys to Git
- Use **readonly mode** for general use
- Enable **write mode** only when needed
- Keep your `CANNY_API_KEY` secret

## Project Structure

```
canny-mcp/
├── src/                 # TypeScript source code
│   ├── index.ts        # Main entry point
│   ├── server.ts       # MCP server implementation
│   ├── api/            # Canny API client
│   ├── tools/          # MCP tools
│   ├── prompts/        # Built-in prompts
│   └── types/          # TypeScript definitions
├── config/
│   └── default.json    # Server configuration
├── docs/               # Documentation
├── dist/               # Compiled JavaScript (generated)
├── package.json
└── tsconfig.json
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

Apache 2.0 License - See [LICENSE](LICENSE) file for details

## Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: See `docs/` folder for detailed guides
- **API Reference**: [Canny API Documentation](https://developers.canny.io/api-reference)

---

**Built with ❤️ for Product Managers**
