# PM Prompts Configuration Guide

## Overview

The Canny MCP Server supports **configurable prompts** that you can customize for your team's workflow. You can use the 5 built-in prompts as-is, override them with your own versions, or add completely custom prompts.

## Quick Start

### Using Built-in Prompts (No Configuration Needed)

The server comes with **5 built-in prompts** that work out of the box:

1. `weekly_triage` - Analyze week's feedback
2. `sprint_planning` - Prepare sprint with RICE scoring
3. `executive_summary` - Generate monthly report
4. `jira_sync_status` - Check Jira integration health
5. `customer_impact` - Analyze feature impact

**No configuration required** - just start the server and use them!

### Adding Custom Prompts

To add your own prompts, edit `config/default.json`:

```json
{
  "canny": { ...},
  "server": { ... },
  "logging": { ... },
  "prompts": [
    {
      "name": "my_custom_prompt",
      "description": "My custom PM workflow",
      "arguments": [
        {
          "name": "velocity",
          "description": "Sprint velocity",
          "required": true
        }
      ],
      "template": "Do something with velocity {velocity}"
    }
  ]
}
```

## Prompt Configuration Format

### Prompt Object

```json
{
  "name": "prompt_name",           // Required: Unique identifier
  "description": "What it does",    // Required: User-facing description
  "arguments": [ ... ],             // Optional: List of arguments
  "template": "Prompt text..."      // Required: Template with placeholders
}
```

### Argument Object

```json
{
  "name": "argumentName",          // Required: Argument identifier
  "description": "What it's for",  // Optional: User-facing description
  "required": true                  // Required: true or false
}
```

## Template Syntax

### Basic Template

```json
{
  "template": "Analyze feedback and identify top themes"
}
```

### With Arguments (Using {placeholder})

```json
{
  "template": "Based on velocity of {velocity} points:\n1. Apply RICE scoring\n2. Suggest sprint backlog"
}
```

**Placeholders:**
- Use `{argumentName}` to insert argument values
- Placeholders are replaced when the prompt is used
- Undefined arguments become empty strings

### Multi-line Templates

Use `\n` for line breaks:

```json
{
  "template": "Generate executive summary:\n1. Features shipped\n2. Top requests\n3. Churn risks"
}
```

### Optional Arguments

```json
{
  "template": "Analyze feedback{boardId}\nInclude trend analysis{includeTrends}"
}
```

When `boardId` is provided: "Analyze feedback for board XYZ"
When `boardId` is empty: "Analyze feedback"

## Complete Examples

### Example 1: Simple Prompt (No Arguments)

```json
{
  "name": "daily_standup",
  "description": "Prepare for daily standup",
  "template": "Summarize yesterday's feedback:\n1. New posts created\n2. Status changes\n3. High-priority updates\n4. Items needing attention"
}
```

**Usage in Claude:**
```
/daily_standup
```

### Example 2: Required Arguments

```json
{
  "name": "sprint_planning",
  "description": "Plan sprint backlog",
  "arguments": [
    {
      "name": "velocity",
      "description": "Sprint velocity in story points",
      "required": true
    }
  ],
  "template": "Based on velocity of {velocity} points:\n1. Find highest-priority posts\n2. Apply RICE scoring\n3. Suggest items fitting velocity\n4. Estimate story points"
}
```

**Usage in Claude:**
```
/sprint_planning velocity=21
```

### Example 3: Optional Arguments

```json
{
  "name": "weekly_triage",
  "description": "Analyze week's feedback",
  "arguments": [
    {
      "name": "boardId",
      "description": "Optional board to focus on",
      "required": false
    }
  ],
  "template": "Analyze this week's feedback{boardId}:\n1. Top themes\n2. Quick wins\n3. Duplicates to merge"
}
```

**Usage in Claude:**
```
/weekly_triage
/weekly_triage boardId=65fcb328612dc3f614f251f5
```

### Example 4: Multiple Arguments

