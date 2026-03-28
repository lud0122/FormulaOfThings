#!/bin/bash
# 验证 GitHub Pages 部署是否成功

echo "🔍 等待 GitHub Pages 部署..."
echo "当前时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

MAX_RETRIES=10
RETRY_COUNT=0
SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "尝试 $RETRY_COUNT/$MAX_RETRIES..."

    # 检查页面是否还报错
    if curl -s https://lud0122.github.io/FormulaOfThings/ | grep -q "calculateEnergyRatio"; then
        echo "❌ 仍检测到旧版本（有 calculateEnergyRatio 错误）"
        sleep 30
    else
        echo "✅ 部署成功！未检测到模块导入错误"
        SUCCESS=true
        break
    fi
done

if [ "$SUCCESS" = true ]; then
    echo ""
    echo "🎉 部署验证成功！"
    echo "📍 访问地址: https://lud0122.github.io/FormulaOfThings/"
    echo ""
    echo "测试步骤："
    echo "1. 打开网站"
    echo "2. 点击上传区域"
    echo "3. 应该弹出文件选择对话框"
    echo "4. 拖拽图片到上传区域也应该工作"
else
    echo ""
    echo "⏰ 部署时间较长，请稍后手动验证"
    echo "建议等待 5-10 分钟后访问网站"
fi
