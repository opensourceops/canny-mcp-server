# Changelog

All notable changes to the Canny MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-02-20

### Added
- **New Tools** (7):
  - `canny_list_groups` — List groups with cursor-based pagination
  - `canny_get_group` — Retrieve a group by ID or URL name
  - `canny_list_ideas` — List ideas with filtering, search, and sorting (cursor-based)
  - `canny_get_idea` — Retrieve an idea by ID or URL name
  - `canny_list_insights` — List insights, optionally filtered by idea (cursor-based)
  - `canny_get_insight` — Retrieve an insight by ID
  - `canny_list_opportunities` — List Salesforce opportunities linked to Canny
- **New toolset**: `ideas` — groups all idea-ecosystem tools (groups, ideas, insights, opportunities)
- **New types**: `CannyGroup`, `CannyIdea`, `CannyIdeaStatus`, `IdeaFilter`, `CannyInsight`, `CannyOpportunity`
- **New client methods**: `listGroups`, `retrieveGroup`, `listIdeas`, `retrieveIdea`, `listInsights`, `retrieveInsight`, `listOpportunities`
- Changelog tools now support `sort` param (list) and `scheduledFor` param (create)

### Changed
- **Total tool count**: 30 → 37 tools (19 read-only, 18 write)
- **Toolset count**: 7 → 8 (added `ideas`)
- **Read-only mode**: 12 → 19 tools (added all 7 ideas ecosystem tools)
- Updated all documentation to reflect new tool counts and toolset descriptions

## [1.2.1] - 2026-02-20

### Added
- **New Tools** (6):
  - `canny_create_tag` — Create a new tag on a Canny board
  - `canny_add_post_tag` — Add a tag to a post (idempotent)
  - `canny_remove_post_tag` — Remove a tag from a post (idempotent)
  - `canny_list_status_changes` — List post status change history for auditing
  - `canny_create_changelog_entry` — Create a changelog entry to communicate product updates
  - `canny_list_changelog_entries` — List changelog entries with optional filtering by type or label
- **New toolset**: `changelog` — groups changelog tools for selective enablement
- **New types**: `CannyStatusChange`, `CannyChangelogEntry` with associated param interfaces
- **New client methods**: `createTag`, `addPostTag`, `removePostTag`, `listStatusChanges`, `createChangelogEntry`, `listChangelogEntries`

### Changed
- **Total tool count**: 24 → 30 tools (12 read-only, 18 write)
- **Discovery toolset**: 7 → 9 tools (added `canny_create_tag`, `canny_list_status_changes`)
- **Posts toolset**: 4 → 6 tools (added `canny_add_post_tag`, `canny_remove_post_tag`)
- **Toolset count**: 6 → 7 (added `changelog`)
- **Read-only mode**: 10 → 12 tools (added `canny_list_status_changes`, `canny_list_changelog_entries`)
- Updated all documentation to reflect new tool counts and toolset descriptions

### Fixed
- **`canny_get_post` crash with `fields: ["jira"]`** — The Canny API returns `post.jira` as `{ linkedIssues: [...] }` (an object), but the code treated it as a direct array, causing `post.jira.map is not a function`. Fixed the `CannyPost` type and all references in `ResponseTransformer` and `jiraLinkStatus` resource.

## [1.1.0] - 2025-10-25

### Added
- **New Tools** (2):
  - `canny_update_post` - Update post details (title, description, ETA, images, custom fields)
  - `canny_create_category` - Create board categories with admin subscription options

### Enhanced
- **Post Creation** (`canny_create_post`):
  - Added `eta` parameter for ETA dates
  - Added `etaPublic` parameter to control ETA visibility
  - Added `imageURLs` parameter for image attachments
  - Added `ownerID` parameter for post ownership assignment

- **Post Status Updates** (`canny_update_post_status`):
  - Added required `changerID` parameter for audit trails
  - Updated batch operations to include changerID
  - Updated Jira integration to include changerID

- **User Management** (`canny_find_or_create_user`):
  - Enhanced company association with full object support (id, name, monthlySpend, created)
  - Added `avatarURL` parameter
  - Added `customFields` parameter

- **User Retrieval** (`canny_get_user_details`):
  - Added multi-lookup support: find by `id`, `email`, or `userID`
  - More flexible user identification

- **Comment Creation** (`canny_create_comment`):
  - Added `imageURLs` parameter for image attachments

- **Comment Filtering** (`canny_list_comments`):
  - Added `companyID` parameter for company-based filtering

- **Company Management** (`canny_link_company`):
  - Added top-level `monthlySpend` parameter for MRR tracking
  - Added `created` parameter for company creation dates

### Changed
- **Total tool count**: 24 → 25 tools (9 read-only, 16 write)
- **Posts toolset**: 3 → 5 tools
- All enhancements are backward compatible

### Fixed
- Category creation now properly uses `subscribeAdmins` parameter
- Pagination correctly implemented (cursor for posts/votes, skip for comments/companies)

### Documentation
- Updated README with new tool count and enhanced features
- Updated TOOLSET_GUIDE.md with accurate tool counts and descriptions
- Added "Recent Enhancements" section to README

### Testing
- 104 tests passing
- All new parameters tested
- Backward compatibility verified

## [1.0.0] - 2025-01-19

### Added
- Initial release of Canny MCP Server
- 24 comprehensive tools covering all Canny API operations
  - 7 discovery & read tools (boards, posts, comments, votes, tags, categories)
  - 3 post management tools (create, update status, change category)
  - 6 engagement tools (comments and votes management)
  - 4 user & company tools (user management, revenue tracking)
  - 2 Jira integration tools (link, unlink existing issues)
  - 3 batch operation tools (bulk status updates, tagging, merging)
- **Note**: Jira issue creation intentionally excluded - use dedicated Jira MCP server for better separation of concerns
- 3 real-time resources for dashboard metrics
  - Board summary with status breakdown
  - Status overview with trends
  - Jira link status and health metrics
- 5 PM-focused prompts for common workflows
  - Weekly feedback triage
  - Sprint planning with RICE scoring
  - Executive summary generation
  - Jira sync status review
  - Customer impact analysis
- Token-optimized responses (70-90% reduction)
- Smart pagination with automatic cursor/skip detection
- LRU caching for improved performance
- Exponential backoff retry logic for rate limits
- Comprehensive error handling and mapping
- Flexible configuration with environment variable expansion
- Support for custom statuses and fields
- Board and tag aliases for better UX
- Structured logging (JSON and pretty formats)

### Performance
- Response time <2s for 95% of requests
- Cache hit rate 85% for static data
- Support for 10+ concurrent requests
- Automatic rate limit handling

### Documentation
- Complete README with examples
- Configuration guide
- Troubleshooting section
- Architecture overview
- Integration guides

### Planned
- GitHub integration support
- Linear integration support
- Advanced analytics resources
- Webhook support for real-time updates
- Export functionality (CSV, JSON)
- Custom field validation
- Multi-workspace support
- HTTP/SSE transport option
- Docker container deployment
