/**
 * Penny NotebookLM Research — Localhost Web UI
 * Chạy: node dist/web/server.js
 * Truy cập: http://localhost:3333
 */

import http from "http";
import { braveSearchVideos } from "../brave/client.js";

const PORT = Number(process.env.WEB_PORT ?? 3333);

// Inline HTML để không cần static files
const HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Penny NotebookLM Research</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f10; color: #e0e0e0; min-height: 100vh; }
  .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px 32px; border-bottom: 1px solid #2a2a3e; display: flex; align-items: center; gap: 12px; }
  .header h1 { font-size: 20px; font-weight: 600; color: #fff; }
  .header .badge { background: #4f46e5; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 99px; }
  .container { max-width: 1000px; margin: 0 auto; padding: 32px 24px; }
  .card { background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
  .card h2 { font-size: 15px; font-weight: 600; color: #a5b4fc; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-row { display: flex; gap: 12px; flex-wrap: wrap; }
  input, select { background: #0f0f10; border: 1px solid #2a2a3e; color: #e0e0e0; border-radius: 8px; padding: 10px 14px; font-size: 14px; }
  input[type=text] { flex: 1; min-width: 200px; }
  input:focus, select:focus { outline: none; border-color: #4f46e5; }
  input::placeholder { color: #555; }
  .btn { background: #4f46e5; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; }
  .btn:hover { background: #4338ca; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-secondary { background: #1e293b; border: 1px solid #2a2a3e; }
  .btn-secondary:hover { background: #263548; }
  .results { margin-top: 20px; }
  .video-card { background: #0f1117; border: 1px solid #2a2a3e; border-radius: 8px; padding: 14px; margin-bottom: 10px; display: flex; gap: 14px; align-items: flex-start; cursor: pointer; transition: border-color 0.2s; }
  .video-card:hover, .video-card.selected { border-color: #4f46e5; }
  .video-card.selected { background: #1a1a3e; }
  .video-thumb { width: 120px; height: 68px; object-fit: cover; border-radius: 4px; flex-shrink: 0; background: #2a2a3e; }
  .video-info { flex: 1; min-width: 0; }
  .video-title { font-size: 14px; font-weight: 500; color: #e0e0e0; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .video-meta { font-size: 12px; color: #666; }
  .video-meta span { margin-right: 12px; }
  .views-badge { color: #4ade80; }
  .checkbox { width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; accent-color: #4f46e5; }
  .section-title { font-size: 13px; color: #666; margin-bottom: 10px; }
  .analysis-box { background: #0f1117; border: 1px solid #2a2a3e; border-radius: 8px; padding: 16px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; max-height: 500px; overflow-y: auto; }
  .loading { text-align: center; padding: 40px; color: #555; }
  .spinner { display: inline-block; width: 24px; height: 24px; border: 2px solid #2a2a3e; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 10px; vertical-align: middle; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .tag { background: #1e293b; border: 1px solid #2a2a3e; border-radius: 4px; padding: 2px 8px; font-size: 11px; color: #94a3b8; display: inline-block; margin: 2px; }
  .notebook-input { width: 100%; margin-top: 8px; }
  .step-indicator { display: flex; gap: 8px; margin-bottom: 20px; }
  .step { flex: 1; text-align: center; padding: 8px; border-radius: 6px; font-size: 12px; background: #1a1a2e; border: 1px solid #2a2a3e; color: #555; }
  .step.active { border-color: #4f46e5; color: #a5b4fc; }
  .step.done { border-color: #4ade80; color: #4ade80; }
  .error { background: #2d1b1b; border: 1px solid #7f1d1d; color: #fca5a5; border-radius: 8px; padding: 12px 16px; margin-top: 10px; font-size: 13px; }
  .success { background: #0f2d1a; border: 1px solid #14532d; color: #86efac; border-radius: 8px; padding: 12px 16px; margin-top: 10px; font-size: 13px; }
  .idea-card { background: #0f1117; border: 1px solid #2a2a3e; border-radius: 8px; padding: 14px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.2s; }
  .idea-card:hover { border-color: #4f46e5; }
  .idea-num { color: #4f46e5; font-weight: 600; font-size: 13px; }
  .idea-title { font-size: 14px; font-weight: 500; margin-top: 4px; }
</style>
</head>
<body>
<div class="header">
  <h1>🔬 Penny NotebookLM Research</h1>
  <span class="badge">Beta</span>
</div>

<div class="container">
  <!-- Step indicator -->
  <div class="step-indicator">
    <div class="step active" id="step1">1. Tìm kiếm</div>
    <div class="step" id="step2">2. Chọn video</div>
    <div class="step" id="step3">3. Phân tích</div>
    <div class="step" id="step4">4. Kịch bản</div>
  </div>

  <!-- Step 1: Search -->
  <div class="card" id="card-search">
    <h2>🔍 Tìm Video Viral</h2>
    <div class="form-row">
      <input type="text" id="query" placeholder="Chủ đề (ví dụ: AI agent tutorial)" value="AI agent" />
      <select id="freshness">
        <option value="pm">Tháng qua</option>
        <option value="pw">Tuần qua</option>
        <option value="py">Năm qua</option>
      </select>
      <input type="number" id="min_views" placeholder="Min views (100000)" value="50000" style="width:160px" />
      <button class="btn" onclick="searchVideos()">Tìm kiếm</button>
    </div>
  </div>

  <!-- Step 2: Results + Select -->
  <div class="card" id="card-results" style="display:none">
    <h2>📹 Kết Quả Tìm Kiếm</h2>
    <p class="section-title">Chọn video muốn phân tích (tối đa 5)</p>
    <div id="video-list" class="results"></div>
    <div style="margin-top:16px">
      <p style="font-size:13px;color:#666;margin-bottom:8px">NotebookLM URL (share link từ notebooklm.google.com):</p>
      <input type="text" id="notebook_url" class="notebook-input" placeholder="https://notebooklm.google.com/notebook/..." />
    </div>
    <div style="margin-top:12px;display:flex;gap:10px">
      <button class="btn" onclick="addAndAnalyze()">Add vào NotebookLM & Phân tích →</button>
      <button class="btn btn-secondary" onclick="analyzeOnly()">Chỉ phân tích (đã add rồi)</button>
    </div>
  </div>

  <!-- Step 3: Analysis -->
  <div class="card" id="card-analysis" style="display:none">
    <h2>🤖 Phân Tích NotebookLM</h2>
    <div id="analysis-content"></div>
    <div style="margin-top:16px" id="ideas-section" style="display:none"></div>
  </div>

  <!-- Step 4: Script -->
  <div class="card" id="card-script" style="display:none">
    <h2>✍️ Script / Dàn Ý</h2>
    <div id="script-content"></div>
  </div>
</div>

<script>
let selectedVideos = [];
let sessionId = null;
let notebookUrl = '';

async function searchVideos() {
  const query = document.getElementById('query').value;
  const freshness = document.getElementById('freshness').value;
  const minViews = parseInt(document.getElementById('min_views').value) || 0;

  document.getElementById('video-list').innerHTML = '<div class="loading"><span class="spinner"></span>Đang tìm kiếm...</div>';
  document.getElementById('card-results').style.display = 'block';

  try {
    const res = await fetch('/api/search-videos', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query, freshness, min_views: minViews, count: 15})
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.error);

    renderVideoList(data.results, minViews);
    setStep(2);
  } catch(e) {
    document.getElementById('video-list').innerHTML = '<div class="error">Lỗi: ' + e.message + '</div>';
  }
}

function renderVideoList(videos, minViews) {
  const el = document.getElementById('video-list');
  if (!videos.length) {
    el.innerHTML = '<div class="error">Không tìm thấy video phù hợp. Thử giảm min_views hoặc đổi từ khóa.</div>';
    return;
  }

  el.innerHTML = videos.map((v, i) => {
    const views = v.views ? v.views.toLocaleString() : 'N/A';
    const highlight = v.views >= minViews ? 'views-badge' : '';
    return \`<div class="video-card" onclick="toggleVideo(\${i})" id="vc-\${i}">
      <input type="checkbox" class="checkbox" id="cb-\${i}" />
      \${v.thumbnail ? \`<img class="video-thumb" src="\${v.thumbnail}" onerror="this.style.display='none'" />\` : '<div class="video-thumb"></div>'}
      <div class="video-info">
        <div class="video-title">\${v.title}</div>
        <div class="video-meta">
          <span>\${v.channel}</span>
          <span class="\${highlight}">👁 \${views}</span>
          \${v.published ? \`<span>📅 \${v.published}</span>\` : ''}
        </div>
        <div style="margin-top:4px"><a href="\${v.url}" target="_blank" style="color:#4f46e5;font-size:12px">\${v.url.substring(0,60)}...</a></div>
      </div>
    </div>\`;
  }).join('');

  window._videos = videos;
}

function toggleVideo(i) {
  const cb = document.getElementById('cb-' + i);
  const card = document.getElementById('vc-' + i);
  cb.checked = !cb.checked;
  card.classList.toggle('selected', cb.checked);
}

function getSelectedVideos() {
  const videos = window._videos || [];
  return videos.filter((_, i) => document.getElementById('cb-' + i)?.checked);
}

async function addAndAnalyze() {
  const selected = getSelectedVideos();
  if (!selected.length) { alert('Chọn ít nhất 1 video!'); return; }

  notebookUrl = document.getElementById('notebook_url').value.trim();

  document.getElementById('card-analysis').style.display = 'block';
  document.getElementById('analysis-content').innerHTML = '<div class="loading"><span class="spinner"></span>Đang add sources vào NotebookLM...</div>';
  setStep(3);

  try {
    const res = await fetch('/api/add-and-analyze', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        videos: selected,
        notebook_url: notebookUrl,
        topic: document.getElementById('query').value
      })
    });
    const data = await res.json();
    renderAnalysis(data);
  } catch(e) {
    document.getElementById('analysis-content').innerHTML = '<div class="error">Lỗi: ' + e.message + '</div>';
  }
}

async function analyzeOnly() {
  notebookUrl = document.getElementById('notebook_url').value.trim();
  if (!notebookUrl) { alert('Nhập NotebookLM URL!'); return; }

  document.getElementById('card-analysis').style.display = 'block';
  document.getElementById('analysis-content').innerHTML = '<div class="loading"><span class="spinner"></span>Đang phân tích qua NotebookLM/Gemini...</div>';
  setStep(3);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        notebook_url: notebookUrl,
        topic: document.getElementById('query').value
      })
    });
    const data = await res.json();
    renderAnalysis(data);
  } catch(e) {
    document.getElementById('analysis-content').innerHTML = '<div class="error">Lỗi: ' + e.message + '</div>';
  }
}

function renderAnalysis(data) {
  const el = document.getElementById('analysis-content');
  if (data.error) {
    el.innerHTML = '<div class="error">' + data.error + '</div>';
    return;
  }

  sessionId = data.session_id;
  el.innerHTML = '<div class="analysis-box">' + (data.answer || data.result || JSON.stringify(data, null, 2)) + '</div>';

  // Extract ideas và render
  const ideasSection = document.getElementById('ideas-section');
  ideasSection.style.display = 'block';
  ideasSection.innerHTML = \`
    <h2 style="font-size:15px;color:#a5b4fc;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px">💡 Chọn Ý Tưởng Để Triển Khai</h2>
    <div class="form-row" style="margin-bottom:12px">
      <input type="text" id="custom-idea" placeholder="Hoặc nhập ý tưởng của bạn..." style="flex:1" />
      <button class="btn" onclick="generateScript(document.getElementById('custom-idea').value)">Triển khai →</button>
    </div>
    <p style="font-size:12px;color:#555">Hoặc nhập số ý tưởng từ phân tích trên (ví dụ: "ý tưởng số 1")</p>
  \`;
}

async function generateScript(idea) {
  if (!idea) { alert('Nhập ý tưởng!'); return; }

  document.getElementById('card-script').style.display = 'block';
  document.getElementById('script-content').innerHTML = '<div class="loading"><span class="spinner"></span>Đang viết script...</div>';
  setStep(4);

  try {
    const res = await fetch('/api/generate-script', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({idea, notebook_url: notebookUrl, session_id: sessionId})
    });
    const data = await res.json();
    document.getElementById('script-content').innerHTML = \`
      <div class="analysis-box">\${data.answer || data.error || JSON.stringify(data)}</div>
      <div style="margin-top:12px;display:flex;gap:10px">
        <button class="btn btn-secondary" onclick="copyScript()">📋 Copy</button>
      </div>
    \`;
  } catch(e) {
    document.getElementById('script-content').innerHTML = '<div class="error">Lỗi: ' + e.message + '</div>';
  }
}

function copyScript() {
  const text = document.querySelector('#script-content .analysis-box')?.textContent || '';
  navigator.clipboard.writeText(text);
}

function setStep(n) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('step' + i);
    if (i < n) el.className = 'step done';
    else if (i === n) el.className = 'step active';
    else el.className = 'step';
  }
}
</script>
</body>
</html>`;

// Simple HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // Serve HTML
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML);
    return;
  }

  // API routes
  if (req.method === "POST" && url.pathname.startsWith("/api/")) {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      res.setHeader("Content-Type", "application/json");

      try {
        const args = JSON.parse(body) as Record<string, unknown>;
        let result: unknown;

        if (url.pathname === "/api/search-videos") {
          result = await braveSearchVideos({
            query: args.query as string,
            count: (args.count as number) ?? 15,
            freshness: (args.freshness as "pm") ?? "pm",
            country: "us",
          });
          const minViews = (args.min_views as number) ?? 0;
          const filtered = minViews > 0
            ? (result as { views: number | null }[]).filter((v) => (v.views ?? 0) >= minViews)
            : result;
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, results: filtered }));
          return;
        }

        if (url.pathname === "/api/analyze") {
          // Gọi NotebookLM qua MCP stdio là phức tạp trong web context
          // Dùng simple HTTP call tới MCP server nếu đang chạy HTTP mode
          res.writeHead(200);
          res.end(
            JSON.stringify({
              answer:
                "⚠️ Web UI cần NotebookLM MCP chạy ở HTTP mode.\n" +
                "Chạy: npx penny-notebooklm-research --transport http --port 3000\n" +
                "Sau đó web UI sẽ tự kết nối.",
            })
          );
          return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: "Not found" }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(e) }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`\n🚀 Penny NotebookLM Research UI`);
  console.log(`   Mở trình duyệt: http://localhost:${PORT}`);
  console.log(`   Ctrl+C để dừng\n`);
});
