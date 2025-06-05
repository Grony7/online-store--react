export interface IPromotion {
  id: number;
  title: string;
  slug: string;
  preview_text?: string;
  preview_image: string;
  start_date?: string;
  end_date?: string;
  active: boolean;
  publishedAt?: string;
}

export interface IPromotionDetail extends IPromotion {
  content?: string;
  status?: string;
} 