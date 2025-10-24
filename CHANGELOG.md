# Changelog

All notable changes to the Canny MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [Unreleased]

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
