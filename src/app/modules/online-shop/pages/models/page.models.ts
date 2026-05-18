export interface PageListItem {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  creationTime: string;
}

export interface PageTemplate {
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
}

export interface PageDetail {
  id?: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaImageUrl: string;
  isActive: boolean;
}