```json
{
  "name": "competitive_analysis",
  "description": "Analyze competitor requests",
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

**Usage in Claude:**
```
/competitive_analysis competitor=Salesforce timeframe="last 90 days"
```

### Example 5: Customer-Specific Prompt

```json
{
  "name": "customer_health",
  "description": "Check customer health",
  "arguments": [
    {
      "name": "companyId",
      "description": "Company ID to analyze",
      "required": true
    }
  ],
  "template": "Customer health check for {companyId}:\n1. Recent feedback sentiment\n2. Open vs resolved requests\n3. Churn risk indicators\n4. Expansion opportunities\n5. Recommended actions"
}
```

**Usage in Claude:**
```
/customer_health companyId=acme_corp
```

## Configuration Locations

### Option 1: In config/default.json (Recommended)

```json
{
  "canny": { ... },
  "server": { ... },
  "prompts": [
    { "name": "custom1", ... },
    { "name": "custom2", ... }
  ]
}
```

**Pros:**
- Single configuration file
- Version controlled with your config
- Easy to maintain

### Option 2: Separate Prompts File

Create `config/prompts.json`:
```json
{
  "prompts": [
    { ... }
  ]
}
```

Then reference in your main config (requires custom loader).

## How Custom Prompts Work

1. **Server starts** → Loads `config/default.json`
2. **Built-in prompts loaded** (5 prompts)
3. **Custom prompts loaded** from `config.prompts`
4. **Both merged** → Total available prompts

**Result:**
- **5 built-in prompts** (always available)
- **+ Your custom prompts** (from config)
- **= Total prompts** available in Claude

### Overriding Built-in Prompts

To replace a built-in prompt with your version, use the **same name**:

```json
{
  "prompts": [
    {
      "name": "weekly_triage",  // Same name as built-in
      "description": "My custom weekly triage",
      "template": "My custom analysis..."
    }
  ]
}
```

**Note:** Currently both versions will be available. To truly override, the built-in would need to be filtered (feature request).

## Testing Your Prompts

### 1. Build the server

```bash
npm run build
```

### 2. Start the server

```bash
npm start
```

### 3. Check logs

Look for prompt count:
```
Canny MCP Server initialized { prompts: 7, builtIn: 5, custom: 2 }
```

### 4. Use in Claude Desktop

Type `/` to see your custom prompts listed

## Best Practices

### 1. Use Clear Naming

✅ **Good:** `sprint_planning`, `weekly_triage`, `customer_health`
❌ **Bad:** `prompt1`, `test`, `my_thing`

### 2. Write Descriptive Descriptions

✅ **Good:** "Generate sprint candidates using RICE scoring"
❌ **Bad:** "Sprint stuff"

### 3. Document Arguments

```json
{
  "name": "velocity",
  "description": "Sprint velocity in story points (e.g., 21)",
  "required": true
}
```

### 4. Structure Templates Clearly

```json
{
  "template": "Analyze feedback:\n\n1. **Top themes**\n   - What customers are saying\n\n2. **Quick wins**\n   - High-impact, low-effort items\n\n3. **Action items**\n   - What to prioritize"
}
```

### 5. Use Markdown Formatting

Templates support markdown for better readability:
- `**bold**` for emphasis
- `\n` for line breaks
- Numbered lists for structure

### 6. Keep Templates Focused

❌ **Too broad:**
```
"Analyze everything about feedback and customers and competitors and roadmap..."
```

✅ **Focused:**
```
"Analyze this week's feedback for top themes and quick wins"
```

## Common Use Cases

### PM Team Workflows

```json
{
  "prompts": [
    {"name": "weekly_standup", "template": "..."},
    {"name": "sprint_planning", "template": "..."},
    {"name": "retrospective", "template": "..."}
  ]
}
```

### Customer Success

```json
{
  "prompts": [
    {"name": "customer_health", "template": "..."},
    {"name": "churn_risk", "template": "..."},
    {"name": "expansion_opportunities", "template": "..."}
  ]
}
```

### Executive Reporting

```json
{
  "prompts": [
    {"name": "monthly_metrics", "template": "..."},
    {"name": "quarterly_review", "template": "..."},
    {"name": "board_presentation", "template": "..."}
  ]
}
```

## Troubleshooting

### Prompts not showing up

**Check:**
1. Is `config/default.json` valid JSON?
2. Is the `prompts` array properly formatted?
3. Did you rebuild? (`npm run build`)
4. Did you restart the server?

### Template not using arguments

**Issue:**
```json
{
  "template": "Use velocity ${velocity}"  // Wrong syntax!
}
```

**Fix:**
```json
{
  "template": "Use velocity {velocity}"   // Correct: use { }
}
```

### Arguments showing as empty

**Possible causes:**
- Argument name mismatch in template vs config
- Not providing the argument when using prompt
- Typo in argument name

**Check:**
```json
{
  "arguments": [{"name": "velocity", ...}],
  "template": "Use {velocity}"  // Names must match exactly
}
```

## Summary

**Key Points:**
- ✅ **5 built-in prompts** always available (no config needed)
- ✅ **Add custom prompts** in `config/default.json`
- ✅ **Use {placeholder} syntax** for arguments
- ✅ **Markdown supported** in templates
- ✅ **Prompts appear as `/commands`** in Claude

**Configuration:**
```json
{
  "prompts": [
    {
      "name": "my_prompt",
      "description": "What it does",
      "arguments": [
        {"name": "arg1", "required": true}
      ],
      "template": "Do something with {arg1}"
    }
  ]
}
```

**Example file:** See `config/prompts.example.json` for more examples!
