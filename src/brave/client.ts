/**
 * Brave Search API Client
 * Tìm kiếm video YouTube và bài báo qua Brave Search API
 *
 * Đăng ký API key tại: https://brave.com/search/api/
 */

export interface BraveVideoResult {
  title: string;
  url: string;
  channel: string;
  views: number | null;
  duration: string | null;
  published: string | null;
  thumbnail: string | null;
  description: string | null;
}

export interface BraveNewsResult {
  title: string;
  url: string;
  source: string;
  published: string | null;
  description: string | null;
  thumbnail: string | null;
}

export interface BraveSearchOptions {
  query: string;
  count?: number; // max 20
  freshness?: "pd" | "pw" | "pm" | "py"; // past day/week/month/year
  country?: string;
  search_lang?: string;
}

const BRAVE_API_BASE = "https://api.search.brave.com/res/v1";

function getBraveApiKey(): string {
  const key = process.env.BRAVE_API_KEY;
  if (!key) {
    throw new Error(
      "BRAVE_API_KEY chưa được cấu hình. " +
        "Lấy API key miễn phí tại: https://brave.com/search/api/ " +
        "rồi thêm vào .env: BRAVE_API_KEY=your_key_here"
    );
  }
  return key;
}

/**
 * Tìm kiếm video YouTube qua Brave Search
 */
export async function braveSearchVideos(
  options: BraveSearchOptions
): Promise<BraveVideoResult[]> {
  const apiKey = getBraveApiKey();

  const params = new URLSearchParams({
    q: `${options.query} site:youtube.com`,
    count: String(Math.min(options.count ?? 10, 20)),
    ...(options.freshness && { freshness: options.freshness }),
    ...(options.country && { country: options.country }),
    ...(options.search_lang && { search_lang: options.search_lang }),
  });

  const response = await fetch(`${BRAVE_API_BASE}/videos/search?${params}`, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brave Search API lỗi ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      meta_url?: { hostname?: string };
      video?: {
        views?: number;
        duration?: string;
        creator?: string;
      };
      age?: string;
      thumbnail?: { src?: string };
      description?: string;
    }>;
  };

  return (data.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    channel: r.video?.creator ?? r.meta_url?.hostname ?? "",
    views: r.video?.views ?? null,
    duration: r.video?.duration ?? null,
    published: r.age ?? null,
    thumbnail: r.thumbnail?.src ?? null,
    description: r.description ?? null,
  }));
}

/**
 * Tìm kiếm tin tức / bài báo qua Brave Search
 */
export async function braveSearchNews(
  options: BraveSearchOptions
): Promise<BraveNewsResult[]> {
  const apiKey = getBraveApiKey();

  const params = new URLSearchParams({
    q: options.query,
    count: String(Math.min(options.count ?? 10, 20)),
    ...(options.freshness && { freshness: options.freshness }),
    ...(options.country && { country: options.country }),
    ...(options.search_lang && { search_lang: options.search_lang }),
  });

  const response = await fetch(`${BRAVE_API_BASE}/news/search?${params}`, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brave Search API lỗi ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      meta_url?: { hostname?: string };
      age?: string;
      thumbnail?: { src?: string };
      description?: string;
    }>;
  };

  return (data.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    source: r.meta_url?.hostname ?? "",
    published: r.age ?? null,
    thumbnail: r.thumbnail?.src ?? null,
    description: r.description ?? null,
  }));
}
