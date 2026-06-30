---
name: penny-notebooklm-research
description: "Nghiên cứu YouTube qua NotebookLM: tìm video viral bằng Brave Search/Apify, add vào NotebookLM, để Gemini phân tích transcript thực, rồi gợi ý ideas và viết script. Kích hoạt khi người dùng nói: nghiên cứu YouTube, tìm video viral, phân tích kênh YouTube, tìm chủ đề video, gợi ý ideas YouTube, viết script YouTube, tìm trending, setup notebooklm, cài MCP notebooklm. Yêu cầu MCP penny-notebooklm-research đã được cài."
---

# Penny NotebookLM Research

Skill này yêu cầu MCP `penny-notebooklm-research` đã được cài. Không có MCP → dừng lại, không chạy tiếp.

---

## BƯỚC 0: Kiểm tra MCP

Gọi `get_health` ngay khi skill trigger.

**Nếu tool `get_health` không tồn tại** → MCP chưa cài. Hiển thị hướng dẫn bên dưới và dừng — không chạy tiếp.

> ⚠️ **Chưa tìm thấy MCP `penny-notebooklm-research` trên máy này.**
> Cài MCP theo hướng dẫn bên dưới, restart Claude, rồi thử lại.

### Cài MCP (làm 1 lần, ~5 phút)

**Yêu cầu:** Máy đã có Node.js (kiểm tra: `node -v` trong Terminal)

**Cách 1 — Script tự động (khuyên dùng):**
Mở Terminal, dán lệnh này:
```bash
curl -fsSL https://raw.githubusercontent.com/pennydinh/penny-notebooklm-research/main/install.sh | bash
```
Script sẽ tự clone, cài dependencies, build và đăng ký MCP vào Claude.

**Cách 2 — Thủ công:**
```bash
git clone https://github.com/pennydinh/penny-notebooklm-research
cd penny-notebooklm-research
npm install && npm run build
cp .env.example .env
claude mcp add penny-notebooklm-research -- node "$(pwd)/dist/index.js"
```

Sau khi cài xong: **restart Claude**, quay lại và gõ lại yêu cầu.

---

**Nếu `get_health` trả về `authenticated: false`** → Chạy `setup_auth`:

> "Đang mở Chrome để đăng nhập NotebookLM. Hãy đăng nhập bằng tài khoản Google **phụ** (không dùng tài khoản chính). Sau khi đăng nhập xong, quay lại đây."

Gọi `setup_auth` → đợi người dùng xác nhận đã đăng nhập → tiếp tục.

**Nếu `get_health` trả về OK và authenticated** → Đi thẳng vào workflow.

---

## BƯỚC 1: Nhận yêu cầu

Hỏi người dùng (nếu chưa cung cấp):
- Chủ đề nghiên cứu là gì? (ví dụ: "AI agent", "vibe coding", "làm YouTube kiếm tiền")
- Khoảng thời gian: tuần qua hay tháng qua?
- Ngưỡng views tối thiểu: 50k, 100k, hay 500k?

> ⚠️ **MỖI CHỦ ĐỀ DÙNG 1 NOTEBOOK RIÊNG.** KHÔNG add chủ đề mới vào notebook đã chứa chủ đề khác — Gemini sẽ phân tích lẫn lộn cả 2 chủ đề và cho kết quả sai.

**Tự tạo notebook mới cho chủ đề này (KHÔNG bắt user làm tay):**
```
create_notebook(name="YouTube Research — [chủ đề]")
```
Tool tự bấm "Tạo mới" trên NotebookLM, trả về `notebook_url` + `notebook_id`, đồng thời đăng ký & chọn nó làm active. **Lưu `notebook_url` này dùng cho tất cả các bước sau.**

> Nếu user muốn tái dùng một notebook CÓ SẴN cho đúng chủ đề đó → bỏ qua `create_notebook`, hỏi URL và dùng URL đó.

---

## BƯỚC 2: Tìm video viral

Gọi MCP tool (KHÔNG tự search — phải qua tool):

```
brave_search_videos(
  query="[chủ đề] tutorial",
  freshness="pw",
  min_views=50000,
  count=10
)
```

Nếu người dùng muốn view count chính xác hơn, gọi thêm:
```
apify_scrape_youtube(
  search_query="[chủ đề] 2025 2026",
  min_views=50000,
  published_after="[30 ngày trước - định dạng YYYY-MM-DD]"
)
```

