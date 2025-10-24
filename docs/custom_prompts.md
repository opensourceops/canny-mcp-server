# Custom Prompts Feature Documentation

## Table of Contents

- [Overview](#overview)
- [MCP Prompts vs Custom Prompts](#mcp-prompts-vs-custom-prompts)
- [Configuration](#configuration)
- [Template Syntax](#template-syntax)
- [Built-in Prompts](#built-in-prompts)
- [Creating Custom Prompts](#creating-custom-prompts)
- [Advanced Examples](#advanced-examples)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Overview

The Canny MCP Server supports **configurable prompts** that allow you to create custom PM workflows tailored to your team's needs. Prompts are pre-configured templates that appear as `/commands` in Claude Code and other MCP clients.

### What Are Prompts?

**Prompts** are reusable prompt templates defined in your configuration that:
- Appear as slash commands in Claude Code (e.g., `/weekly_triage`)
- Can accept arguments (e.g., `/sprint_planning velocity=21`)
- Guide Claude to perform specific PM workflows
- Use Canny tools automatically to gather data

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  config/default.json                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ "prompts": [                                          │  │
│  │   { "name": "my_prompt", "template": "..." }          │  │
│  │ ]                                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Canny MCP Server (src/prompts/index.ts)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Built-in Prompts (5)      +      Custom Prompts       │  │
│  │ - weekly_triage                  - my_prompt          │  │
│  │ - sprint_planning                - custom_workflow    │  │
│  │ - executive_summary              ...                  │  │
│  │ - jira_sync_status                                    │  │
│  │ - customer_impact                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MCP Protocol (Standard)                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ListPromptsRequest → Returns all prompts             │  │
│  │ GetPromptRequest → Returns prompt template           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Claude Code (MCP Client)                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ User types: /my_prompt                                │  │
│  │ → Fetches template from server                        │  │
│  │ → Replaces {placeholders} with arguments              │  │
│  │ → Executes prompt with Claude                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## MCP Prompts vs Custom Prompts

### MCP Standard (What's Official)

The **Model Context Protocol (MCP)** officially defines:

```typescript
// Official MCP Prompt Structure
interface MCPPrompt {
  name: string;                    // Required: unique identifier
  description: string;              // Required: user-facing description
  arguments?: Array<{               // Optional: prompt arguments
    name: string;
    description: string;
    required: boolean;
  }>;
}
```

**What MCP Specifies:**
- ✅ Prompts capability exists
- ✅ `ListPromptsRequest` / `GetPromptRequest` protocol
- ✅ Prompt structure (name, description, arguments)
- ✅ Client shows prompts as commands

**What MCP Does NOT Specify:**
- ❌ How prompts are stored
- ❌ Template syntax for arguments
- ❌ How to load custom prompts
- ❌ Configuration format

### Custom Implementation (What We Added)

Our **custom prompt system** adds:

```typescript
// Custom Configuration Format
interface PromptConfig {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  template: string;              // 🆕 Template with {placeholders}
}
```

**What We Added:**
- ✅ **JSON configuration** - Define prompts in config files
- ✅ **Template placeholders** - Use `{argumentName}` syntax
- ✅ **Automatic loading** - Merge built-in + custom prompts
- ✅ **5 built-in prompts** - Production-ready PM workflows
- ✅ **Dynamic arguments** - Replace placeholders at runtime

---

## Configuration

### Location

Prompts are configured in `config/default.json`:

```json
{
  "canny": { ... },
  "server": { ... },
  "logging": { ... },
  "prompts": [
    // Your custom prompts here
  ]
}
```

### Basic Structure

```json
{
  "prompts": [
    {
      "name": "prompt_name",
      "description": "What this prompt does",
      "arguments": [
        {
          "name": "arg1",
          "description": "Description of argument",
          "required": true
        }
      ],
      "template": "Prompt text with {arg1}"
    }
  ]
}
```

### Minimal Example

```json
{
  "prompts": [
    {
      "name": "daily_standup",
      "description": "Prepare daily standup",
      "template": "Summarize yesterday's feedback:\n1. New posts\n2. Status changes\n3. Urgent items"
    }
  ]
}
```

### Complete Example

```json
{
  "prompts": [
    {
      "name": "sprint_planning",
      "description": "Plan sprint with RICE scoring",
      "arguments": [
        {
          "name": "velocity",
          "description": "Sprint velocity in story points",
          "required": true
        },
        {
          "name": "focus",
          "description": "Optional focus area (e.g., 'API', 'Mobile')",
          "required": false
        }
      ],
      "template": "Plan sprint with velocity {velocity}:\n\n1. **Find candidates**\n   - Posts in 'under review' status\n   - Filter by focus area: {focus}\n\n2. **Apply RICE scoring**\n   - Reach: Voter count\n   - Impact: Revenue potential\n   - Confidence: Customer validation\n   - Effort: Story points estimate\n\n3. **Recommend backlog**\n   - Items fitting {velocity} points\n   - Balance quick wins vs strategic\n\n4. **Output**\n   - Ranked list with RICE scores\n   - Suggested Jira issue titles\n   - Story point estimates"
    }
  ]
}
```

---

## Template Syntax

### Basic Text

```json
{
  "template": "Analyze customer feedback and identify top themes"
}
```

### Placeholders

Use `{argumentName}` to insert argument values:

```json
{
  "arguments": [
    { "name": "velocity", "required": true }
  ],
  "template": "Plan sprint with {velocity} points"
}
```

**Usage:** `/sprint_planning velocity=21`
**Result:** "Plan sprint with 21 points"

### Multiple Placeholders

```json
{
  "arguments": [
    { "name": "company", "required": true },
    { "name": "timeframe", "required": true }
  ],
  "template": "Analyze {company} feedback from {timeframe}"
}
```

**Usage:** `/customer_analysis company=Acme timeframe="last 30 days"`
**Result:** "Analyze Acme feedback from last 30 days"

### Optional Arguments

Optional arguments become empty strings if not provided:

```json
{
  "arguments": [
    { "name": "boardId", "required": false }
  ],
  "template": "Analyze feedback{boardId}"
}
```

**Without argument:** `/analyze` → "Analyze feedback"
**With argument:** `/analyze boardId=" for board XYZ"` → "Analyze feedback for board XYZ"

**Tip:** Add conditional text around optional arguments:

```json
{
  "template": "Analyze feedback{boardId}\n{focus}"
}
```

### Line Breaks

Use `\n` for line breaks:

```json
{
  "template": "Generate report:\n1. Top requests\n2. Quick wins\n3. Churn risks"
}
```

### Markdown Formatting

Templates support full markdown:

```json
{
  "template": "# Sprint Planning\n\n## Objectives\n\n1. **High Priority**\n   - Item A\n   - Item B\n\n2. **Medium Priority**\n   - Item C\n\n---\n\n**Velocity:** {velocity} points"
}
```

### Complex Example

```json
{
  "name": "customer_360",
  "description": "Complete customer analysis",
  "arguments": [
    { "name": "companyId", "required": true },
    { "name": "includeHistory", "required": false },
    { "name": "timeframe", "required": false }
  ],
  "template": "# Customer 360 Analysis: {companyId}\n\n## Overview\n\nAnalyze all aspects of customer {companyId}{timeframe}.\n\n## Analysis Areas\n\n### 1. Feedback Activity\n- Total posts submitted\n- Votes cast\n- Comments made\n- Engagement trend\n\n### 2. Feature Requests\n- Open requests (by priority)\n- Closed requests\n- Average time to resolution\n\n### 3. Sentiment Analysis\n- Overall sentiment score\n- Sentiment trend\n- Key themes in feedback\n\n### 4. Business Impact\n- ARR contribution\n- Expansion opportunities\n- Churn risk indicators\n\n### 5. Product Gaps\n- Requested features vs. competitors\n- Blockers for expansion\n- Critical bugs reported\n\n{includeHistory}\n\n## Recommendations\n\nBased on the analysis above:\n1. Immediate actions needed\n2. Strategic initiatives\n3. Follow-up items"
}
```

---

## Built-in Prompts

The server includes **5 production-ready built-in prompts** that are always available:

### 1. `weekly_triage`

**Purpose:** Weekly feedback review for standups

**Arguments:**
- `boardID` (optional) - Focus on specific board
- `includeTrends` (optional) - Include trend analysis

**Template:**
```
Analyze this week's feedback and identify:

1. Top 3 themes by volume
   - What are customers talking about most?
   - Any emerging patterns?

2. High-revenue requests
   - Requests from enterprise customers
   - Features with high ARR impact

3. Quick wins
   - High votes, low effort estimates
   - Features that could ship quickly

4. Duplicate candidates
   - Posts that should be merged
   - Similar requests to consolidate

5. Sentiment shifts
   - Changes in customer sentiment
   - New pain points emerging

6. Posts needing Jira issues
   - High-priority items without Jira links
```

**Usage:**
```
/weekly_triage
/weekly_triage boardID=65fcb328612dc3f614f251f5
/weekly_triage includeTrends=true
```

### 2. `sprint_planning`

**Purpose:** Prepare sprint backlog with RICE scoring

**Arguments:**
- `velocity` (required) - Sprint velocity in points
- `sprintLength` (optional) - Sprint length in weeks

**Usage:**
```
/sprint_planning velocity=21
/sprint_planning velocity=21 sprintLength=1
```

### 3. `executive_summary`

**Purpose:** Generate monthly executive report

**Arguments:**
- `month` (optional) - Month to report on

**Usage:**
```
/executive_summary
/executive_summary month="September 2025"
```

### 4. `jira_sync_status`

**Purpose:** Review Jira-Canny synchronization health

**Arguments:** None

**Usage:**
```
/jira_sync_status
```

### 5. `customer_impact`

**Purpose:** Analyze feature impact on customers and revenue

**Arguments:**
- `featureID` (required) - Post ID to analyze

**Usage:**
```
/customer_impact featureID=68fac703a1c52202e2a1d917
```

---

## Creating Custom Prompts

### Step-by-Step Guide

#### Step 1: Define Your Workflow

Decide what you want the prompt to do:
- What data should it analyze?
- What questions should it answer?
- What format should the output be?

#### Step 2: Identify Arguments

What inputs does the workflow need?
- Customer ID?
- Time period?
- Specific board?
- Competitor name?

#### Step 3: Write the Template

Structure your prompt:
```
1. Context/Overview
2. Data to gather
3. Analysis to perform
4. Expected output format
```

#### Step 4: Add to Config

Edit `config/default.json`:
```json
{
  "prompts": [
    {
      "name": "your_prompt",
      "description": "What it does",
      "arguments": [ ... ],
      "template": "Your template..."
    }
  ]
}
```

#### Step 5: Test

```bash
npm run build
npm start
```

Then in Claude Code:
```
/your_prompt
```

### Example: Creating a "Churn Risk" Prompt

**Step 1: Define workflow**
- Identify customers at risk of churning
- Based on negative feedback, open critical bugs, and lack of engagement

**Step 2: Identify arguments**
- `threshold` - Minimum ARR to consider (optional)
- `timeframe` - Period to analyze (optional)

**Step 3: Write template**
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
  "template": "# Churn Risk Analysis\n\nIdentify customers at risk of churning{threshold}{timeframe}.\n\n## Analysis Criteria\n\n### 1. Feedback Signals\n- Multiple critical bugs reported\n- Negative sentiment in recent comments\n- Feature requests marked 'blocker'\n- Lack of engagement (no votes/comments)\n\n### 2. Product Issues\n- Open bugs affecting customer\n- Feature requests not addressed\n- Competitive gaps mentioned\n\n### 3. Risk Scoring\n\nFor each at-risk customer, provide:\n- Company name and ARR\n- Risk score (1-10)\n- Key risk factors\n- Open critical issues\n- Recommended actions\n\n### 4. Prioritization\n\nRank customers by:\n1. ARR impact (high to low)\n2. Risk score (high to low)\n3. Urgency (immediate action needed)\n\n## Output Format\n\n**High Risk** (Score 8-10)\n- Company A: $500k ARR\n  - 3 critical bugs open >60 days\n  - No engagement in 90 days\n  - Action: Schedule exec call\n\n**Medium Risk** (Score 5-7)\n- Company B: $200k ARR\n  - Competitive gap mentioned\n  - Awaiting key feature\n  - Action: Roadmap update\n\n**Monitoring** (Score 3-4)\n- ...\n\n## Next Steps\n\n1. Immediate actions for high-risk customers\n2. Proactive outreach for medium-risk\n3. Feature prioritization recommendations"
}
```

**Step 4: Add to config**

Add the JSON above to your `config/default.json` prompts array.

**Step 5: Use**

```
/churn_risk_analysis
/churn_risk_analysis threshold=" (ARR > $50k)"
/churn_risk_analysis timeframe=" in last 30 days"
```

---

## Advanced Examples

### Example 1: Competitive Intelligence

```json
{
  "name": "competitive_intel",
  "description": "Analyze competitor mentions in feedback",
  "arguments": [
    {
      "name": "competitor",
      "description": "Competitor name (e.g., 'Salesforce', 'HubSpot')",
      "required": true
    },
    {
      "name": "timeframe",
      "description": "Time period (default: last 90 days)",
      "required": false
    }
  ],
  "template": "# Competitive Intelligence: {competitor}\n\nAnalyze all feedback mentioning {competitor}{timeframe}.\n\n## 1. Feature Comparison\n\n**Most mentioned {competitor} features:**\n- Search for posts mentioning {competitor}\n- Extract features customers compare\n- Group by product area\n\n## 2. Gap Analysis\n\n**Where {competitor} is ahead:**\n- Features we don't have\n- Capabilities customers want\n- Why customers mention {competitor}\n\n**Where we're ahead:**\n- Our unique features\n- Advantages we have\n- Counter-positioning opportunities\n\n## 3. Customer Segment Analysis\n\n**Who's asking about {competitor}:**\n- Enterprise vs SMB breakdown\n- Industry distribution\n- ARR range\n\n## 4. Business Impact\n\n**Deals at risk:**\n- Customers evaluating {competitor}\n- Features blocking deals\n- Revenue at stake\n\n**Churn risk:**\n- Existing customers comparing\n- Migration indicators\n- Satisfaction concerns\n\n## 5. Strategic Recommendations\n\n**Immediate actions:**\n1. Feature gaps to close (ROI calculation)\n2. Messaging/positioning updates\n3. Customer outreach needed\n\n**Long-term initiatives:**\n1. Product roadmap implications\n2. Competitive advantages to build\n3. Market positioning strategy\n\n## 6. Win/Loss Analysis\n\n**When we beat {competitor}:**\n- Key differentiators that worked\n- Decision criteria in our favor\n\n**When we lost to {competitor}:**\n- Gaps that cost us deals\n- Pricing/value perception\n\n## Output Summary\n\nProvide executive summary with:\n- Top 3 competitive gaps\n- Top 3 wins against {competitor}\n- ARR at risk\n- Recommended actions (prioritized)"
}
```

### Example 2: Product-Market Fit Assessment

```json
{
  "name": "pmf_assessment",
  "description": "Assess product-market fit by customer segment",
  "arguments": [
    {
      "name": "segment",
      "description": "Customer segment (e.g., 'Enterprise', 'SMB', 'Startup')",
      "required": false
    },
    {
      "name": "productArea",
      "description": "Product area to focus on",
      "required": false
    }
  ],
  "template": "# Product-Market Fit Assessment{segment}{productArea}\n\n## 1. Engagement Metrics\n\n**Feedback volume:**\n- Total posts by segment\n- Votes per post average\n- Comment engagement rate\n- Trend over time (growing/declining)\n\n**Participation rate:**\n- % of customers providing feedback\n- Active contributors vs total\n- Engagement frequency\n\n## 2. Sentiment Analysis\n\n**Overall sentiment:**\n- Positive vs negative feedback ratio\n- Pain point frequency\n- Feature request vs bug ratio\n- Satisfaction indicators\n\n**Sentiment by lifecycle stage:**\n- New customers (0-90 days)\n- Growing customers (90-365 days)\n- Mature customers (365+ days)\n\n## 3. Value Realization\n\n**Time to value:**\n- How quickly customers get value\n- Onboarding friction points\n- Activation blockers\n\n**Feature adoption:**\n- Most used features\n- Least used features\n- Requested vs adopted\n\n## 4. Problem/Solution Fit\n\n**Top problems being solved:**\n- Most common use cases\n- Success stories in feedback\n- Value delivered\n\n**Unmet needs:**\n- Feature requests by volume\n- Workarounds customers mention\n- Gaps in value proposition\n\n## 5. Retention Signals\n\n**Positive indicators:**\n- Feature expansion requests\n- Integration asks\n- Advanced use cases\n\n**Negative indicators:**\n- Cancellation mentions\n- Competitor comparisons\n- Frustration themes\n\n## 6. Segment-Specific Insights\n\n{segment}\n\n**Unique needs:**\n- Problems specific to segment\n- Feature requests unique to segment\n- Willingness to pay signals\n\n**PMF score for segment:**\n- Strong fit (8-10)\n- Moderate fit (5-7)\n- Weak fit (1-4)\n\n## 7. Recommendations\n\n**Double down (strong PMF):**\n- Segments/areas with strong fit\n- Features to invest in\n- Marketing messaging\n\n**Improve (moderate PMF):**\n- Gaps to address\n- Feature prioritization\n- Customer success focus\n\n**Pivot or exit (weak PMF):**\n- Segments to deprioritize\n- Features to sunset\n- Resource reallocation\n\n## Summary\n\nProvide PMF score (1-10) with:\n- Key strengths (why customers love it)\n- Major gaps (why customers struggle)\n- Strategic recommendations\n- Next steps"
}
```

### Example 3: Feature Launch Readiness

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
  "template": "# Feature Launch Readiness: {featureId}\n\n{targetDate}\n\n## 1. Customer Demand\n\n**Quantitative:**\n- Total votes\n- Number of requesting companies\n- Total ARR represented\n- Request frequency over time\n\n**Qualitative:**\n- Customer testimonials from comments\n- Use cases described\n- Pain points mentioned\n- Expected business impact\n\n## 2. Customer Validation\n\n**Beta testing:**\n- Who tested the feature?\n- Feedback from beta testers\n- Issues discovered\n- Adoption rate in beta\n\n**Customer interviews:**\n- Validation interviews conducted\n- Key learnings\n- Concerns raised\n- Willingness to adopt\n\n## 3. Market Context\n\n**Competitive positioning:**\n- Competitor offerings\n- Our differentiation\n- Market timing\n\n**Customer readiness:**\n- Do they understand it?\n- Training needed\n- Change management required\n\n## 4. Communication Plan\n\n**Who to notify:**\n- All voters (users)\n- Requesting companies (decision makers)\n- Beta participants\n- Target segments\n\n**Messaging:**\n- Value proposition\n- Use cases to highlight\n- Getting started guide\n- Success metrics\n\n## 5. Success Metrics\n\n**Adoption goals:**\n- % of requesters who adopt (target: >60%)\n- Time to first use (target: <7 days)\n- Active usage (target: weekly)\n\n**Business impact:**\n- Deals unblocked\n- Expansion revenue\n- Churn prevention\n\n**Satisfaction:**\n- NPS impact\n- Feedback sentiment\n- Feature rating\n\n## 6. Risk Assessment\n\n**Adoption risks:**\n- Complexity barriers\n- Integration challenges\n- Training gaps\n\n**Business risks:**\n- Pricing implications\n- Support readiness\n- Competitive response\n\n## 7. Go/No-Go Checklist\n\n**Must-haves (launch blockers):**\n- [ ] Customer validation positive\n- [ ] Beta feedback incorporated\n- [ ] Documentation complete\n- [ ] Support team trained\n- [ ] Announcement ready\n- [ ] Success metrics defined\n\n**Nice-to-haves:**\n- [ ] Video tutorial\n- [ ] Customer webinar scheduled\n- [ ] Case study ready\n- [ ] Blog post drafted\n\n## 8. Launch Recommendation\n\n**Readiness score:** (1-10)\n\n**Recommendation:**\n- [ ] **GO** - Ready to launch\n- [ ] **HOLD** - Address blockers first\n- [ ] **PIVOT** - Rethink approach\n\n**Reasoning:**\n[Why this recommendation based on analysis above]\n\n**Actions before launch:**\n1. [Immediate action 1]\n2. [Immediate action 2]\n3. [Immediate action 3]\n\n**Post-launch:**\n- Day 1: Monitor adoption\n- Week 1: Customer interviews\n- Month 1: Metrics review"
}
```

### Example 4: Account Expansion Opportunities

```json
{
  "name": "expansion_opportunities",
  "description": "Identify upsell/cross-sell opportunities",
  "arguments": [
    {
      "name": "minARR",
      "description": "Minimum current ARR (default: $10k)",
      "required": false
    },
    {
      "name": "segment",
      "description": "Customer segment to focus on",
      "required": false
    }
  ],
  "template": "# Account Expansion Opportunities\n\nIdentify customers ready for upsell/cross-sell{minARR}{segment}.\n\n## 1. Expansion Signals\n\n**Product engagement:**\n- Feature requests beyond current plan\n- Advanced use cases mentioned\n- Integration requests\n- Scaling/volume needs\n\n**Feedback patterns:**\n- Multiple departments providing feedback\n- Enterprise features requested\n- Team collaboration mentioned\n- Workflow expansion described\n\n## 2. Feature Requests Analysis\n\n**Premium features requested:**\n- SSO/SAML\n- Advanced reporting\n- API access\n- Custom integrations\n- White-labeling\n- SLA/support upgrades\n\n**Volume indicators:**\n- User limit concerns\n- Data volume increases\n- Rate limit feedback\n\n## 3. Customer Segmentation\n\n**By expansion potential:**\n\n**High potential** (likely to expand):\n- Active feature requesters\n- Growing usage patterns\n- Multiple stakeholders engaged\n- Positive sentiment\n\nFor each:\n- Current ARR\n- Expansion opportunity size\n- Features they want\n- Timeline signals\n\n**Medium potential:**\n- Some expansion signals\n- Limited engagement\n- Price-sensitive indicators\n\n**Low potential:**\n- Minimal feature requests\n- Declining engagement\n- Churn risk signals\n\n## 4. Expansion Plays\n\n**Seat expansion:**\n- Customers adding users\n- Department rollout requests\n- Team collaboration needs\n\n**Tier upgrade:**\n- Premium feature requests\n- Current plan limitations\n- Business growth indicators\n\n**Add-ons:**\n- Integration needs\n- Additional modules\n- Professional services\n\n## 5. Account Scoring\n\nFor each expansion opportunity:\n\n**Expansion readiness score** (1-10):\n- Product engagement: ___/10\n- Feature requests: ___/10\n- Stakeholder buy-in: ___/10\n- Budget signals: ___/10\n\n**Total score:** ___/40\n\n## 6. Recommended Actions\n\n**Tier 1: Immediate outreach** (Score 30+)\n\n| Company | Current ARR | Expansion ARR | Key Signal | Action |\n|---------|-------------|---------------|------------|--------|\n| Acme Corp | $50k | +$75k | SSO requested | Sales call this week |\n\n**Tier 2: Nurture** (Score 20-29)\n\n| Company | Current ARR | Expansion ARR | Key Signal | Action |\n|---------|-------------|---------------|------------|--------|\n| Beta Inc | $25k | +$35k | API interest | Share use case |\n\n**Tier 3: Monitor** (Score 10-19)\n\n[Companies to watch]\n\n## 7. Expansion Playbook\n\n**For each opportunity:**\n\n1. **Research**\n   - Review all feedback\n   - Identify stakeholders\n   - Understand use case\n\n2. **Reach out**\n   - Personalized email\n   - Reference their feedback\n   - Offer demo/consultation\n\n3. **Demonstrate value**\n   - Show requested features\n   - Quantify ROI\n   - Share similar customer success\n\n4. **Close**\n   - Address objections\n   - Pilot/trial offer\n   - Expansion pricing\n\n## Output Summary\n\n**Total expansion pipeline:** $___k\n**High-confidence deals:** $___k (>70% likelihood)\n**This quarter potential:** $___k\n\n**Top 5 accounts to focus on:**\n1. [Company] - $[expansion ARR] - [key signal]\n2. ...\n\n**Next steps:**\n- Week 1: Outreach to Tier 1 accounts\n- Week 2: Nurture campaigns for Tier 2\n- Ongoing: Monitor Tier 3"
}
```

---

## Use Cases

### Product Management Workflows

1. **Weekly Triage** - Review feedback for standup
2. **Sprint Planning** - Select features for sprint
3. **Roadmap Planning** - Quarterly prioritization
4. **Feature Validation** - Assess demand before building
5. **Launch Planning** - Prepare feature launches

### Customer Success

1. **Health Checks** - Assess customer satisfaction
2. **Churn Prevention** - Identify at-risk customers
3. **Expansion Opportunities** - Find upsell candidates
4. **Onboarding Analysis** - Improve new customer experience
5. **Renewal Preparation** - Prepare for contract renewals

### Executive Reporting

1. **Monthly Metrics** - Executive dashboard
2. **Quarterly Reviews** - Board presentations
3. **Annual Planning** - Strategic initiatives
4. **Competitive Analysis** - Market positioning
5. **Product-Market Fit** - Segment analysis

### Sales Enablement

1. **Competitive Intelligence** - Win/loss analysis
2. **Feature Gaps** - Product vs competition
3. **Customer References** - Success stories
4. **Objection Handling** - Common concerns
5. **Deal Support** - Feature requests from prospects

---

## Best Practices

### 1. Naming Conventions

✅ **Good:**
- `weekly_triage`
- `sprint_planning`
- `churn_risk_analysis`
- `competitive_intel`

❌ **Bad:**
- `prompt1`
- `test`
- `my_thing`
- `WP` (unclear acronym)

**Rules:**
- Use lowercase with underscores
- Be descriptive
- Use noun_verb format
- Avoid abbreviations

### 2. Descriptions

✅ **Good:**
```json
{
  "description": "Identify customers at risk of churning based on feedback signals"
}
```

❌ **Bad:**
```json
{
  "description": "Churn stuff"
}
```

**Rules:**
- Explain what it does
- Mention key inputs/outputs
- Use complete sentences
- 50-100 characters ideal

### 3. Argument Design

✅ **Good:**
```json
{
  "arguments": [
    {
      "name": "velocity",
      "description": "Sprint velocity in story points (e.g., 21, 34)",
      "required": true
    }
  ]
}
```

❌ **Bad:**
```json
{
  "arguments": [
    {
      "name": "v",
      "description": "Velocity",
      "required": true
    }
  ]
}
```

**Rules:**
- Descriptive argument names
- Include examples in description
- Specify units/format
- Mark truly required as required

### 4. Template Structure

✅ **Good structure:**
```
# Title

## 1. Data Collection
[What data to gather]

## 2. Analysis
[How to analyze it]

## 3. Insights
[What to look for]

## 4. Recommendations
[Action items]

## Summary
[Executive summary]
```

❌ **Bad structure:**
```
Do some analysis and tell me stuff
```

**Rules:**
- Clear sections with headers
- Numbered lists for structure
- Specific instructions
- Expected output format

### 5. Placeholder Usage

✅ **Good:**
```json
{
  "template": "Analyze {company} feedback from {timeframe}:\n1. Sentiment analysis\n2. Key themes\n3. Action items"
}
```

❌ **Bad:**
```json
{
  "template": "Analyze feedback for {company} and also look at {timeframe} and then do {analysis} and output {format}"
}
```

**Rules:**
- Use placeholders sparingly
- Provide context around placeholder
- Don't overuse (max 3-5 per template)
- Make optional args truly optional

### 6. Testing

Before deploying:

```bash
# 1. Validate JSON syntax
cat config/default.json | jq .

# 2. Build
npm run build

# 3. Test loading
npx tsx test-prompts-config.ts

# 4. Start server
npm start

# 5. Test in Claude
/your_new_prompt arg=value
```

---

## Troubleshooting

### Prompts Not Showing Up

**Issue:** Custom prompts don't appear in Claude Code

**Solutions:**

1. **Check JSON syntax:**
```bash
cat config/default.json | jq .
# Should output formatted JSON
# If error, fix JSON syntax
```

2. **Verify config location:**
```bash
ls config/default.json
# Should exist
```

3. **Check build:**
```bash
npm run build
# Should complete without errors
```

4. **Check server logs:**
```bash
npm start
# Look for: "Canny MCP Server initialized { prompts: 7, builtIn: 5, custom: 2 }"
```

5. **Restart Claude Code:**
- Quit Claude Code completely
- Restart
- Try `/your_prompt` again

### Template Not Using Arguments

**Issue:** Arguments show as `{argumentName}` instead of values

**Problem:**
```json
{
  "template": "Use ${velocity} points"  // Wrong!
}
```

**Solution:**
```json
{
  "template": "Use {velocity} points"   // Correct: use { }
}
```

**Debugging:**
```bash
npx tsx test-prompts-config.ts
# Check "Argument placeholder replacement" test
```

### Arguments Showing Empty

**Issue:** Arguments replaced with empty strings

**Possible causes:**

1. **Name mismatch:**
```json
{
  "arguments": [{"name": "velocity"}],
  "template": "{velocty}"  // Typo! Should be {velocity}
}
```

2. **Not providing argument:**
```
/sprint_planning
# Missing: velocity=21
```

3. **Wrong argument name:**
```
/sprint_planning v=21
# Should be: velocity=21
```

**Solution:**
- Check spelling matches exactly
- Provide required arguments
- Use correct argument names

### Server Won't Start

**Issue:** Server crashes on startup

**Check logs:**
```bash
npm start 2>&1 | tee server.log
```

**Common errors:**

1. **Invalid JSON:**
```
SyntaxError: Unexpected token } in JSON
```
**Fix:** Validate JSON syntax

2. **Missing required fields:**
```
TypeError: Cannot read property 'name' of undefined
```
**Fix:** Ensure all prompts have name, description, template

3. **Duplicate names:**
```
Warning: Duplicate prompt name 'weekly_triage'
```
**Fix:** Use unique names for custom prompts

### Prompts Not Working as Expected

**Issue:** Claude doesn't follow the prompt correctly

**Solutions:**

1. **Be more specific in template:**
❌ Vague: "Analyze feedback"
✅ Specific: "Analyze feedback from the last 7 days and identify the top 3 themes by vote count"

2. **Add output format:**
```json
{
  "template": "...analysis instructions...\n\n## Output Format\n\n1. Theme: [name]\n   - Votes: [count]\n   - Posts: [list]\n\n2. Theme: [name]\n   ..."
}
```

3. **Provide examples:**
```json
{
  "template": "...instructions...\n\n## Example Output\n\n**Top Theme:** API Performance\n- 45 votes across 8 posts\n- Affects enterprise customers\n- Quick win opportunity\n\n[Now provide actual analysis...]"
}
```

---

## API Reference

### PromptConfig Interface

```typescript
interface PromptConfig {
  name: string;                    // Required: unique identifier
  description: string;              // Required: user-facing description
  arguments?: PromptArgument[];     // Optional: list of arguments
  template: string;                 // Required: prompt template text
}
```

### PromptArgument Interface

```typescript
interface PromptArgument {
  name: string;                    // Required: argument identifier
  description?: string;             // Optional: user-facing description
  required: boolean;                // Required: true or false
}
```

### Configuration Location

**File:** `config/default.json`

**Path:** `config.prompts` (array)

**Example:**
```json
{
  "canny": { ... },
  "server": { ... },
  "logging": { ... },
  "prompts": [
    { ... },
    { ... }
  ]
}
```

### Loading Behavior

```typescript
// Server initialization
constructor(config: CannyMCPConfig) {
  // Load built-in prompts (5)
  const builtIn = BUILTIN_PROMPTS;

  // Load custom prompts from config
  const custom = loadPrompts(config.prompts);

  // Merge: built-in + custom
  this.prompts = [...builtIn, ...custom];
}
```

**Result:**
- Built-in prompts: Always available
- Custom prompts: Added from config
- Total prompts: Built-in + Custom

### Template Replacement

```typescript
// Placeholder replacement logic
function replaceTemplate(template: string, args: Record<string, any>): string {
  let result = template;

  for (const [key, value] of Object.entries(args)) {
    const placeholder = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(placeholder, String(value || ''));
  }

  return result;
}
```

**Example:**
```typescript
template: "Plan sprint with {velocity} points"
args: { velocity: 21 }
result: "Plan sprint with 21 points"
```

### MCP Protocol

**List Prompts:**
```typescript
// Request
{ method: "prompts/list" }

// Response
{
  prompts: [
    {
      name: "weekly_triage",
      description: "Analyze week's feedback",
      arguments: [
        { name: "boardId", description: "...", required: false }
      ]
    },
    ...
  ]
}
```

**Get Prompt:**
```typescript
// Request
{
  method: "prompts/get",
  params: {
    name: "weekly_triage",
    arguments: { boardId: "123" }
  }
}

// Response
{
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: "Analyze this week's feedback for board 123:..."
      }
    }
  ]
}
```

---

## Summary

### Key Features

✅ **5 built-in prompts** - Production-ready PM workflows
✅ **Unlimited custom prompts** - Add your own workflows
✅ **JSON configuration** - Easy to manage and version control
✅ **{placeholder} syntax** - Dynamic argument replacement
✅ **MCP standard** - Works with all MCP clients
✅ **Auto-loading** - Merge built-in + custom automatically

### Configuration Format

```json
{
  "prompts": [
    {
      "name": "prompt_name",
      "description": "What it does",
      "arguments": [
        { "name": "arg1", "description": "...", "required": true }
      ],
      "template": "Template with {arg1}"
    }
  ]
}
```

### Quick Start

1. Edit `config/default.json`
2. Add prompts to `prompts` array
3. `npm run build`
4. `npm start`
5. Use `/your_prompt` in Claude Code

### Resources

- **Example config:** `config/prompts.example.json`
- **Test suite:** `npx tsx test-prompts-config.ts`
- **Built-in prompts:** `src/prompts/index.ts`
- **Documentation:** `PROMPT_CONFIGURATION.md`

---

**Need help?** Check the troubleshooting section or review the example config file!
