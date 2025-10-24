/**
 * Company management tools
 */

import { MCPTool } from '../../types/mcp.js';
import { validateRequired } from '../../utils/validators.js';

export const listCompanies: MCPTool = {
  name: 'canny_list_companies',
  description: 'Get company data for segmentation',
  readOnly: true,
  toolset: 'users',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of companies to fetch',
      },
      skip: {
        type: 'number',
        description: 'Number of companies to skip',
      },
    },
    required: [],
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
  description: 'Associate users with companies for revenue tracking',
  readOnly: false,
  toolset: 'users',
  inputSchema: {
    type: 'object',
    properties: {
      userID: {
        type: 'string',
        description: 'User ID',
      },
      companyID: {
        type: 'string',
        description: 'Company ID',
      },
      companyName: {
        type: 'string',
        description: 'Company name',
      },
      monthlySpend: {
        type: 'number',
        description: 'Monthly spend/revenue',
      },
    },
    required: ['userID'],
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
