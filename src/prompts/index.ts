/**
 * Prompt templates for PM workflows
 */

import { MCPPrompt } from '../types/mcp.js';
import { PromptConfig } from '../types/config.js';

export const weeklyTriage: MCPPrompt = {
  name: 'weekly_triage',
  description: "Analyze week's feedback for PM review",
  arguments: [
    {
      name: 'boardID',
      description: 'Optional board ID to focus on',
      required: false,
    },
    {
      name: 'includeTrends',
      description: 'Include trend analysis',
      required: false,
    },
  ],
  template: (args) => `Analyze this week's feedback and identify:

1. **Top 3 themes by volume**
   - What are customers talking about most?
   - Any emerging patterns?

2. **High-revenue requests**
   - Requests from enterprise customers
   - Features with high ARR impact

3. **Quick wins**
   - High votes, low effort estimates
   - Features that could ship quickly

4. **Duplicate candidates**
   - Posts that should be merged
   - Similar requests to consolidate

5. **Sentiment shifts**
   - Changes in customer sentiment
   - New pain points emerging

6. **Posts needing Jira issues**
   - High-priority items without Jira links
   - Items in "planned" status without engineering tracking

${args.boardID ? `Focus on board: ${args.boardID}` : 'Analyze all boards'}
${args.includeTrends ? 'Include detailed trend analysis' : ''}`,
};

export const sprintPlanning: MCPPrompt = {
  name: 'sprint_planning',
  description: 'Prepare posts for sprint planning',
  arguments: [
    {
      name: 'velocity',
      description: 'Sprint velocity in story points',
      required: true,
    },
    {
      name: 'sprintLength',
      description: 'Sprint length in weeks',
      required: false,
    },
  ],
  template: (args) => `Prepare sprint planning with velocity ${args.velocity}:

1. **Find unlinked posts in "under review"**
   - Posts without Jira issues
   - Candidates for this sprint

2. **Apply RICE scoring**
   - Reach: How many customers affected
   - Impact: Revenue/satisfaction improvement
   - Confidence: Based on votes and validation
   - Effort: Estimate from similar past features

3. **Group by feature area**
   - Organize by product component
   - Identify dependencies

4. **Recommend sprint backlog**
   - Top priorities fitting velocity ${args.velocity}
   - Balance quick wins vs strategic work

5. **Suggest Jira issue titles**
   - Clear, actionable titles
   - Include customer context

6. **Estimate story points**
   - Based on similar completed items
   - Account for complexity

Sprint length: ${args.sprintLength || 2} weeks`,
};

export const executiveSummary: MCPPrompt = {
  name: 'executive_summary',
  description: 'Generate monthly executive report',
  arguments: [
    {
      name: 'month',
      description: 'Month to report on (default: current)',
      required: false,
    },
  ],
  template: (args) => `Generate executive summary for ${args.month || 'this month'}:

1. **Features shipped**
   - What we delivered
   - Adoption metrics
   - Customer feedback on releases

2. **Top 10 requests by ARR impact**
   - Highest revenue opportunities
   - Enterprise customer needs
   - Competitive requirements

3. **Churn risk features**
   - High-value customer requests
   - Critical bugs affecting revenue
   - Features blocking expansion

4. **Competitive gaps**
   - Gaps identified from feedback
   - Market trends
   - Competitor feature requests

5. **90-day roadmap preview**
   - What's planned for next quarter
   - Major initiatives
   - Resource requirements

6. **Jira velocity metrics**
   - Items completed
   - Average cycle time
   - Planned vs delivered`,
};

export const jiraSyncStatus: MCPPrompt = {
  name: 'jira_sync_status',
  description: 'Review Jira-Canny synchronization',
  arguments: [],
  template: () => `Check Jira integration health:

1. **Posts with Jira links by status**
   - How many open posts have Jira issues?
   - How many planned items are tracked?

2. **Orphaned Jira issues**
   - Issues closed in Jira but still open in Canny
   - Posts marked complete but Jira still in progress

3. **Status mismatches needing sync**
   - Jira status doesn't match Canny status
   - Items needing manual sync

4. **High-priority posts without Jira issues**
   - Posts with >20 votes unlinked
   - Enterprise requests not tracked

5. **Sprint items not marked "in progress"**
   - Jira issues in sprint but Canny not updated
   - Disconnect between planning and execution`,
};

export const customerImpact: MCPPrompt = {
  name: 'customer_impact',
  description: 'Analyze feature impact on customers',
  arguments: [
    {
      name: 'featureID',
      description: 'Post/feature ID to analyze',
      required: true,
    },
  ],
  template: (args) => `Analyze customer impact for feature ${args.featureID}:

1. **Total customers affected**
   - Number of unique requesters
   - Total votes/demand

2. **Revenue at risk**
   - ARR from requesting companies
   - Potential churn risk

3. **Enterprise vs SMB breakdown**
   - Customer segment analysis
   - Different needs by segment

4. **Related/dependent features**
   - Other features this unlocks
   - Complementary requests

5. **Implementation timeline impact**
   - Urgency based on customer commitments
   - Sales deals dependent on this
   - Competitive pressure`,
};

// Built-in prompts (always available)
export const BUILTIN_PROMPTS: MCPPrompt[] = [
  weeklyTriage,
  sprintPlanning,
  executiveSummary,
  jiraSyncStatus,
  customerImpact,
];

// Convert PromptConfig to MCPPrompt
export function convertPromptConfig(config: PromptConfig): MCPPrompt {
  return {
    name: config.name,
    description: config.description,
    arguments: (config.arguments || []).map(arg => ({
      name: arg.name,
      description: arg.description || '',
      required: arg.required,
    })),
    template: (args: Record<string, any>) => {
      // Replace {argName} placeholders with actual values
      let template = config.template;
      for (const [key, value] of Object.entries(args)) {
        const placeholder = new RegExp(`\\{${key}\\}`, 'g');
        template = template.replace(placeholder, String(value || ''));
      }
      return template;
    },
  };
}

// Load all prompts (built-in + custom from config)
export function loadPrompts(customPrompts?: PromptConfig[]): MCPPrompt[] {
  const prompts = [...BUILTIN_PROMPTS];

  if (customPrompts && Array.isArray(customPrompts)) {
    // Convert and add custom prompts
    const converted = customPrompts.map(convertPromptConfig);
    prompts.push(...converted);
  }

  return prompts;
}

// Default export for backward compatibility
export const ALL_PROMPTS: MCPPrompt[] = BUILTIN_PROMPTS;

export function getPromptByName(
  name: string,
  allPrompts: MCPPrompt[] = ALL_PROMPTS
): MCPPrompt | undefined {
  return allPrompts.find((prompt) => prompt.name === name);
}
