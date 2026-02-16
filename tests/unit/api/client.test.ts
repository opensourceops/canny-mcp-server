/**
 * Unit tests for Canny API Client
 */

import axios from 'axios';
import { CannyClient } from '../../../src/api/client';
import { Logger } from '../../../src/utils/logger';
import { CannyConfig } from '../../../src/types/config';
import {
  mockBoard,
  mockBoardsList,
  mockPost,
  mockPostsList,
  mockComment,
  mockCommentsList,
  mockVote,
  mockVotesList,
  mockTag,
  mockTagsList,
  mockCategory,
  mockCategoriesList,
  mockUser,
  mockCompany,
  mockCompaniesList,
  mockSuccessResponse,
} from '../../fixtures/canny-responses';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CannyClient', () => {
  let client: CannyClient;
  let mockLogger: Logger;
  let mockConfig: CannyConfig;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Setup mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    mockConfig = {
      apiKey: 'test-api-key',
      baseUrl: 'https://canny.io/api/v1',
      workspace: {
        name: 'Test',
        customStatuses: ['open', 'complete'],
        customFields: {},
        boards: {},
        tags: {},
      },
      prioritization: {
        framework: 'RICE',
        weights: { votes: 0.3, revenue: 0.4, strategicFit: 0.3 },
        highRevenueThreshold: 50000,
      },
      jira: {
        enabled: false,
      },
      defaults: {
        pagination: { limit: 10, maxTotal: 50 },
        compactMode: true,
        defaultFields: [],
        includeComments: false,
        commentLimit: 5,
      },
      cache: {
        enabled: true,
        ttl: { boards: 3600, tags: 3600, users: 86400, posts: 300, comments: 180 },
        maxSize: 100,
      },
      rateLimit: {
        requests: 100,
        window: 60000,
        retryAfter: 5000,
        maxRetries: 3,
      },
    };

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    client = new CannyClient(mockConfig, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Board Operations', () => {
    it('should list boards', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockBoardsList });

      const boards = await client.listBoards();

      expect(boards).toEqual(mockBoardsList.boards);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('boards/list', {
        apiKey: 'test-api-key',
      });
    });

    it('should retrieve board by ID', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockBoard });

      const board = await client.retrieveBoard('board123');

      expect(board).toEqual(mockBoard);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('boards/retrieve', {
        apiKey: 'test-api-key',
        boardID: 'board123',
      });
    });
  });

  describe('Post Operations', () => {
    it('should list posts', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockPostsList });

      const result = await client.listPosts({ boardID: 'board123' });

      expect(result.posts).toEqual(mockPostsList.posts);
      expect(result.hasMore).toBe(false);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('posts/list', {
        apiKey: 'test-api-key',
        boardID: 'board123',
      });
    });

    it('should list posts filtered by author', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockPostsList });

      const result = await client.listPosts({ boardID: 'board123', authorID: 'user123' });

      expect(result.posts).toEqual(mockPostsList.posts);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('posts/list', {
        apiKey: 'test-api-key',
        boardID: 'board123',
        authorID: 'user123',
      });
    });

    it('should list posts filtered by company', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockPostsList });

      const result = await client.listPosts({ companyID: 'company123' });

      expect(result.posts).toEqual(mockPostsList.posts);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('posts/list', {
        apiKey: 'test-api-key',
        companyID: 'company123',
      });
    });

    it('should list posts with relevance sort', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockPostsList });

      const result = await client.listPosts({ search: 'feature', sort: 'relevance' });

      expect(result.posts).toEqual(mockPostsList.posts);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('posts/list', {
        apiKey: 'test-api-key',
        search: 'feature',
        sort: 'relevance',
      });
    });

    it('should retrieve post by ID', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockPost });

      const post = await client.retrievePost({ id: 'post123' });

      expect(post).toEqual(mockPost);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('posts/retrieve', {
        apiKey: 'test-api-key',
        id: 'post123',
      });
    });

    it('should retrieve post by urlName', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockPost });

      const post = await client.retrievePost({ urlName: 'my-feature-request', boardID: 'board123' });

      expect(post).toEqual(mockPost);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('posts/retrieve', {
        apiKey: 'test-api-key',
        urlName: 'my-feature-request',
        boardID: 'board123',
      });
    });

    it('should create post', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockPost });

      const post = await client.createPost({
        authorID: 'user123',
        boardID: 'board123',
        title: 'New Feature',
        details: 'Description',
      });

      expect(post).toEqual(mockPost);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('posts/create', {
        apiKey: 'test-api-key',
        authorID: 'user123',
        boardID: 'board123',
        title: 'New Feature',
        details: 'Description',
      });
    });

    it('should update post', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.updatePost({
        postID: 'post123',
        title: 'Updated Title',
      });

      expect(result.success).toBe(true);
    });

    it('should change post status', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.changePostStatus({
        postID: 'post123',
        changerID: 'admin123',
        status: 'complete',
      });

      expect(result.success).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('posts/change_status', {
        apiKey: 'test-api-key',
        postID: 'post123',
        changerID: 'admin123',
        status: 'complete',
      });
    });

    it('should change post category', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.changePostCategory('post123', 'cat123');

      expect(result.success).toBe(true);
    });

    it('should delete post', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.deletePost('post123');

      expect(result.success).toBe(true);
    });
  });

  describe('Comment Operations', () => {
    it('should list comments', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockCommentsList });

      const result = await client.listComments({ postID: 'post123' });

      expect(result.comments).toEqual(mockCommentsList.comments);
      expect(result.hasMore).toBe(false);
    });

    it('should retrieve comment by ID', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockComment });

      const comment = await client.retrieveComment('comment123');

      expect(comment).toEqual(mockComment);
    });

    it('should create comment', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockComment });

      const comment = await client.createComment({
        authorID: 'user123',
        postID: 'post123',
        value: 'Great idea!',
      });

      expect(comment).toEqual(mockComment);
    });

    it('should delete comment', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.deleteComment('comment123');

      expect(result.success).toBe(true);
    });
  });

  describe('Vote Operations', () => {
    it('should list votes', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockVotesList });

      const result = await client.listVotes({ postID: 'post123' });

      expect(result.votes).toEqual(mockVotesList.votes);
      expect(result.hasMore).toBe(false);
    });

    it('should create vote', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.createVote({
        postID: 'post123',
        voterID: 'user123',
      });

      expect(result.success).toBe(true);
    });

    it('should delete vote', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.deleteVote('post123', 'user123');

      expect(result.success).toBe(true);
    });
  });

  describe('Tag Operations', () => {
    it('should list tags', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockTagsList });

      const result = await client.listTags();

      expect(result.tags).toEqual(mockTagsList.tags);
      expect(result.hasMore).toBe(false);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('tags/list', {
        apiKey: 'test-api-key',
        limit: 50,
        skip: 0,
      });
    });

    it('should list tags for specific board', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockTagsList });

      await client.listTags('board123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('tags/list', {
        apiKey: 'test-api-key',
        boardID: 'board123',
        limit: 50,
        skip: 0,
      });
    });

    it('should retrieve tag by ID', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockTag });

      const tag = await client.retrieveTag('tag123');

      expect(tag).toEqual(mockTag);
    });
  });

  describe('Category Operations', () => {
    it('should list categories', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockCategoriesList });

      const result = await client.listCategories('board123');

      expect(result.categories).toEqual(mockCategoriesList.categories);
      expect(result.hasMore).toBe(false);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('categories/list', {
        apiKey: 'test-api-key',
        boardID: 'board123',
        limit: 50,
        skip: 0,
      });
    });

    it('should retrieve category by ID', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockCategory });

      const category = await client.retrieveCategory('cat123');

      expect(category).toEqual(mockCategory);
    });

    it('should create category', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockCategory });

      const category = await client.createCategory('board123', 'Backend', true);

      expect(category).toEqual(mockCategory);
    });

    it('should create category with parent', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockCategory });

      await client.createCategory('board123', 'API', false, 'parent123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('categories/create', {
        apiKey: 'test-api-key',
        boardID: 'board123',
        name: 'API',
        subscribeAdmins: false,
        parentID: 'parent123',
      });
    });

    it('should delete category', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.deleteCategory('cat123');

      expect(result.success).toBe(true);
    });
  });

  describe('User Operations', () => {
    it('should find or create user', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockUser });

      const user = await client.findOrCreateUser({
        email: 'user@example.com',
        name: 'Test User',
      });

      expect(user).toEqual(mockUser);
    });

    it('should retrieve user by ID', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockUser });

      const user = await client.retrieveUser({ id: 'user123' });

      expect(user).toEqual(mockUser);
    });

    it('should delete user', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.deleteUser('user123');

      expect(result.success).toBe(true);
    });
  });

  describe('Company Operations', () => {
    it('should list companies', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockCompaniesList });

      const result = await client.listCompanies();

      expect(result.companies).toEqual(mockCompaniesList.companies);
      expect(result.hasMore).toBe(false);
    });

    it('should create company', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockCompany });

      const company = await client.createCompany({
        name: 'Test Company',
      });

      expect(company).toEqual(mockCompany);
    });
  });

  describe('Jira Operations', () => {
    it('should link Jira issue', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.linkJiraIssue('post123', 'PROJ-123');

      expect(result.success).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('posts/link_jira', {
        apiKey: 'test-api-key',
        postID: 'post123',
        issueKey: 'PROJ-123',
      });
    });

    it('should unlink Jira issue', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await client.unlinkJiraIssue('post123', 'PROJ-123');

      expect(result.success).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('posts/unlink_jira', {
        apiKey: 'test-api-key',
        postID: 'post123',
        issueKey: 'PROJ-123',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = {
        response: {
          status: 401,
          data: { error: 'Invalid API key' },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(client.listBoards()).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should retry on server errors', async () => {
      const serverError = {
        response: { status: 500 },
      };

      mockAxiosInstance.post
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue({ data: mockBoardsList });

      const boards = await client.listBoards();

      expect(boards).toEqual(mockBoardsList.boards);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });
});
