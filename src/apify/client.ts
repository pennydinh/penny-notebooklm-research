/**
 * Apify API Client — Scrape YouTube data chính xác
 *
 * Dùng Apify YouTube Scraper Actor để lấy:
 * - View count thực tế (lọc >100k chính xác)
 * - Full transcript
 * - Tags, description, like count
 *
 * Đăng ký Apify (có free tier): https://www.apify.com?fpr=get-api
 */

export interface ApifyVideoResult {
  title: string;
  url: string;
  videoId: string;
  channel: string;
  channelUrl: string;
  views: number;
  likes: number | null;
  comments: number | null;
  duration: string | null;
  publishedAt: string | null;
  description: string | null;
  tags: string[];
  thumbnail: string | null;
  transcript: string | null;
}

export interface ApifyScrapeOptions {
  search_query?: string;
  channel_url?: string;
  video_urls?: string[];
  max_results?: number;
  min_views?: number;
  published_after?: string; // YYYY-MM-DD
}

const APIFY_API_BASE = "https://api.apify.com/v2";
// YouTube Scraper Actor ID (official Apify actor)
const YOUTUBE_SCRAPER_ACTOR = "bernardo/youtube-scraper";

function getApifyToken(): string {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error(
      "APIFY_TOKEN chưa được cấu hình.\n" +
        "1. Đăng ký miễn phí tại: https://www.apify.com?fpr=get-api\n" +
        "2. Vào Settings → Integrations → API token\n" +
        "3. Thêm vào .env: APIFY_TOKEN=apify_api_xxxxxx"
    );
  }
  return token;
}

/**
 * Chạy Apify actor và chờ kết quả
 */
async function runApifyActor(
  actorId: string,
  input: Record<string, unknown>,
  timeoutSecs = 120
): Promise<unknown[]> {
  const token = getApifyToken();

  // Start actor run
  const startRes = await fetch(
    `${APIFY_API_BASE}/acts/${actorId}/runs?token=${token}&timeout=${timeoutSecs}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!startRes.ok) {
    const text = await startRes.text();
    throw new Error(`Apify actor start lỗi ${startRes.status}: ${text}`);
  }

  const runData = (await startRes.json()) as { data: { id: string; defaultDatasetId: string } };
  const runId = runData.data.id;
  const datasetId = runData.data.defaultDatasetId;

  // Poll cho đến khi xong
  const maxWait = timeoutSecs * 1000;
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    await new Promise((r) => setTimeout(r, 3000));

    const statusRes = await fetch(
      `${APIFY_API_BASE}/actor-runs/${runId}?token=${token}`
    );
    const statusData = (await statusRes.json()) as {
      data: { status: string; finishedAt: string | null };
    };

    if (statusData.data.status === "SUCCEEDED") {
      // Lấy kết quả từ dataset
      const dataRes = await fetch(
        `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${token}&limit=100`
      );
      const items = (await dataRes.json()) as unknown[];
      return items;
    }

    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(statusData.data.status)) {
      throw new Error(`Apify run ${statusData.data.status}: run ID ${runId}`);
    }
  }

  throw new Error(`Apify run timeout sau ${timeoutSecs}s. Run ID: ${runId}`);
}

/**
 * Scrape YouTube videos theo search query hoặc channel
 */
export async function apifyScrapeYoutube(
  options: ApifyScrapeOptions
): Promise<ApifyVideoResult[]> {
  const input: Record<string, unknown> = {
    maxResults: options.max_results ?? 20,
    ...(options.search_query && { searchKeywords: options.search_query }),
    ...(options.channel_url && { startUrls: [{ url: options.channel_url }] }),
    ...(options.video_urls && {
      startUrls: options.video_urls.map((url) => ({ url })),
    }),
  };

  const rawItems = (await runApifyActor(YOUTUBE_SCRAPER_ACTOR, input, 180)) as Array<{
    title?: string;
    url?: string;
    id?: string;
    channelName?: string;
    channelUrl?: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    duration?: string;
    date?: string;
    text?: string;
    hashtags?: string[];
    thumbnailUrl?: string;
    subtitles?: Array<{ text?: string }>;
  }>;

  let results: ApifyVideoResult[] = rawItems.map((item) => ({
    title: item.title ?? "",
    url: item.url ?? "",
    videoId: item.id ?? "",
    channel: item.channelName ?? "",
    channelUrl: item.channelUrl ?? "",
    views: item.viewCount ?? 0,
    likes: item.likeCount ?? null,
    comments: item.commentCount ?? null,
    duration: item.duration ?? null,
    publishedAt: item.date ?? null,
    description: item.text ?? null,
    tags: item.hashtags ?? [],
    thumbnail: item.thumbnailUrl ?? null,
    transcript: item.subtitles?.map((s) => s.text ?? "").join(" ") ?? null,
  }));

  // Filter theo min_views
  if (options.min_views && options.min_views > 0) {
    results = results.filter((v) => v.views >= (options.min_views ?? 0));
  }

  // Filter theo published_after
  if (options.published_after) {
    const cutoff = new Date(options.published_after).getTime();
    results = results.filter((v) => {
      if (!v.publishedAt) return true;
      return new Date(v.publishedAt).getTime() >= cutoff;
    });
  }

  // Sort by views desc
  results.sort((a, b) => b.views - a.views);

  return results;
}
