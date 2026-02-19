# Prompt Configuration Guide

## Overview

The Canny MCP Server supports configurable prompts -- reusable templates that appear as `/commands` in Claude Code and other MCP clients. The server ships with 5 built-in prompts and lets you add your own.

## Built-in Prompts

These 5 prompts work without configuration:

| Prompt | Arguments | Purpose |
|--------|-----------|---------|
| `weekly_triage` | `boardID` (opt), `includeTrends` (opt) | Weekly feedback review |
| `sprint_planning` | `velocity` (req), `sprintLength` (opt) | Sprint backlog with RICE scoring |
| `executive_summary` | `month` (opt) | Monthly executive report |
| `jira_sync_status` | none | Jira-Canny sync health |
| `customer_impact` | `featureID` (req) | Feature impact analysis |

Usage in Claude Code:

```
/weekly_triage
/sprint_planning velocity=21
/executive_summary month="January 2026"
/customer_impact featureID=68fac703a1c52202e2a1d917
```

## Adding Custom Prompts

Edit `config/default.json`:

```json
{
  "canny": { "..." : "..." },
  "server": { "..." : "..." },
  "logging": { "..." : "..." },
  "prompts": [
    {
      "name": "daily_standup",
      "description": "Prepare daily standup",
      "template": "Summarize yesterday's feedback:\n1. New posts\n2. Status changes\n3. Urgent items"
    }
  ]
}
```

Rebuild and restart:

```bash
npm run build
```

Then use in Claude Code:

```
/daily_standup
```

## Prompt Format

```json
{
  "name": "prompt_name",
  "description": "What this prompt does",
  "arguments": [
    {
      "name": "arg1",
      "description": "Description with example (e.g., 21)",
      "required": true
    }
  ],
  "template": "Prompt text with {arg1}"
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (lowercase, underscores) |
| `description` | Yes | User-facing description |
| `arguments` | No | List of argument definitions |
| `template` | Yes | Prompt text with `{placeholder}` syntax |

### Template syntax

- `{argumentName}` inserts the argument value
- `\n` creates a line break
- Markdown formatting is supported (`**bold**`, numbered lists, etc.)
- Undefined optional arguments become empty strings

## Examples

### No arguments

```json
{
  "name": "daily_standup",
  "description": "Prepare daily standup",
  "template": "Summarize yesterday's feedback:\n1. New posts\n2. Status changes\n3. High-priority updates"
}
```

### Required argument

```json
{
  "name": "sprint_planning",
  "description": "Plan sprint backlog",
  "arguments": [
    {
      "name": "velocity",
      "description": "Sprint velocity in story points (e.g., 21)",
      "required": true
    }
  ],
  "template": "Based on velocity of {velocity} points:\n1. Find highest-priority posts\n2. Apply RICE scoring\n3. Suggest items fitting velocity"
}
```

Usage: `/sprint_planning velocity=21`

### Multiple arguments

```json
{
  "name": "competitive_analysis",
  "description": "Analyze competitor mentions in feedback",
  "arguments": [
    {
      "name": "competitor",
      "description": "Competitor name",
      "required": true
    },
    {
      "name": "timeframe",
      "description": "Time period (default: 30 days)",
      "required": false
    }
  ],
  "template": "Analyze requests mentioning {competitor} in {timeframe}:\n1. Most mentioned features\n2. Gaps in our product\n3. ARR impact\n4. Prioritization recommendation"
}
```

Usage: `/competitive_analysis competitor=Salesforce timeframe="last 90 days"`

## How Prompts Load

1. Server starts and loads `config/default.json`
2. 5 built-in prompts load from `src/prompts/index.ts`
3. Custom prompts load from `config.prompts`
4. Both sets merge into the available prompts list

Check the server log for prompt counts:

```
Canny MCP Server initialized { prompts: 7, builtIn: 5, custom: 2 }
```

## Best Practices

**Naming** -- Use descriptive lowercase names with underscores: `weekly_triage`, `churn_risk_analysis`. Avoid `prompt1` or `test`.

**Descriptions** -- Explain the workflow in a short sentence: "Identify customers at risk of churning based on feedback signals."

**Arguments** -- Include examples in descriptions: `"Sprint velocity in story points (e.g., 21)"`. Mark only truly required arguments as required.

**Templates** -- Structure with numbered sections. Be specific: "Analyze feedback from the last 7 days and identify the top 3 themes by vote count" beats "Analyze feedback."

## Troubleshooting

### Prompts not appearing

1. Validate JSON: `cat config/default.json | python3 -m json.tool`
2. Rebuild: `npm run build`
3. Restart your MCP client
4. Check server logs for the prompt count

### Placeholders not replaced

Wrong: `"Use ${velocity} points"`
Correct: `"Use {velocity} points"`

Use `{name}` syntax, not `${name}`.

### Arguments empty

- Check that the argument `name` in the config matches the `{placeholder}` in the template exactly
- Ensure you provide the argument when invoking the prompt
