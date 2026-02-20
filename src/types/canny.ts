/**
 * Canny API Type Definitions
 */

export interface CannyBoard {
  id: string;
  created: string;
  name: string;
  postCount: number;
  url: string;
  isPrivate: boolean;
}

export interface CannyUser {
  id: string;
  created: string;
  email: string;
  name: string;
  userID?: string;
  avatarURL?: string;
  companies?: CannyCompany[];
}

export interface CannyCompany {
  id: string;
  created: string;
  name: string;
  monthlySpend?: number;
  customFields?: Record<string, any>;
}

export interface CannyPost {
  id: string;
  author: CannyUser;
  board: CannyBoard;
  category?: CannyCategory;
  clickup?: unknown;
  commentCount: number;
  created: string;
  details: string;
  eta?: string;
  etaPublic: boolean;
  imageURLs: string[];
  jira?: { linkedIssues: CannyJiraIssue[] };
  owner?: CannyUser;
  score: number;
  status: string;
  statusChangedAt: string;
  tags: CannyTag[];
  title: string;
  url: string;
  customFields?: Record<string, any>;
}

export interface CannyComment {
  id: string;
  author: CannyUser;
  board: CannyBoard;
  created: string;
  imageURLs: string[];
  internal: boolean;
  likeCount: number;
  mentions: CannyUser[];
  parentID?: string;
  post: { id: string };
  value: string;
}

export interface CannyVote {
  id: string;
  board: CannyBoard;
  created: string;
  post: { id: string };
  voter: CannyUser;
}

export interface CannyTag {
  id: string;
  name: string;
  postCount: number;
  url: string;
}

export interface CannyCategory {
  id: string;
  name: string;
  parentID?: string;
  postCount: number;
  subcategories?: CannyCategory[];
  url: string;
}

export interface CannyJiraIssue {
  id: string;
  key: string;
  url: string;
}

/**
 * Minimal post shape returned by the internal Canny search endpoint.
 */
export interface InternalPost {
  id: string;
  _id: string;
  title: string;
  details: string;
  score: number;
  status: string;
  categoryID?: string;
  boardID?: string;
  commentCount?: number;
  [key: string]: unknown;
}

export interface CannyStatusChange {
  id: string;
  changeComment?: { value: string; imageURLs: string[] };
  changer: CannyUser;
  created: string;
  post: CannyPost;
  status: string;
}

export interface CannyChangelogEntry {
  id: string;
  created: string;
  labels: { id: string; name: string }[];
  lastSaved: string;
  markdownDetails: string;
  plaintextDetails: string;
  posts: CannyPost[];
  publishedAt?: string;
  reactions: Record<string, number>;
  scheduledFor?: string;
  status: string;
  title: string;
  types: string[];
  url: string;
}

export interface ListStatusChangesParams {
  boardID?: string;
  limit?: number;
  skip?: number;
}

export interface CreateChangelogEntryParams {
  title: string;
  details: string;
  type?: string;
  published?: boolean;
  publishedOn?: string;
  scheduledFor?: string;
  postIDs?: string[];
  labelIDs?: string[];
  notify?: boolean;
}

// Groups
export interface CannyGroup {
  id: string;
  name: string;
  description: string;
  urlName: string;
}

// Ideas
export interface CannyIdeaStatus {
  id: string;
  name: string;
  type: string;
  urlName: string;
}

export interface CannyIdea {
  id: string;
  childCount: number;
  author?: CannyUser;
  created: string;
  description: string;
  group?: CannyGroup;
  owner?: CannyUser;
  parent?: { id: string; title: string; urlName: string };
  source: { name: string; type: string };
  status: CannyIdeaStatus;
  title: string;
  updatedAt: string;
  urlName: string;
}

export interface IdeaFilter {
  resource: string;
  condition: string;
  value: { fieldID: string; value: unknown };
}

// Insights
export interface CannyInsight {
  id: string;
  author?: CannyUser;
  company?: { id: string; name: string; monthlySpend: number; urlName: string };
  created: string;
  ideaID: string;
  priority?: string;
  source: { name: string; type: string };
  url?: string;
  users: CannyUser[];
  value: string;
}

// Opportunities
export interface CannyOpportunity {
  id: string;
  closed: boolean;
  ideaIDs: string[];
  name: string;
  postIDs: string[];
  salesforceOpportunityID: string;
  value: number;
  won: boolean;
}

// Compact types for token optimization
export interface CompactPost {
  id: string;
  title: string;
  status: string;
  score: number;
  url: string;
  details?: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  authorName?: string; // Deprecated: use author instead
  commentCount?: number;
  jiraIssues?: string[];
  tags?: string[];
}

export interface CompactComment {
  id: string;
  authorName: string;
  value: string;
  created: string;
  internal: boolean;
}

export interface CompactVote {
  id: string;
  voterName: string;
  voterEmail: string;
  created: string;
}

// API Response types
export interface CannyListResponse<T> {
  hasMore: boolean;
  cursor?: string;
  skip?: number;
  total?: number;
  data: T[];
}

export interface CannySuccessResponse {
  success: boolean;
}

// API Request types
export interface ListPostsParams {
  boardID?: string;
  authorID?: string;
  companyID?: string;
  limit?: number;
  skip?: number;
  sort?: 'newest' | 'oldest' | 'relevance' | 'score' | 'statusChanged' | 'trending';
  status?: string;
  tagIDs?: string[];
  search?: string;
}

export interface CreatePostParams {
  authorID: string;
  boardID: string;
  byID?: string;
  categoryID?: string;
  customFields?: Record<string, any>;
  details?: string;
  eta?: string;
  etaPublic?: boolean;
  imageURLs?: string[];
  ownerID?: string;
  title: string;
}

export interface UpdatePostParams {
  postID: string;
  customFields?: Record<string, any>;
  details?: string;
  eta?: string;
  etaPublic?: boolean;
  imageURLs?: string[];
  title?: string;
}

export interface ChangePostStatusParams {
  postID: string;
  changerID: string;
  status: string;
  commentValue?: string;
  shouldNotifyVoters?: boolean;
}

export interface CreateCommentParams {
  authorID: string;
  postID: string;
  value: string;
  imageURLs?: string[];
  internal?: boolean;
  parentID?: string;
}

export interface CreateVoteParams {
  postID: string;
  voterID: string;
}

export interface FindOrCreateUserParams {
  email?: string;
  name?: string;
  userID?: string;
  avatarURL?: string;
  companies?: Array<{
    created?: string;
    id?: string;
    monthlySpend?: number;
    name?: string;
  }>;
  customFields?: Record<string, any>;
}
