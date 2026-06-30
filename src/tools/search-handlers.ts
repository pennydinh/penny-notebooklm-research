/**
 * Handlers cho Brave Search + Apify tools
 */

import { braveSearchVideos, braveSearchNews } from "../brave/client.js";
import { apifyScrapeYoutube } from "../apify/client.js";
import type { ToolHandlers } from "./handlers.js";

export interface SearchHandlerDeps {
  toolHandlers: ToolHandlers;
}

export async function handleBraveSearchVideos(args: {
  query: string;
  count?: number;
  freshness?: "pd" | "pw" | "pm" | "py";
  min_views?: number;
  country?: string;
}) {
  const results = await braveSearchVideos({
    query: args.query,
    count: args.count ?? 10,
    freshness: args.freshness ?? "pm",
    country: args.country ?? "us",
  });

  // Filter theo min_views nếu có
  const filtered =
    args.min_views && args.min_views > 0
      ? results.filter((v) => (v.views ?? 0) >= (args.min_views ?? 0))
      : results;

  return {
    success: true,
    query: args.query,
    total: filtered.length,
    results: filtered,
    next_step:
      filtered.length > 0
        ? `Dùng add_source(type='url', content=url) để add từng video vào NotebookLM, rồi ask_question để phân tích.`
        : "Không tìm thấy kết quả phù hợp. Thử thay đổi query hoặc giảm min_views.",
  };
}

export async function handleBraveSearchNews(args: {
  query: string;
  count?: number;
  freshness?: "pd" | "pw" | "pm" | "py";
  country?: string;
}) {
  const results = await braveSearchNews({
    query: args.query,
    count: args.count ?? 10,
    freshness: args.freshness ?? "pm",
    country: args.country ?? "us",
  });

  return {
    success: true,
    query: args.query,
    total: results.length,
    results,
    next_step:
      results.length > 0
        ? `Add articles làm sources bổ sung: add_source(type='url', content=url). Kết hợp với video sources để source mixing.`
        : "Không tìm thấy tin tức phù hợp.",
  };
}

export async function handleApifyScrapeYoutube(args: {
  search_query?: string;
  channel_url?: string;
  max_results?: number;
  min_views?: number;
  published_after?: string;
}) {
  if (!args.search_query && !args.channel_url) {
    return {
      success: false,
      error: "Cần cung cấp search_query hoặc channel_url",
    };
  }

  const results = await apifyScrapeYoutube({
    search_query: args.search_query,
    channel_url: args.channel_url,
    max_results: args.max_results ?? 20,
    min_views: args.min_views ?? 0,
    published_after: args.published_after,
  });

  return {
    success: true,
    total: results.length,
    results: results.map((v) => ({
      title: v.title,
      url: v.url,
      channel: v.channel,
      views: v.views.toLocaleString(),
      publishedAt: v.publishedAt,
      duration: v.duration,
      tags: v.tags.slice(0, 5),
      hasTranscript: !!v.transcript,
    })),
    next_step: `Chọn video muốn phân tích rồi dùng add_source(type='url', content=url) để add vào NotebookLM.`,
  };
}

export async function handleResearchWorkflow(
  args: {
    topic: string;
    min_views?: number;
    freshness?: "pd" | "pw" | "pm" | "py";
    notebook_url?: string;
    include_news?: boolean;
  },
  toolHandlers: ToolHandlers
) {
  const steps: string[] = [];
  const addedUrls: string[] = [];

  steps.push(`🔍 Bắt đầu nghiên cứu chủ đề: "${args.topic}"`);

  // Step 1: Tìm video qua Brave Search
  steps.push("📹 Tìm video YouTube viral...");
  let videoResults: Awaited<ReturnType<typeof braveSearchVideos>> = [];
  try {
    videoResults = await braveSearchVideos({
      query: args.topic,
      count: 15,
      freshness: args.freshness ?? "pm",
      country: "us",
    });

    const filtered =
      args.min_views && args.min_views > 0
        ? videoResults.filter((v) => (v.views ?? 0) >= (args.min_views ?? 0))
        : videoResults;

    steps.push(`✅ Tìm được ${filtered.length} video phù hợp (lọc từ ${videoResults.length})`);
    videoResults = filtered.slice(0, 5); // Lấy top 5
  } catch (e) {
    steps.push(`⚠️ Brave Search lỗi: ${e}. Bỏ qua bước này.`);
  }

  // Step 2: Add video sources vào NotebookLM
  if (videoResults.length > 0 && args.notebook_url) {
    steps.push("📥 Add video sources vào NotebookLM...");
    for (const video of videoResults) {
      try {
        await toolHandlers.handleAddSource({
          type: "url",
          content: video.url,
          title: video.title,
          notebook_url: args.notebook_url,
        });
        addedUrls.push(video.url);
        steps.push(`  ✅ ${video.title.substring(0, 60)}...`);
      } catch (e) {
        steps.push(`  ⚠️ Không add được: ${video.url}`);
      }
    }
  }

  // Step 3: Add news sources (source mixing)
  if (args.include_news !== false && args.notebook_url) {
    steps.push("📰 Thêm news articles (source mixing)...");
    try {
      const newsResults = await braveSearchNews({
        query: args.topic,
        count: 5,
        freshness: args.freshness ?? "pm",
      });

      for (const news of newsResults.slice(0, 3)) {
        try {
          await toolHandlers.handleAddSource({
            type: "url",
            content: news.url,
            title: news.title,
            notebook_url: args.notebook_url,
          });
          addedUrls.push(news.url);
        } catch {
          // ignore
        }
      }
      steps.push(`✅ Thêm ${Math.min(3, newsResults.length)} news articles`);
    } catch (e) {
      steps.push(`⚠️ News search lỗi: ${e}`);
    }
  }

  // Step 4: Phân tích qua NotebookLM
  let analysis = null;
  if (args.notebook_url && addedUrls.length > 0) {
    steps.push("🤖 Đang phân tích qua NotebookLM/Gemini...");
    try {
      const result = await toolHandlers.handleAskQuestion({
        question: `Hãy phân tích các nguồn vừa được thêm về chủ đề "${args.topic}" và cho tôi:
1. **Xu hướng nổi bật** (top 3 trend đang được quan tâm)
2. **Từ khóa hot** (keywords xuất hiện nhiều)
3. **Pattern thumbnail** (màu sắc, style, text pattern phổ biến)
4. **Hook style** (cách mở đầu video hiệu quả)
5. **5 ý tưởng video** cho kênh YouTube về chủ đề này

Format: Rõ ràng, có số thứ tự, actionable.`,
        notebook_url: args.notebook_url,
        source_format: "footnotes",
      });
      analysis = result;
      steps.push("✅ Phân tích xong!");
    } catch (e) {
      steps.push(`⚠️ Phân tích lỗi: ${e}`);
    }
  }

  return {
    success: true,
    topic: args.topic,
    steps,
    sources_added: addedUrls.length,
    video_sources: videoResults.map((v) => ({ title: v.title, url: v.url, views: v.views })),
    analysis,
    next_step: analysis
      ? "Chọn 1 trong 5 ý tưởng ở trên và hỏi: 'Viết script chi tiết 1000 từ cho ý tưởng số [X]'"
      : args.notebook_url
        ? "Đã add sources nhưng phân tích thất bại. Thử dùng ask_question trực tiếp."
        : "⚠️ Chưa có notebook_url. Tạo notebook tại notebooklm.google.com và share link, rồi chạy lại.",
  };
}
