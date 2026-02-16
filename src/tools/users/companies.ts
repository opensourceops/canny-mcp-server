/**
 * Company management tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { validateRequired } from '../../utils/validators.js';

export const listCompanies: MCPTool = {
  name: 'canny_list_companies',
  title: 'List Companies',
  description: `List companies registered in Canny with pagination support.

Retrieves company records for segmentation and filtering, returning basic company info and spend data.

Args:
  - limit (number): Number of companies to fetch (default: 20)
  - skip (number): Number of companies to skip for pagination (default: 0)

Returns:
  JSON with companies array (id, name, monthlySpend, created) and hasMore boolean.

Examples:
  - "Show all companies" -> no params needed
  - "Get next page of companies" -> skip: 20, limit: 20`,
  readOnly: true,
  toolset: 'users',
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    limit: z.number().optional().describe('Number of companies to fetch'),
    skip: z.number().optional().describe('Number of companies to skip'),
  },
  handler: async (params, { client, logger }) => {
    const { limit = 20, skip = 0 } = params;

    logger.info('Listing companies', { limit, skip });

    const response = await client.listCompanies({ limit, skip });

    const companies = response.companies.map((company) => ({
      id: company.id,
      name: company.name,
      monthlySpend: company.monthlySpend || 0,
      created: company.created,
    }));

    logger.info(`Found ${companies.length} companies`);

    return {
      companies,
      hasMore: response.hasMore,
    };
  },
};

export const linkCompany: MCPTool = {
  name: 'canny_link_company',
  title: 'Link User to Company',
  description: `Associate a Canny user with a company for revenue tracking.

Links a user to a company by ID or name. If a companyName is provided without a companyID, a new company is created automatically.

Args:
  - userID (string, required): Canny user ID to link
  - companyID (string): Existing company ID to associate
  - companyName (string): Company name (creates company if companyID not given)
  - monthlySpend (number): Monthly spend/revenue for the company

Returns:
  JSON with success boolean.

Examples:
  - "Link user to existing company" -> userID, companyID
  - "Link user to new company" -> userID, companyName: "Acme Inc", monthlySpend: 500`,
  readOnly: false,
  toolset: 'users',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    userID: z.string().describe('User ID'),
    companyID: z.string().optional().describe('Company ID'),
    companyName: z.string().optional().describe('Company name'),
    monthlySpend: z.number().optional().describe('Monthly spend/revenue'),
  },
  handler: async (params, { client, logger }) => {
    const { userID, companyID, companyName, monthlySpend } = params;

    validateRequired(userID, 'userID');

    logger.info('Linking user to company', { userID, companyName });

    // If we have company details but no ID, create company
    let finalCompanyID = companyID;
    if (!companyID && companyName) {
      const company = await client.createCompany({
        name: companyName,
        ...(monthlySpend !== undefined && { monthlySpend }),
      });
      finalCompanyID = company.id;
      logger.debug('Created company', { companyID: company.id });
    }

    // Update user with company
    await client.findOrCreateUser({
      userID,
      companies: [
        {
          id: finalCompanyID,
          ...(companyName && { name: companyName }),
          ...(monthlySpend !== undefined && { monthlySpend }),
        },
      ],
    });

    logger.info('User linked to company successfully');

    return { success: true };
  },
};
