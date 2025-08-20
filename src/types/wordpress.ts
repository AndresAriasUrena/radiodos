export interface WordPressPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  modified?: string;
  author: number;
  tags?: number[];
  _embedded?: {
    author?: Array<{ name: string }>;
    'wp:featuredmedia'?: Array<{ source_url: string }>;
    'wp:term'?: Array<Array<{ id: number; name: string; slug: string; taxonomy: string }>>;
  };
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
}

export interface WordPressTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
}

export interface FilterItem {
  label: string;
  count: number;
  slug: string;
}

export interface FilterData {
  categories: string[];
}

export interface PostsResponse {
  posts: WordPressPost[];
  totalPages: number;
  totalItems: number;
  currentPage: number;
}

export interface CategoriesResponse {
  categories: WordPressCategory[];
  categoriesMap: { [slug: string]: number };
}

export interface TagsResponse {
  tags: WordPressTag[];
  tagsMap: { [slug: string]: number };
}

export interface GetPostsOptions {
  page?: number;
  perPage?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
  orderBy?: 'date' | 'title-asc' | 'title-desc';
  order?: 'asc' | 'desc';
  exclude?: number[];
  include?: number[];
} 