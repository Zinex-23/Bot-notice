#!/usr/bin/env bash

# Thoát ngay nếu có lệnh bị lỗi
set -e

# Lấy commit message từ tham số đầu vào, nếu không nhập thì mặc định là "updated"
COMMIT_MSG="${1:-updated}"

# Tự động lấy branch hiện tại (ví dụ: main)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

echo "🔍 1. Kiểm tra trạng thái git..."
git status

# Kiểm tra xem có thay đổi nào không (staged, unstaged, untracked)
if [ -z "$(git status --porcelain)" ]; then
  echo "ℹ️  Không có thay đổi nào mới để commit."
  exit 0
fi

echo ""
echo "➕ 2. Đang git add ...."
git add .

echo ""
echo "💾 3. Đang git commit: \"$COMMIT_MSG\"..."
git commit -m "$COMMIT_MSG"

echo ""
echo "🚀 4. Đang git push lên origin $BRANCH..."
git push -u origin "$BRANCH"

echo ""
echo "🎉 Hoàn tất cập nhật và đẩy mã nguồn lên GitHub!"
