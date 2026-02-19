# Custom Prompts

Advanced examples and patterns for creating custom PM prompts. For basics, see [Prompt Configuration](PROMPT_CONFIGURATION.md).

## Architecture

```
config/default.json
  └── "prompts": [{ name, description, arguments, template }]
          ↓
Canny MCP Server
  ├── Built-in prompts (5): weekly_triage, sprint_planning,
  │    executive_summary, jira_sync_status, customer_impact
  └── Custom prompts (from config)
          ↓
MCP Protocol
  ├── prompts/list  → returns all prompts
  └── prompts/get   → returns rendered template
          ↓
Claude Code
  └── /your_prompt arg=value
```

## Template Reference

### Placeholders

Use `{argumentName}` to insert argument values. Optional arguments become empty strings when omitted.

```json
{
  "arguments": [
    { "name": "company", "required": true },
    { "name": "timeframe", "required": false }
  ],
  "template": "Analyze {company} feedback{timeframe}"
}
```

- `/analyze company=Acme` produces: "Analyze Acme feedback"
- `/analyze company=Acme timeframe=" from last 30 days"` produces: "Analyze Acme feedback from last 30 days"

### Formatting

Templates support markdown and `\n` for line breaks:

```json
{
  "template": "# Analysis\n\n## 1. Themes\n- Top requests\n- **Pain points**\n\n## 2. Actions\n- Prioritized list"
}
```

## Advanced Examples

### Churn Risk Analysis

```json
{
  "name": "churn_risk_analysis",
  "description": "Identify customers at risk of churning",
  "arguments": [
    {
      "name": "threshold",
      "description": "Minimum ARR to consider (default: $10k)",
      "required": false
    },
    {
      "name": "timeframe",
      "description": "Period to analyze (default: 90 days)",
      "required": false
    }
  ],
  "template": "# Churn Risk Analysis\n\nIdentify customers at risk of churning{threshold}{timeframe}.\n\n## Signals\n\n1. **Feedback signals**\n   - Critical bugs reported\n   - Negative sentiment in comments\n   - Feature requests marked 'blocker'\n   - Lack of engagement\n\n2. **Product issues**\n   - Open bugs affecting customer\n   - Unaddressed feature requests\n   - Competitive gaps mentioned\n\n## Risk Scoring\n\nFor each at-risk customer:\n- Company name and ARR\n- Risk score (1-10)\n- Key risk factors\n- Recommended actions\n\n## Prioritization\n\nRank by ARR impact (high to low), then risk score.\n\n**High Risk** (8-10): Schedule executive call\n**Medium Risk** (5-7): Send roadmap update\n**Monitoring** (3-4): Track in next review"
}
```

### Competitive Intelligence

```json
{
  "name": "competitive_intel",
  "description": "Analyze competitor mentions in feedback",
  "arguments": [
    {
      "name": "competitor",
      "description": "Competitor name (e.g., 'Salesforce')",
      "required": true
    },
    {
      "name": "timeframe",
      "description": "Time period (default: last 90 days)",
      "required": false
    }
  ],
  "template": "# Competitive Intelligence: {competitor}\n\nAnalyze all feedback mentioning {competitor}{timeframe}.\n\n## 1. Feature Comparison\n- Search posts mentioning {competitor}\n- Extract compared features\n- Group by product area\n\n## 2. Gap Analysis\n- Where {competitor} leads\n- Where we lead\n- Counter-positioning opportunities\n\n## 3. Business Impact\n- Deals at risk\n- Features blocking deals\n- Revenue at stake\n\n## 4. Recommendations\n- Feature gaps to close (with ROI)\n- Messaging updates\n- Customer outreach needed"
}
```

### Feature Launch Readiness

```json
{
  "name": "launch_readiness",
  "description": "Assess readiness to launch a feature",
  "arguments": [
    {
      "name": "featureId",
      "description": "Canny post ID for the feature",
      "required": true
    },
    {
      "name": "targetDate",
      "description": "Planned launch date",
      "required": false
    }
  ],
  "template": "# Feature Launch Readiness: {featureId}\n\n{targetDate}\n\n## 1. Customer Demand\n- Total votes and requesting companies\n- ARR represented\n- Use cases from comments\n\n## 2. Validation\n- Beta feedback\n- Issues discovered\n- Adoption rate\n\n## 3. Communication Plan\n- Voters to notify\n- Requesting companies to contact\n- Value proposition\n\n## 4. Success Metrics\n- Adoption target: >60% of requesters\n- Time to first use: <7 days\n- Deals unblocked\n\n## 5. Go/No-Go\n- [ ] Customer validation positive\n- [ ] Beta feedback incorporated\n- [ ] Documentation complete\n- [ ] Support team trained\n\n**Recommendation:** GO / HOLD / PIVOT"
}
```

### Account Expansion Opportunities

```json
{
  "name": "expansion_opportunities",
  "description": "Identify upsell and cross-sell opportunities",
  "arguments": [
    {
      "name": "minARR",
      "description": "Minimum current ARR (default: $10k)",
      "required": false
    }
  ],
  "template": "# Account Expansion Opportunities\n\nIdentify customers ready for upsell{minARR}.\n\n## Expansion Signals\n- Feature requests beyond current plan\n- Advanced use cases mentioned\n- Integration requests\n- Multiple departments providing feedback\n\n## Scoring\n\nFor each opportunity:\n- Product engagement: __/10\n- Feature requests: __/10\n- Stakeholder buy-in: __/10\n- Budget signals: __/10\n\n## Output\n\n| Company | Current ARR | Expansion ARR | Signal | Action |\n|---------|-------------|---------------|--------|--------|\n| ... | ... | ... | ... | ... |\n\n**Total pipeline:** $___k\n**This quarter potential:** $___k"
}
```

## Workflow Collections

### Product Management

```json
{
  "prompts": [
    { "name": "weekly_standup", "description": "Prepare standup", "template": "..." },
    { "name": "sprint_planning", "description": "Plan sprint", "template": "..." },
    { "name": "retrospective", "description": "Sprint retro", "template": "..." }
  ]
}
```

### Customer Success

```json
{
  "prompts": [
    { "name": "customer_health", "description": "Customer health check", "template": "..." },
    { "name": "churn_risk", "description": "Churn risk analysis", "template": "..." },
    { "name": "expansion_opportunities", "description": "Find upsell candidates", "template": "..." }
  ]
}
```

### Executive Reporting

```json
{
  "prompts": [
    { "name": "monthly_metrics", "description": "Monthly dashboard", "template": "..." },
    { "name": "quarterly_review", "description": "Quarterly board report", "template": "..." }
  ]
}
```

## API Reference

### PromptConfig

```typescript
interface PromptConfig {
  name: string;           // Unique identifier
  description: string;    // User-facing description
  arguments?: Array<{     // Optional arguments
    name: string;
    description?: string;
    required: boolean;
  }>;
  template: string;       // Text with {placeholder} syntax
}
```

### MCP Protocol

**List prompts:**

```typescript
// Request
{ method: "prompts/list" }

// Response
{
  prompts: [
    { name: "weekly_triage", description: "...", arguments: [...] },
    ...
  ]
}
```

**Get prompt:**

```typescript
// Request
{ method: "prompts/get", params: { name: "weekly_triage", arguments: { boardID: "123" } } }

// Response
{
  messages: [
    { role: "user", content: { type: "text", text: "Analyze this week's feedback..." } }
  ]
}
```

## Resources

- Built-in prompts: `src/prompts/index.ts`
- Configuration guide: [PROMPT_CONFIGURATION.md](PROMPT_CONFIGURATION.md)
- Example config: `config/prompts.example.json`
