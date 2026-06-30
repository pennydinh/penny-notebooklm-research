/**
 * Tool definitions cho Brave Search + Apify scraping
 * Thêm vào luồng: tìm video → add vào NotebookLM → phân tích → gợi ý
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const braveSearchVideosTool: Tool = {
  name: "brave_search_videos",
  description:
    "Tìm kiếm video YouTube theo chủ đề qua Brave Search API. " +
    "Trả về danh sách URL, tiêu đề, lượt xem, kênh — sẵn sàng add vào NotebookLM bằng add_source.\n\n" +
    "Luồng điển hình:\n" +
    "  1. brave_search_videos(query='AI agent tutorial', freshness='pm', min_views=100000)\n" +
    "  2. Lọc kết quả theo views\n" +
    "  3. add_source(type='url', content=url) cho từng video muốn phân tích\n" +
    "  4. ask_question('Phân tích trend, keywords, gợi ý video ideas')",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Từ khóa tìm kiếm, ví dụ: 'AI agent tutorial', 'AI automation 2025'",
      },
      count: {
        type: "number",
        description: "Số kết quả trả về (tối đa 20, mặc định 10)",
        default: 10,
      },
      freshness: {
        type: "string",
        enum: ["pd", "pw", "pm", "py"],
        description:
          "Lọc theo thời gian: pd=24 giờ qua, pw=tuần qua, pm=tháng qua (khuyến nghị), py=năm qua",
        default: "pm",
      },
      min_views: {
        type: "number",
        description: "Lọc video có lượt xem tối thiểu (ví dụ: 100000 cho >100k views). Lưu ý: Brave API không luôn trả về số views.",
        default: 0,
      },
      country: {
        type: "string",
        description: "Quốc gia tìm kiếm, ví dụ: 'us', 'vn'. Mặc định: 'us'",
        default: "us",
      },
    },
    required: ["query"],
  },
  annotations: {
    title: "Tìm video YouTube qua Brave Search",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export const braveSearchNewsTool: Tool = {
  name: "brave_search_news",
  description:
    "Tìm kiếm tin tức / bài báo theo chủ đề qua Brave Search API. " +
    "Dùng để lấy sources bổ sung cho NotebookLM (facts từ articles + style từ viral videos).\n\n" +
    "Kết hợp với brave_search_videos để source mixing:\n" +
    "  - Video viral → học style, hook, cấu trúc\n" +
    "  - News articles → lấy facts, số liệu, góc nhìn mới",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Từ khóa tìm kiếm tin tức",
      },
      count: {
        type: "number",
        description: "Số kết quả (tối đa 20, mặc định 10)",
        default: 10,
      },
      freshness: {
        type: "string",
        enum: ["pd", "pw", "pm", "py"],
        description: "pd=24h, pw=tuần, pm=tháng, py=năm",
        default: "pm",
      },
      country: {
        type: "string",
        description: "Quốc gia, ví dụ: 'us', 'vn'",
        default: "us",
      },
    },
    required: ["query"],
  },
  annotations: {
    title: "Tìm tin tức qua Brave Search",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export const apifyScrapeYoutubeTool: Tool = {
  name: "apify_scrape_youtube",
  description:
    "Scrape dữ liệu chi tiết từ YouTube channel hoặc danh sách video bằng Apify. " +
    "Lấy được: view count, like count, comment count, full description, tags, transcript.\n\n" +
    "Dùng khi cần dữ liệu chính xác hơn Brave Search (views thực tế, filter >100k).\n\n" +
    "⚠️ Yêu cầu APIFY_TOKEN. Đăng ký tại: https://www.apify.com?fpr=get-api\n\n" +
    "Luồng:\n" +
    "  1. apify_scrape_youtube(channel_url hoặc search_query, min_views=100000)\n" +
    "  2. add_source(url) cho các video phù hợp\n" +
    "  3. ask_question('Phân tích và gợi ý ideas')",
  inputSchema: {
    type: "object",
    properties: {
      search_query: {
        type: "string",
        description: "Từ khóa tìm trên YouTube, ví dụ: 'AI agent 2025'",
      },
      channel_url: {
        type: "string",
        description: "URL YouTube channel muốn phân tích, ví dụ: https://youtube.com/@channelname",
      },
      max_results: {
        type: "number",
        description: "Số video tối đa (mặc định 20)",
        default: 20,
      },
      min_views: {
        type: "number",
        description: "Lọc video có views tối thiểu",
        default: 0,
      },
      published_after: {
        type: "string",
        description: "Chỉ lấy video sau ngày này, format: YYYY-MM-DD",
      },
    },
  },
  annotations: {
    title: "Scrape YouTube qua Apify",
    readOnlyHint: true,
    openWorldHint: true,
  },
};

export const researchWorkflowTool: Tool = {
  name: "research_workflow",
  description:
    "Chạy toàn bộ luồng nghiên cứu YouTube trong một lệnh:\n" +
    "  1. Tìm video viral theo chủ đề (Brave Search + Apify)\n" +
    "  2. Add URLs vào NotebookLM\n" +
    "  3. Phân tích: trend, keywords, thumbnail pattern\n" +
    "  4. Gợi ý 5 ideas cho video tiếp theo\n\n" +
    "Đây là tool tổng hợp — dùng khi muốn kết quả nhanh, không cần điều chỉnh từng bước.",
  inputSchema: {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description: "Chủ đề nghiên cứu, ví dụ: 'AI agent', 'affiliate marketing', 'growth hacking'",
      },
      min_views: {
        type: "number",
        description: "Views tối thiểu để lọc video (mặc định 100000 = 100k)",
        default: 100000,
      },
      freshness: {
        type: "string",
        enum: ["pd", "pw", "pm", "py"],
        description: "Khoảng thời gian: pm=1 tháng gần đây (khuyến nghị)",
        default: "pm",
      },
      notebook_url: {
        type: "string",
        description: "URL NotebookLM notebook để add sources vào. Nếu không có sẽ yêu cầu tạo mới.",
      },
      include_news: {
        type: "boolean",
        description: "Thêm news articles làm sources bổ sung (source mixing technique)",
        default: true,
      },
    },
    required: ["topic"],
  },
  annotations: {
    title: "Chạy toàn bộ luồng nghiên cứu YouTube",
    readOnlyHint: false,
    openWorldHint: true,
  },
};

export const searchTools: Tool[] = [
  braveSearchVideosTool,
  braveSearchNewsTool,
  apifyScrapeYoutubeTool,
  researchWorkflowTool,
];
