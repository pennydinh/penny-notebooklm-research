# 🔬 Penny NotebookLM Research

Nghiên cứu YouTube theo đúng luồng: **Brave Search tìm video → scrape transcript → add vào NotebookLM → Gemini phân tích transcript thực → gợi ý ideas → viết script.**

Kết quả không phải từ Claude tự đoán — mà từ Gemini đọc transcript thực của từng video.

---

## Yêu cầu bắt buộc

Cần cài **cả 2 thứ**:
1. **MCP** (Node.js server chạy local) — để gọi Brave Search, Apify, điều khiển NotebookLM
2. **Skill** (file `.skill`) — để Claude Cowork biết cách điều phối luồng

Thiếu một trong hai thì không chạy được.

---

## Bước 1: Cài MCP (làm 1 lần)

**Script tự động — dán vào Terminal:**

```bash
curl -fsSL https://raw.githubusercontent.com/pennydinh/penny-notebooklm-research/main/install.sh | bash
```

Script sẽ tự clone repo, `npm install`, build, và đăng ký MCP vào Claude.

**Yêu cầu:** Node.js ≥ 18 và Chrome đã cài.

Sau khi chạy xong → điền API key vào file `.env`:
- [`BRAVE_API_KEY`](https://brave.com/search/api/) — miễn phí, 2000 queries/tháng
- [`APIFY_TOKEN`](https://www.apify.com?fpr=get-api) — tùy chọn, scrape view count chính xác ($5 free credit/tháng)

Sau đó **restart Claude**.

---

## Bước 2: Cài Skill (làm 1 lần)

1. Tải file [`penny-notebooklm-research.skill`](https://github.com/pennydinh/penny-notebooklm-research/raw/main/penny-notebooklm-research.skill)
2. Mở Claude desktop → Settings → Capabilities → Install Skill → chọn file vừa tải

---

## Bước 3: Setup lần đầu trong Claude

Gõ: `setup_auth` → Chrome mở → đăng nhập Google account **phụ** (không dùng tài khoản chính).

Vào [notebooklm.google.com](https://notebooklm.google.com) → tạo notebook → Share → "Anyone with the link" → copy URL.

---

## Từ lần 2 trở đi

Gõ bình thường trong Claude Cowork:
```
nghiên cứu YouTube về AI agent, views >50k, tuần qua
notebook: https://notebooklm.google.com/notebook/...
```

Claude tự chạy toàn bộ: tìm video → add vào NotebookLM → Gemini phân tích transcript → ra 5 ideas → viết script khi chọn.

---

## Luồng thực tế

```
Brave Search / Apify
  → tìm video viral theo chủ đề + views + thời gian
  → add từng URL vào NotebookLM
  → NotebookLM/Gemini đọc transcript thực
  → phân tích: trend, keywords, thumbnail pattern, hook style
  → gợi ý 5 ideas
  → viết script hoàn chỉnh khi chọn idea
```

---

## 🔧 Cài thủ công (thay cho install.sh)



### Yêu cầu
- Node.js ≥ 18
- Chrome
- [Brave Search API key](https://brave.com/search/api/) (miễn phí, 2000 queries/tháng)
- *(Tuỳ chọn)* [Apify token](https://www.apify.com?fpr=get-api) — scrape view count chính xác ($5 free credit/tháng)

### Cài đặt

```bash
git clone https://github.com/pennydinh/penny-notebooklm-research
cd penny-notebooklm-research
npm install
cp .env.example .env
# Mở .env, điền BRAVE_API_KEY
npm run build
claude mcp add penny-research -- node $(pwd)/dist/index.js
```

### Lần đầu: Đăng nhập Google

Mở Claude Code, gõ:
```
setup_auth
```
Chrome mở ra → đăng nhập Google account riêng (không dùng tài khoản chính) → tự động lưu cookies.

### Tạo notebook

1. Vào [notebooklm.google.com](https://notebooklm.google.com) → tạo notebook mới
2. Share → "Anyone with the link" → copy URL

### Chạy toàn bộ luồng trong 1 lệnh

```
research_workflow(
  topic="AI agent",
  min_views=100000,
  freshness="pm",
  notebook_url="https://notebooklm.google.com/notebook/..."
)
```

### Hoặc từng bước

```
# 1. Tìm video viral
brave_search_videos(query="AI agent 2025", freshness="pm", min_views=100000)

# 2. Add vào NotebookLM
add_source(type="url", content="https://youtube.com/watch?v=...", notebook_url="...")

# 3. Phân tích
ask_question(question="Phân tích trend, keywords, gợi ý 5 ideas video", source_format="footnotes")

# 4. Viết script
ask_question(question="Viết script 1000 từ cho ý tưởng số 2")
```

---

## Tools có trong MCP

| Tool | Mô tả |
|------|-------|
| `brave_search_videos` | Tìm video YouTube viral theo chủ đề & thời gian |
| `brave_search_news` | Tìm tin tức để source mixing |
| `apify_scrape_youtube` | Scrape chi tiết: views thực, transcript ([Đăng ký Apify](https://www.apify.com?fpr=get-api)) |
| `research_workflow` | Chạy toàn bộ luồng 1 lệnh |
| `add_source` | Add URL/text vào NotebookLM |
| `ask_question` | Hỏi Gemini qua NotebookLM |
| `setup_auth` | Đăng nhập Google lần đầu |
| `get_health` | Kiểm tra trạng thái |

---

## FAQ

**Dùng Google account nào?**
Tạo account riêng. Không dùng tài khoản Google chính vì cookies lưu local.

**Brave API có mất phí không?**
Free 2000 queries/tháng. [Đăng ký tại đây](https://brave.com/search/api/).

**Apify có bắt buộc không?**
Không. Brave Search đủ để tìm URLs. Apify cần khi muốn view count chính xác.

---

MIT License · [pennydinh](https://github.com/pennydinh)
