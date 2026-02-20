/**
 * Integration tests for CANNY_TOOL_MODE filtering logic
 *
 * Pure data tests against the ALL_TOOLS array. No API calls, no server startup.
 * Validates registry integrity, tool names, annotations, and filtering behavior.
 */

import { ALL_TOOLS } from '../../src/tools/index';
import { ToolsetName } from '../../src/types/config';

// Replicate the private getAvailableTools() filtering logic for testing
function filterTools(toolMode: string | boolean | undefined) {
  if (toolMode === undefined || toolMode === 'readonly' || toolMode === true) {
    return ALL_TOOLS.filter((tool) => tool.readOnly);
  }

  if (toolMode === 'all' || toolMode === false) {
    return ALL_TOOLS;
  }

  if (typeof toolMode === 'string') {
    const selectedToolsets = toolMode.split(',').map((t) => t.trim());
    return ALL_TOOLS.filter((tool) => selectedToolsets.includes(tool.toolset));
  }

  return ALL_TOOLS;
}

const EXPECTED_READONLY_TOOLS = [
  'canny_filter_posts',
  'canny_get_post',
  'canny_get_user_details',
  'canny_list_boards',
  'canny_list_categories',
  'canny_list_changelog_entries',
  'canny_list_comments',
  'canny_list_companies',
  'canny_list_posts',
  'canny_list_status_changes',
  'canny_list_tags',
  'canny_list_votes',
].sort();

const EXPECTED_WRITE_TOOLS = [
  'canny_add_post_tag',
  'canny_add_vote',
  'canny_batch_update_status',
  'canny_change_category',
  'canny_create_category',
  'canny_create_changelog_entry',
  'canny_create_comment',
  'canny_create_post',
  'canny_create_tag',
  'canny_delete_comment',
  'canny_find_or_create_user',
  'canny_link_company',
  'canny_link_jira_issue',
  'canny_remove_post_tag',
  'canny_remove_vote',
  'canny_unlink_jira_issue',
  'canny_update_post',
  'canny_update_post_status',
].sort();

const VALID_TOOLSETS: ToolsetName[] = [
  'discovery',
  'posts',
  'engagement',
  'users',
  'jira',
  'batch',
  'changelog',
];

describe('Tool Registry Integrity', () => {
  test('has 30 total tools', () => {
    expect(ALL_TOOLS).toHaveLength(30);
  });

  test('has 12 readonly tools', () => {
    const readonlyTools = ALL_TOOLS.filter((t) => t.readOnly);
    expect(readonlyTools).toHaveLength(12);
  });

  test('has 18 write tools', () => {
    const writeTools = ALL_TOOLS.filter((t) => !t.readOnly);
    expect(writeTools).toHaveLength(18);
  });

  test('readonly tool names match expected list', () => {
    const readonlyNames = ALL_TOOLS
      .filter((t) => t.readOnly)
      .map((t) => t.name)
      .sort();
    expect(readonlyNames).toEqual(EXPECTED_READONLY_TOOLS);
  });

  test('write tool names match expected list', () => {
    const writeNames = ALL_TOOLS
      .filter((t) => !t.readOnly)
      .map((t) => t.name)
      .sort();
    expect(writeNames).toEqual(EXPECTED_WRITE_TOOLS);
  });

  test('all tool names are unique', () => {
    const names = ALL_TOOLS.map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  test('every tool has a valid toolset', () => {
    for (const tool of ALL_TOOLS) {
      expect(VALID_TOOLSETS).toContain(tool.toolset);
    }
  });
});

describe('Annotation Consistency', () => {
  test('every readonly tool has readOnlyHint: true', () => {
    const readonlyTools = ALL_TOOLS.filter((t) => t.readOnly);
    for (const tool of readonlyTools) {
      expect(tool.annotations.readOnlyHint).toBe(true);
    }
  });

  test('every readonly tool has destructiveHint: false', () => {
    const readonlyTools = ALL_TOOLS.filter((t) => t.readOnly);
    for (const tool of readonlyTools) {
      expect(tool.annotations.destructiveHint).toBe(false);
    }
  });

  test('every tool has a non-empty description', () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  test('every tool has a non-empty title', () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.title.length).toBeGreaterThan(0);
    }
  });
});

describe('Tool Mode Filtering', () => {
  test('"readonly" returns 12 readonly tools', () => {
    const tools = filterTools('readonly');
    expect(tools).toHaveLength(12);
    expect(tools.every((t) => t.readOnly)).toBe(true);
  });

  test('true returns 12 readonly tools (backward compat)', () => {
    const tools = filterTools(true);
    expect(tools).toHaveLength(12);
    expect(tools.every((t) => t.readOnly)).toBe(true);
  });

  test('"all" returns all 30 tools', () => {
    const tools = filterTools('all');
    expect(tools).toHaveLength(30);
  });

  test('false returns all 30 tools (backward compat)', () => {
    const tools = filterTools(false);
    expect(tools).toHaveLength(30);
  });

  test('undefined defaults to 12 readonly tools', () => {
    const tools = filterTools(undefined);
    expect(tools).toHaveLength(12);
    expect(tools.every((t) => t.readOnly)).toBe(true);
  });

  test('"discovery" returns 9 tools', () => {
    const tools = filterTools('discovery');
    expect(tools).toHaveLength(9);
    expect(tools.every((t) => t.toolset === 'discovery')).toBe(true);
  });

  test('"engagement" returns 6 tools', () => {
    const tools = filterTools('engagement');
    expect(tools).toHaveLength(6);
    expect(tools.every((t) => t.toolset === 'engagement')).toBe(true);
  });

  test('"users" returns 4 tools', () => {
    const tools = filterTools('users');
    expect(tools).toHaveLength(4);
    expect(tools.every((t) => t.toolset === 'users')).toBe(true);
  });

  test('"posts" returns 6 tools', () => {
    const tools = filterTools('posts');
    expect(tools).toHaveLength(6);
    expect(tools.every((t) => t.toolset === 'posts')).toBe(true);
  });

  test('"changelog" returns 2 tools', () => {
    const tools = filterTools('changelog');
    expect(tools).toHaveLength(2);
    expect(tools.every((t) => t.toolset === 'changelog')).toBe(true);
  });

  test('"jira" returns 2 tools', () => {
    const tools = filterTools('jira');
    expect(tools).toHaveLength(2);
    expect(tools.every((t) => t.toolset === 'jira')).toBe(true);
  });

  test('"batch" returns 1 tool', () => {
    const tools = filterTools('batch');
    expect(tools).toHaveLength(1);
    expect(tools[0].toolset).toBe('batch');
  });

  test('"discovery,engagement" returns 15 tools', () => {
    const tools = filterTools('discovery,engagement');
    expect(tools).toHaveLength(15);
    expect(
      tools.every((t) => t.toolset === 'discovery' || t.toolset === 'engagement')
    ).toBe(true);
  });

  test('"users,jira,batch" returns 7 tools', () => {
    const tools = filterTools('users,jira,batch');
    expect(tools).toHaveLength(7);
    expect(
      tools.every(
        (t) => t.toolset === 'users' || t.toolset === 'jira' || t.toolset === 'batch'
      )
    ).toBe(true);
  });

  test('handles whitespace in comma-separated values', () => {
    const tools = filterTools(' discovery , engagement ');
    expect(tools).toHaveLength(15);
  });
});
