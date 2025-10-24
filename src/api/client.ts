/**
 * Canny API Client with retry logic and error handling
 */

import axios, { AxiosInstance } from 'axios';
import { CannyConfig } from '../types/config.js';
import { withRetry, mapHTTPError } from '../utils/errors.js';
import { Logger } from '../utils/logger.js';
import {
  CannyBoard,
  CannyPost,
  CannyComment,
  CannyVote,
  CannyTag,
  CannyCategory,
  CannyUser,
  CannyCompany,
  ListPostsParams,
  CreatePostParams,
  UpdatePostParams,
  ChangePostStatusParams,
  CreateCommentParams,
  CreateVoteParams,
  FindOrCreateUserParams,
} from '../types/canny.js';

export class CannyClient {
  private client: AxiosInstance;
  private apiKey: string;
  private logger: Logger;

  constructor(config: CannyConfig, logger: Logger) {
    this.apiKey = config.apiKey;
    this.logger = logger;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generic request method with retry logic
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    return withRetry(
      async () => {
        try {
          const response = await this.client.post(endpoint, {
            apiKey: this.apiKey,
            ...params,
          });

          this.logger.debug(`API request successful: ${endpoint}`, { params });
          return response.data;
        } catch (error: any) {
          this.logger.error(`API request failed: ${endpoint}`, {
            error: error.message,
            params,
          });
          throw mapHTTPError(error);
        }
      },
      3,
      1000
    );
  }

  // ===== Board Operations =====

  async listBoards(): Promise<CannyBoard[]> {
    const response = await this.request<{ boards: CannyBoard[] }>('boards/list');
    return response.boards;
  }

  async retrieveBoard(boardID: string): Promise<CannyBoard> {
    return this.request<CannyBoard>('boards/retrieve', { boardID });
  }

  // ===== Post Operations =====

  async listPosts(params: ListPostsParams): Promise<{
    posts: CannyPost[];
    hasMore: boolean;
    cursor?: string;
  }> {
    const response = await this.request<{
      posts: CannyPost[];
      hasMore: boolean;
      cursor?: string;
    }>('posts/list', params);

    return {
      posts: response.posts || [],
      hasMore: response.hasMore || false,
      cursor: response.cursor,
    };
  }

  async retrievePost(params: { id?: string; urlName?: string; boardID?: string }): Promise<CannyPost> {
    // Build request params based on what's provided
    const requestParams: any = {};

    if (params.id) {
      requestParams.id = params.id;
    } else if (params.urlName) {
      requestParams.urlName = params.urlName;
      if (params.boardID) {
        requestParams.boardID = params.boardID;
      }
    }

    return this.request<CannyPost>('posts/retrieve', requestParams);
  }

  async createPost(params: CreatePostParams): Promise<CannyPost> {
    return this.request<CannyPost>('posts/create', params);
  }

  async updatePost(params: UpdatePostParams): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('posts/update', params);
  }

  async changePostStatus(
    params: ChangePostStatusParams
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('posts/change_status', {
      postID: params.postID,
      changerID: params.changerID,
      status: params.status,
      ...(params.commentValue && { commentValue: params.commentValue }),
      ...(params.shouldNotifyVoters !== undefined && {
        shouldNotifyVoters: params.shouldNotifyVoters,
      }),
    });
  }

  async changePostCategory(
    postID: string,
    categoryID: string
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('posts/change_category', {
      postID,
      categoryID,
    });
  }

  async deletePost(postID: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('posts/delete', { postID });
  }

  // ===== Comment Operations =====

  async listComments(params: {
    postID?: string;
    boardID?: string;
    authorID?: string;
    companyID?: string;
    limit?: number;
    skip?: number;
  }): Promise<{
    comments: CannyComment[];
    hasMore: boolean;
  }> {
    const response = await this.request<{
      comments: CannyComment[];
      hasMore: boolean;
    }>('comments/list', params);

    return {
      comments: response.comments || [],
      hasMore: response.hasMore || false,
    };
  }

  async retrieveComment(commentID: string): Promise<CannyComment> {
    return this.request<CannyComment>('comments/retrieve', { commentID });
  }

  async createComment(params: CreateCommentParams): Promise<CannyComment> {
    return this.request<CannyComment>('comments/create', params);
  }

  async deleteComment(commentID: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('comments/delete', { commentID });
  }

  // ===== Vote Operations =====

  async listVotes(params: {
    postID?: string;
    boardID?: string;
    userID?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    votes: CannyVote[];
    hasMore: boolean;
    cursor?: string;
  }> {
    const response = await this.request<{
      votes: CannyVote[];
      hasMore: boolean;
      cursor?: string;
    }>('votes/list', params);

    return {
      votes: response.votes || [],
      hasMore: response.hasMore || false,
      cursor: response.cursor,
    };
  }

  async createVote(params: CreateVoteParams): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('votes/create', params);
  }

  async deleteVote(postID: string, voterID: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('votes/delete', { postID, voterID });
  }

  // ===== Tag Operations =====

  async listTags(boardID?: string): Promise<CannyTag[]> {
    const params = boardID ? { boardID } : {};
    const response = await this.request<{ tags: CannyTag[] }>('tags/list', params);
    return response.tags;
  }

  async retrieveTag(tagID: string): Promise<CannyTag> {
    return this.request<CannyTag>('tags/retrieve', { tagID });
  }

  // ===== Category Operations =====

  async listCategories(boardID: string): Promise<CannyCategory[]> {
    const response = await this.request<{ categories: CannyCategory[] }>(
      'categories/list',
      { boardID }
    );
    return response.categories;
  }

  async retrieveCategory(categoryID: string): Promise<CannyCategory> {
    return this.request<CannyCategory>('categories/retrieve', { categoryID });
  }

  async createCategory(
    boardID: string,
    name: string,
    subscribeAdmins: boolean,
    parentID?: string
  ): Promise<CannyCategory> {
    const params = { boardID, name, subscribeAdmins, ...(parentID && { parentID }) };
    return this.request<CannyCategory>('categories/create', params);
  }

  async deleteCategory(categoryID: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('categories/delete', { categoryID });
  }

  // ===== User Operations =====

  async findOrCreateUser(params: FindOrCreateUserParams): Promise<CannyUser> {
    return this.request<CannyUser>('users/find_or_create', params);
  }

  async retrieveUser(params: { id?: string; email?: string; userID?: string }): Promise<CannyUser> {
    return this.request<CannyUser>('users/retrieve', params);
  }

  async deleteUser(userID: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('users/delete', { userID });
  }

  // ===== Company Operations =====

  async listCompanies(params?: {
    limit?: number;
    skip?: number;
  }): Promise<{
    companies: CannyCompany[];
    hasMore: boolean;
  }> {
    const response = await this.request<{
      companies: CannyCompany[];
      hasMore: boolean;
    }>('companies/list', params || {});

    return {
      companies: response.companies || [],
      hasMore: response.hasMore || false,
    };
  }

  async createCompany(params: {
    name: string;
    created?: string;
    customFields?: Record<string, any>;
    monthlySpend?: number;
  }): Promise<CannyCompany> {
    return this.request<CannyCompany>('companies/create', params);
  }

  // ===== Jira Operations =====

  async linkJiraIssue(postID: string, issueKey: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('posts/link_jira', {
      postID,
      issueKey,
    });
  }

  async unlinkJiraIssue(
    postID: string,
    issueKey: string
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('posts/unlink_jira', {
      postID,
      issueKey,
    });
  }
}
