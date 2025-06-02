export interface IReviewMedia {
  id: number;
  url: string;
  thumbnail?: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
}

export interface IReviewUser {
  id: number;
  username: string;
  avatar?: {
    id: number;
    url: string;
  };
}

export interface IReviewVariant {
  color?: string;
  size?: string;
  [key: string]: string | undefined;
}

export interface IReview {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: IReviewUser;
  media: IReviewMedia[];
  variant?: IReviewVariant;
  helpfulCount?: number;
  notHelpfulCount?: number;
  userHelpfulVote?: 'helpful' | 'not_helpful' | null;
}

export interface IReviewStats {
  averageRating: number;
  reviewCount: number;
  ratingDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface IReviewPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface IReviewsResponse {
  reviews: IReview[];
  stats: IReviewStats;
  pagination: IReviewPagination;
} 