#!/bin/bash

# ============================================================
# Penny NotebookLM Research — Script cài đặt tự động
# https://github.com/pennydinh/penny-notebooklm-research
# ============================================================

set -e

REPO_URL="https://github.com/pennydinh/penny-notebooklm-research"
INSTALL_DIR="$HOME/.penny-notebooklm-research"

echo ""
echo "🔧 Penny NotebookLM Research — Cài đặt"
echo "========================================"
echo ""

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Chưa có Node.js. Tải tại: https://nodejs.org (chọn LTS)"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Cần Node.js v18 trở lên. Phiên bản hiện tại: $(node -v)"
  echo "   Tải tại: https://nodejs.org"
  exit 1
fi

echo "✅ Node.js $(node -v)"

# Kiểm tra git
if ! command -v git &> /dev/null; then
  echo "❌ Chưa có git. Tải tại: https://git-scm.com"
  exit 1
fi

echo "✅ git $(git --version | awk '{print $3}')"

# Clone hoặc update repo
if [ -d "$INSTALL_DIR" ]; then
  echo ""
  echo "📁 Thư mục đã tồn tại, cập nhật..."
  cd "$INSTALL_DIR"
  git pull origin main
else
  echo ""
  echo "📥 Đang tải repo..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Cài dependencies và build
echo ""
echo "📦 Đang cài dependencies..."
npm install --silent

echo "🔨 Đang build..."
npm run build

# Tạo file .env nếu chưa có
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "📝 Đã tạo file .env tại: $INSTALL_DIR/.env"
  echo ""
  echo "   ⚠️  Cần điền API key:"
  echo "   - BRAVE_API_KEY: lấy miễn phí tại https://brave.com/search/api/"
  echo "   - APIFY_TOKEN: tùy chọn, tại https://www.apify.com?fpr=get-api"
  echo ""
  echo "   Mở file .env và điền key, sau đó tiếp tục."
  echo ""
  read -p "   Đã điền xong API key? (Enter để tiếp tục, Ctrl+C để thoát và điền sau): "
fi

# Đăng ký MCP vào Claude
echo ""
echo "🔌 Đăng ký MCP vào Claude..."

if command -v claude &> /dev/null; then
  claude mcp add penny-notebooklm-research -- node "$INSTALL_DIR/dist/index.js"
  echo ""
  echo "✅ Đăng ký MCP thành công!"
else
  echo ""
  echo "⚠️  Không tìm thấy lệnh 'claude'. Đăng ký thủ công:"
  echo "   claude mcp add penny-notebooklm-research -- node \"$INSTALL_DIR/dist/index.js\""
fi

echo ""
echo "========================================"
echo "✅ Cài đặt hoàn tất!"
echo ""
echo "Bước tiếp theo:"
echo "1. Restart Claude (tắt hoàn toàn và mở lại)"
echo "2. Nói với Claude: 'nghiên cứu YouTube về [chủ đề của bạn]'"
echo "   → Skill sẽ tự hướng dẫn đăng nhập NotebookLM lần đầu"
echo ""
echo "📁 MCP được cài tại: $INSTALL_DIR"
echo "📖 Hướng dẫn đầy đủ: $REPO_URL"
echo "========================================"
echo ""
