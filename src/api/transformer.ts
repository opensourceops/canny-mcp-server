/**
 * Response transformation for token optimization
 * Reduces API responses by 70-90% while maintaining essential information
 */

import {
  CannyPost,
  CannyComment,
  CannyVote,
  CompactPost,
  CompactComment,
  CompactVote,
} from '../types/canny.js';

export class ResponseTransformer {
  /**
   * Transform full post to compact format
   * Reduces tokens by ~80%
   */
  static compactPost(post: CannyPost, fields?: string[]): CompactPost {
    const defaultFields = ['id', 'title', 'status', 'score', 'url'];
    const selectedFields = fields || defaultFields;

    const compact: CompactPost = {
      id: post.id,
      title: this.truncate(post.title, 100),
      status: post.status,
      score: post.score,
      url: post.url,
    };

    // Conditionally include fields based on selection
    if (selectedFields.includes('details') && post.details) {
      compact.details = this.stripHtml(post.details).slice(0, 200);
    }

    if (selectedFields.includes('author') && post.author) {
      compact.author = {
        id: post.author.id,
        name: post.author.name,
        email: post.author.email,
      };
    }

    if (selectedFields.includes('commentCount')) {
      compact.commentCount = post.commentCount;
    }

    if (selectedFields.includes('jira') && post.jira) {
      compact.jiraIssues = post.jira.map((j) => j.key);
    }

    if (selectedFields.includes('tags') && post.tags) {
      compact.tags = post.tags.map((t) => t.name);
    }

    return compact;
  }

  /**
   * Transform multiple posts
   */
  static compactPosts(posts: CannyPost[], fields?: string[]): CompactPost[] {
    return posts.map((post) => this.compactPost(post, fields));
  }

  /**
   * Transform full comment to compact format
   * Reduces tokens by ~70%
   */
  static compactComment(comment: CannyComment): CompactComment {
    return {
      id: comment.id,
      authorName: comment.author.name,
      value: this.stripHtml(this.truncate(comment.value, 200)),
      created: comment.created,
      internal: comment.internal,
    };
  }

  /**
   * Transform multiple comments
   */
  static compactComments(comments: CannyComment[]): CompactComment[] {
    return comments.map((comment) => this.compactComment(comment));
  }

  /**
   * Transform vote to compact format
   */
  static compactVote(vote: CannyVote): CompactVote {
    return {
      id: vote.id,
      voterName: vote.voter.name,
      voterEmail: vote.voter.email,
      created: vote.created,
    };
  }

  /**
   * Transform multiple votes
   */
  static compactVotes(votes: CannyVote[]): CompactVote[] {
    return votes.map((vote) => this.compactVote(vote));
  }

  /**
   * Strip HTML tags from content
   */
  static stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Truncate string to max length
   */
  static truncate(str: string, maxLength: number): string {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  }

  /**
   * Estimate token count (rough approximation)
   * ~4 characters per token
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
