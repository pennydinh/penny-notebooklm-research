# 🔬 Penny NotebookLM Research

Nghiên cứu YouTube tự động: tìm video viral → phân tích trend → gợi ý ideas → viết script.

Có 2 cách dùng:
- **Skill cho Cowork** (không cần cài gì) → tải file `penny-notebooklm-research.skill` bên dưới
- **MCP cho Claude Code** (nâng cao, dùng NotebookLM thật) → xem hướng dẫn cài đặt

---

## ⚡ Cách 1: Dùng Skill trong Cowork (Khuyến nghị)

**Không cần cài Node.js, không cần API key, dùng ngay.**

1. Tải file [`penny-notebooklm-research.skill`](https://github.com/pennydinh/penny-notebooklm-research/raw/main/penny-notebooklm-research.skill)
2. Mở Claude desktop → Settings → Capabilities → Install Skill → chọn file vừa tải
3. Gõ bất kỳ: `"nghiên cứu YouTube về AI agent"` là chạy

**Kết quả nhận được:**
- Danh sách video viral tìm được
- Phân tích: trend, keywords hot, thumbnail pattern
- 5 ý tưởng video cụ thể
- Script hoàn chỉnh khi chọn idea

---

## 🔧 Cách 2: MCP cho Claude Code (Nâng cao)

Dùng khi muốn phân tích transcript thực từ video qua NotebookLM/Gemini — kết quả sâu hơn.

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