Lấy top 5 URLs có views cao nhất từ kết quả.

---

## BƯỚC 3: Add vào NotebookLM

Gọi `add_source` tuần tự cho từng URL (không add đồng thời). Link YouTube được hỗ trợ trực tiếp — MCP tự nhận diện và đưa vào đúng nguồn YouTube của NotebookLM:

```
add_source(type="url", content="[url_1]", notebook_url="[notebook_url]")
add_source(type="url", content="[url_2]", notebook_url="[notebook_url]")
add_source(type="url", content="[url_3]", notebook_url="[notebook_url]")
add_source(type="url", content="[url_4]", notebook_url="[notebook_url]")
add_source(type="url", content="[url_5]", notebook_url="[notebook_url]")
```

> ⏳ **Đợi index transcript trước khi hỏi.** Video YouTube cần thời gian để NotebookLM tải transcript — đợi **45–90 giây** sau khi add xong (lâu hơn nguồn web thường). Nếu `ask_question` báo "chỉ có N/5 nguồn có transcript" → đợi thêm rồi hỏi lại.

Nếu `add_source` lỗi "restricted" → nhắc người dùng:
> "Vào NotebookLM → Settings → Share → chọn 'Anyone with the link' rồi thử lại."

---

## BƯỚC 4: Phân tích qua Gemini/NotebookLM

**KHÔNG tự phân tích** — phải gọi `ask_question`:

```
ask_question(
  question="Dựa trên các video vừa được thêm về chủ đề [chủ đề], hãy phân tích:
1. Top 3 xu hướng đang viral và lý do
2. 15 keywords hot xuất hiện nhiều trong tiêu đề/nội dung
3. Thumbnail pattern: màu sắc, style chữ, element phổ biến
4. Hook style: cách mở đầu video hiệu quả nhất
5. Gợi ý 5 ý tưởng video cụ thể với tiêu đề và lý do sẽ viral",
  notebook_url="[notebook_url]",
  source_format="footnotes"
)
```

Lưu `session_id` từ response này để dùng cho câu hỏi tiếp theo.

---

## BƯỚC 5: Hiển thị kết quả

Format kết quả từ NotebookLM thành:

---

## 📊 KẾT QUẢ: [CHỦ ĐỀ]
*Phân tích từ [số] video thực — bởi Gemini/NotebookLM*

### 📹 Videos đã phân tích
1. [Tên video] — [views] views — [URL]
2. ...

### 📈 Xu hướng đang nổi
[Từ NotebookLM]

### 🔑 Keywords hot
[Từ NotebookLM]

### 🖼️ Thumbnail Pattern
[Từ NotebookLM]

### 💡 5 Ý Tưởng Video
**1.** [Tiêu đề] — [lý do viral]
**2.** [Tiêu đề] — [lý do viral]
**3.** [Tiêu đề] — [lý do viral]
**4.** [Tiêu đề] — [lý do viral]
**5.** [Tiêu đề] — [lý do viral]

---
**Chọn ý tưởng nào để viết script? Gõ số 1–5 hoặc nhập ý tưởng của bạn.**

---

## BƯỚC 6: Viết script (khi người dùng chọn)

Gọi `ask_question` với `session_id` từ bước 4:

```
ask_question(
  question="Viết script YouTube hoàn chỉnh (~1000 chữ) cho ý tưởng: [ý tưởng được chọn].
Gồm:
- Hook 10 giây đầu (gây tò mò ngay lập tức)
- Intro 30 giây (xác nhận vấn đề, preview nội dung)  
- 3 điểm chính, mỗi điểm có ví dụ cụ thể từ nguồn đã phân tích
- CTA cuối (subscribe + câu hỏi gợi comment)
Viết theo style của các video viral đã phân tích.",
  notebook_url="[notebook_url]",
  session_id="[session_id_từ_bước_4]",
  source_format="footnotes"
)
```

Format output thành script rõ ràng với thời gian ước tính mỗi phần.

---

## Lưu ý

- **Mọi phân tích phải từ `ask_question`** — không tự suy luận hay thay thế bằng kiến thức của Claude
- **Brave Search** = tìm nhanh, views ước tính; **Apify** = views chính xác hơn nhưng chậm hơn
- Nếu `brave_search_videos` không có trong tools → MCP chưa cài đúng, quay lại Bước 0
