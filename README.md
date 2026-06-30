# 🔬 Penny NotebookLM Research

> MCP server cho Google NotebookLM — tích hợp Brave Search & Apify để nghiên cứu YouTube tự động.  
> Dùng với **Claude Code** hoặc chạy độc lập qua **localhost web UI**.

---

## Nó giúp gì?

Bạn muốn làm YouTube content nhưng tốn quá nhiều thời gian research? Tool này giải quyết bằng cách tự động hóa toàn bộ luồng:

```
Bạn nhập chủ đề (ví dụ: "AI agent")
         ↓
Tool tìm video viral >100k views trong 1 tháng qua (Brave Search)
         ↓
Tự động add URLs vào Google NotebookLM
         ↓
Gemini đọc transcript, phân tích trend & pattern
         ↓
Nhận lại: keywords hot, thumbnail style, 5 ý tưởng video
         ↓
Chọn 1 ý tưởng → nhận script hoàn chỉnh
```

**Giải quyết vấn đề gì:**
- Không còn ngồi tìm video thủ công hàng giờ
- Phân tích dựa trên dữ liệu thật (transcript từ video thật), không hallucinate
- Script có citations — mọi claim đều có nguồn gốc
- Lặp lại được: đổi niche, chạy lại, ra kết quả mới ngay

---

## Yêu cầu

- **Node.js** ≥ 18
- **Chrome** (stable)
- **Google account riêng** (không dùng tài khoản chính) cho NotebookLM
- **Brave Search API key** — [Đăng ký miễn phí](https://brave.com/search/api/) (2,000 queries/tháng)
- *(Tùy chọn)* **Apify token** — [Đăng ký](https://www.apify.com?fpr=get-api) để scrape chi tiết hơn ($5 credit miễn phí/tháng)

---

## Cài đặt nhanh

### Cách 1 — Dùng với Claude Code (MCP)

```bash
# Clone repo
git clone https://github.com/mp1391004/penny-notebooklm-research
cd penny-notebooklm-research

# Cài dependencies
npm install

# Cấu hình API keys
cp .env.example .env
# Mở .env và điền BRAVE_API_KEY

# Build
npm run build

# Add vào Claude Code
claude mcp add penny-research -- node /đường/dẫn/tới/dist/index.js
```

Sau đó trong Claude Code gõ lệnh đầu tiên:
```
setup_auth
```

### Cách 2 — Chạy localhost Web UI (không cần Claude Code)

```bash
# Sau khi đã cài ở trên
node dist/web/server.js

# Mở trình duyệt: http://localhost:3333
```

---

## Luồng sử dụng đầy đủ

### Với Claude Code

**Bước 1 — Đăng nhập Google (làm 1 lần)**
```
setup_auth
```
Chrome mở ra → đăng nhập Google account → cookies lưu lại tự động.

**Bước 2 — Tìm video viral**
```
brave_search_videos(query="AI agent 2025", freshness="pm", min_views=100000)
```

**Bước 3 — Tạo notebook & add sources**

Tạo notebook mới tại [notebooklm.google.com](https://notebooklm.google.com) → Share → "Anyone with the link" → copy URL.

```
add_source(type="url", content="https://youtube.com/watch?v=...", notebook_url="https://notebooklm.google.com/notebook/...")
```
Lặp lại cho 3-5 video.

**Bước 4 — Phân tích**
```
ask_question(
  question="Phân tích trend, keywords, thumbnail pattern. Gợi ý 5 ý tưởng video.",
  notebook_url="...",
  source_format="footnotes"
)
```

**Bước 5 — Chọn idea & viết script**
```
ask_question(question="Viết script 1000 từ cho ý tưởng số 2. Bao gồm hook, body, CTA.")
```

**Hoặc chạy toàn bộ trong 1 lệnh:**
```
research_workflow(topic="AI agent", min_views=100000, freshness="pm", notebook_url="...", include_news=true)
```

---

## Công cụ có sẵn

| Tool | Mô tả |
|------|-------|
| `brave_search_videos` | Tìm video YouTube viral theo chủ đề & thời gian |
| `brave_search_news` | Tìm tin tức / bài báo để source mixing |
| `apify_scrape_youtube` | Scrape chi tiết: views, transcript, tags ([Đăng ký Apify](https://www.apify.com?fpr=get-api)) |
| `research_workflow` | Chạy toàn bộ luồng trong 1 lệnh |
| `add_source` | Add URL/text vào NotebookLM |
| `ask_question` | Hỏi Gemini qua NotebookLM |
| `setup_auth` | Đăng nhập Google lần đầu |
| `get_health` | Kiểm tra trạng thái kết nối |

---

## Câu hỏi thường gặp

**Dùng Google account nào?**  
Tạo account riêng cho tool này. Không dùng tài khoản Google chính.

**Brave Search API có mất phí không?**  
Free tier 2,000 queries/tháng — đủ dùng thoải mái. [Đăng ký tại đây](https://brave.com/search/api/).

**Apify có bắt buộc không?**  
Không. Brave Search đủ để tìm URLs. Apify cần khi muốn view count chính xác + transcript đầy đủ. [Đăng ký Apify](https://www.apify.com?fpr=get-api).

**NotebookLM có giới hạn không?**  
Free account: 50 sources/notebook, ~50 câu hỏi/ngày. Tạo 2-3 account riêng để tăng giới hạn.

---

## License

MIT — Fork thoải mái, star nếu thấy hữu ích ⭐

*Built on top of [notebooklm-mcp](https://github.com/PleasePrompto/notebooklm-mcp) by PleasePrompto.*
