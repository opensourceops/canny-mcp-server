# Canny MCP Server - PM Prompts Guide

## Overview

The Canny MCP Server includes **5 pre-built prompts** designed for Product Manager workflows. These prompts are automatically available when the MCP server is connected to Claude Desktop or other MCP clients.

## What Are MCP Prompts?

MCP Prompts are pre-configured prompt templates that help you perform common PM tasks quickly. They're built into the server and appear as **slash commands** in your MCP client (like Claude Desktop).

## Available Prompts (5 Total)

### 1. Weekly Triage (`/weekly_triage`)

**Purpose:** Analyze the week's feedback for PM review

**Arguments:**
- `boardID` (optional) - Focus on specific board
- `includeTrends` (optional) - Include detailed trend analysis

**What it does:**
- Identifies top 3 themes by volume
- Highlights high-revenue customer requests
- Finds quick wins (high votes, low effort)
- Suggests duplicate posts to merge
- Detects sentiment shifts
- Lists posts needing Jira issues

**Example usage in Claude Desktop:**
```
/weekly_triage
```

Or with arguments:
```
/weekly_triage boardID=65fcb328612dc3f614f251f5 includeTrends=true
```

---

### 2. Sprint Planning (`/sprint_planning`)

**Purpose:** Prepare posts for sprint planning with RICE scoring

**Arguments:**
- `velocity` (required) - Sprint velocity in story points
- `sprintLength` (optional) - Sprint length in weeks (default: 2)

**What it does:**
- Finds unlinked posts in "under review"
- Applies RICE scoring framework
- Groups features by product area
- Recommends sprint backlog fitting your velocity
- Suggests Jira issue titles
- Estimates story points

**Example usage in Claude Desktop:**
```
/sprint_planning velocity=21
```

With sprint length:
```
/sprint_planning velocity=21 sprintLength=1
```

---

### 3. Executive Summary (`/executive_summary`)

**Purpose:** Generate monthly executive report

**Arguments:**
- `month` (optional) - Month to report on (default: current month)

**What it does:**
- Summarizes features shipped
- Lists top 10 requests by ARR impact
- Identifies churn risk features
- Highlights competitive gaps
- Previews 90-day roadmap
- Shows Jira velocity metrics

**Example usage in Claude Desktop:**
```
/executive_summary
```

For specific month:
```
/executive_summary month="September 2025"
```

---

### 4. Jira Sync Status (`/jira_sync_status`)

**Purpose:** Review Jira-Canny synchronization health

**Arguments:** None

**What it does:**
- Counts posts with Jira links by status
- Identifies orphaned Jira issues
- Detects status mismatches needing sync
- Finds high-priority posts without Jira issues
- Lists sprint items not marked "in progress"

**Example usage in Claude Desktop:**
```
/jira_sync_status
```

---

### 5. Customer Impact (`/customer_impact`)

**Purpose:** Analyze feature impact on customers and revenue

**Arguments:**
- `featureID` (required) - Post/feature ID to analyze

**What it does:**
- Calculates total customers affected
- Estimates revenue at risk
- Breaks down by enterprise vs SMB segments
- Identifies related/dependent features
- Assesses implementation timeline urgency

**Example usage in Claude Desktop:**
```
/customer_impact featureID=68fac703a1c52202e2a1d917
```

---

## How to Use Prompts

### In Claude Desktop

1. **Start a conversation** with Claude
2. **Type `/` (slash)** to see available prompts
3. **Select a prompt** from the dropdown
4. **Provide arguments** if required
5. **Claude executes** the prompt and uses the Canny tools to gather data

### Prompt Workflow

When you use a prompt, here's what happens:

1. **Prompt template is loaded** with your arguments
2. **Claude receives** the full prompt instructions
3. **Claude uses Canny tools** to gather necessary data:
   - `canny_list_posts` - to find relevant posts
   - `canny_get_post` - to get post details
   - `canny_list_votes` - to analyze demand
   - `canny_list_companies` - to assess ARR impact
   - etc.
4. **Claude analyzes** the data according to prompt instructions
5. **Claude presents** formatted results

### Example Conversation

**You:**
```
/sprint_planning velocity=21
```

**Claude's workflow:**
```
I'll help you prepare for sprint planning with velocity 21.

[Uses canny_list_posts to find "under review" posts]
[Uses canny_list_votes to count demand]
[Uses canny_list_companies to assess revenue impact]
[Applies RICE scoring framework]

Here's your sprint planning analysis:

1. Unlinked posts in "under review": 12 posts found

2. RICE Scoring (top candidates):
   - "Add SSO support" - Score: 85 (R:500, I:3, C:80%, E:13)
   - "Export to CSV" - Score: 72 (R:300, I:2, C:90%, E:8)
   ...

3. Recommended sprint backlog (21 points):
   - Add SSO support (13 points)
   - Export to CSV (8 points)

4. Suggested Jira issues:
   - [FEAT-123] Add SSO authentication with SAML support
   - [FEAT-124] Implement CSV export for all data tables
...
```

---

## Configuration

### Prompts Don't Need Configuration

Unlike tools and toolsets, **prompts are always available** and don't require any configuration. They're automatically registered when the server starts.

### Customizing Prompts

