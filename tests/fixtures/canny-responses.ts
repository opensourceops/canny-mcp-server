/**
 * Mock Canny API responses for testing
 */

export const mockBoard = {
  id: 'board123',
  created: '2023-01-01T00:00:00.000Z',
  name: 'Feature Requests',
  postCount: 42,
  url: 'https://ideas.example.com/feature-requests',
};

export const mockPost = {
  id: 'post123',
  author: {
    id: 'user123',
    created: '2023-01-01T00:00:00.000Z',
    email: 'user@example.com',
    isAdmin: false,
    name: 'Test User',
    url: 'https://ideas.example.com/admin/user/user123',
  },
  board: mockBoard,
  by: null,
  category: null,
  commentCount: 5,
  created: '2023-06-01T00:00:00.000Z',
  details: 'This is a test feature request',
  eta: null,
  imageURLs: [],
  jira: null,
  mergeHistory: [],
  score: 15,
  status: 'open',
  tags: [],
  title: 'Test Feature Request',
  url: 'https://ideas.example.com/admin/board/feature-requests/p/test-feature-request',
  votes: 10,
};

export const mockComment = {
  id: 'comment123',
  author: {
    id: 'user123',
    created: '2023-01-01T00:00:00.000Z',
    email: 'user@example.com',
    isAdmin: false,
    name: 'Test User',
  },
  board: mockBoard,
  created: '2023-06-02T00:00:00.000Z',
  imageURLs: [],
  internal: false,
  likeCount: 3,
  post: {
    id: 'post123',
    title: 'Test Feature Request',
  },
  value: 'This is a great idea!',
};

export const mockVote = {
  id: 'vote123',
  board: mockBoard,
  created: '2023-06-01T00:00:00.000Z',
  post: {
    id: 'post123',
    title: 'Test Feature Request',
  },
  voter: {
    id: 'user123',
    created: '2023-01-01T00:00:00.000Z',
    email: 'user@example.com',
    isAdmin: false,
    name: 'Test User',
  },
  zendeskTicket: null,
};

export const mockTag = {
  id: 'tag123',
  board: mockBoard,
  created: '2023-01-01T00:00:00.000Z',
  name: 'bug',
  postCount: 15,
  url: 'https://ideas.example.com/admin/board/feature-requests/tag/bug',
};

export const mockCategory = {
  id: 'cat123',
  board: mockBoard,
  created: '2023-01-01T00:00:00.000Z',
  name: 'Backend',
  parentID: null,
  postCount: 25,
  url: 'https://ideas.example.com/admin/board/feature-requests/category/backend',
};

export const mockUser = {
  id: 'user123',
  created: '2023-01-01T00:00:00.000Z',
  email: 'user@example.com',
  isAdmin: false,
  name: 'Test User',
  url: 'https://ideas.example.com/admin/user/user123',
  userID: 'external-user-id',
};

export const mockCompany = {
  id: 'company123',
  created: '2023-01-01T00:00:00.000Z',
  customFields: {
    industry: 'Technology',
    size: '50-100',
  },
  monthlySpend: 5000,
  name: 'Test Company',
};

export const mockPostsList = {
  posts: [mockPost],
  hasMore: false,
};

export const mockBoardsList = {
  boards: [mockBoard],
};

export const mockCommentsList = {
  comments: [mockComment],
  hasMore: false,
};

export const mockVotesList = {
  votes: [mockVote],
  hasMore: false,
  cursor: null,
};

export const mockTagsList = {
  tags: [mockTag],
};

export const mockCategoriesList = {
  categories: [mockCategory],
};

export const mockCompaniesList = {
  companies: [mockCompany],
  hasMore: false,
};

export const mockSuccessResponse = {
  success: true,
};

export const mockErrorResponse = {
  error: 'Invalid API key',
};