If you want to customize the prompt templates:

1. Edit `/src/prompts/index.ts`
2. Modify the `template` function for any prompt
3. Rebuild: `npm run build`
4. Restart the MCP server

**Example customization:**
```typescript
export const weeklyTriage: MCPPrompt = {
  name: 'weekly_triage',
  description: "Analyze week's feedback for PM review",
  arguments: [...],
  template: (args) => `
    // Add your custom instructions here
    Focus on enterprise customers only
    Include competitor mentions
    ${args.boardID ? `Focus on board: ${args.boardID}` : ''}
  `,
};
```

### Adding New Prompts

To add your own PM prompts:

1. **Edit** `src/prompts/index.ts`
2. **Create** a new prompt:
```typescript
export const myCustomPrompt: MCPPrompt = {
  name: 'my_custom_prompt',
  description: 'My custom PM workflow',
  arguments: [
    {
      name: 'myArg',
      description: 'Description of argument',
      required: true,
    },
  ],
  template: (args) => `
    Your prompt instructions here...
    Use argument: ${args.myArg}
  `,
};
```
3. **Add to exports**:
```typescript
export const ALL_PROMPTS: MCPPrompt[] = [
  weeklyTriage,
  sprintPlanning,
  executiveSummary,
  jiraSyncStatus,
  customerImpact,
  myCustomPrompt, // Add here
];
```
4. **Rebuild** and restart server

---

## Prompt Best Practices

### 1. Use Prompts for Recurring Tasks

✅ **Good use:** Weekly feedback review
❌ **Poor use:** One-off data queries

### 2. Combine Prompts with Toolsets

Enable only the toolsets you need for your prompts:

```json
{
  "server": {
    // Weekly triage only needs read access
    "toolMode": "readonly"
  }
}
```

For sprint planning (needs write access):
```json
{
  "server": {
    // Enable discovery + posts for sprint planning
    "toolMode": "discovery,posts,jira"
  }
}
```

### 3. Provide Context in Arguments

Instead of:
```
/sprint_planning velocity=21
```

Consider adding context:
```
/sprint_planning velocity=21 sprintLength=1
```

### 4. Chain Prompts

Use multiple prompts in sequence:

1. `/weekly_triage` - Identify priorities
2. `/sprint_planning velocity=21` - Plan sprint
3. `/jira_sync_status` - Verify tracking

---

## Troubleshooting

### Prompts not showing up

**Issue:** Can't see prompts in Claude Desktop

**Solution:**
1. Verify server is running: `npm start`
2. Check Claude Desktop configuration includes the MCP server
3. Restart Claude Desktop
4. Check server logs: should show `prompts: 5`

### Prompt execution fails

**Issue:** Claude says it can't access tools

**Solution:**
1. Check `toolMode` configuration allows required tools
2. For read-only prompts: `toolMode: "readonly"` is sufficient
3. For write prompts: May need `toolMode: "all"` or specific toolsets

### Arguments not working

**Issue:** Prompt doesn't use provided arguments

**Solution:**
- Verify argument name spelling matches exactly
- Check if argument is marked as `required: true`
- Provide arguments in format: `name=value`

---

## PM Workflow Examples

### Monday Morning Routine

```
1. /weekly_triage
   → Review last week's feedback

2. /jira_sync_status
   → Check engineering alignment

3. /sprint_planning velocity=21
   → Plan current sprint
```

### Monthly Executive Report

```
1. /executive_summary month="September"
   → Generate metrics

2. Review top 10 requests
   → For each high-priority item:
   /customer_impact featureID=<post_id>
```

### Feature Prioritization

```
1. /weekly_triage includeTrends=true
   → Identify themes

2. For each theme:
   /customer_impact featureID=<post_id>
   → Assess business impact

3. /sprint_planning velocity=21
   → Allocate to sprint
```

---

## Prompt Template Syntax

Prompts use template strings with argument interpolation:

```typescript
template: (args) => `
  Fixed text here

  ${args.myArg}  // Insert argument value

  ${args.optional || 'default'}  // With default

  ${args.flag ? 'Show this' : ''}  // Conditional
`
```

**Available in templates:**
- `args.argumentName` - Access argument values
- Conditional logic with `${}`
- Multi-line strings
- Markdown formatting

---

## Summary

**5 Built-in PM Prompts:**

| Prompt | Purpose | Arguments | Frequency |
|--------|---------|-----------|-----------|
| `weekly_triage` | Review week's feedback | boardID, includeTrends | Weekly |
| `sprint_planning` | Plan sprint with RICE | velocity*, sprintLength | Bi-weekly |
| `executive_summary` | Monthly report | month | Monthly |
| `jira_sync_status` | Check Jira alignment | None | Weekly |
| `customer_impact` | Analyze feature impact | featureID* | As needed |

*Required arguments

**Key Points:**
- ✅ Prompts are always available (no configuration needed)
- ✅ Accessed via slash commands in Claude Desktop
- ✅ Prompts automatically use Canny tools to gather data
- ✅ Customizable by editing `src/prompts/index.ts`
- ✅ Can create your own prompts easily

**Next Steps:**
1. Connect to Claude Desktop
2. Try `/weekly_triage` for your first PM workflow
3. Customize prompts for your team's processes
