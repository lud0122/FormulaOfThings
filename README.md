# Formula Of Things (Canvas2D)

基于 `ideal/ideal_1.PNG` 的公式生成图像实验：
- 纯公式自动推导参数（无手工锚点）
- 参数可解释、可调
- Canvas2D 实时渲染

## 本地运行

```bash
npm test
npm run serve
# 打开 http://localhost:4173
```

## 使用方式

1. 打开页面后自动加载参考图与初始渲染
2. 点击“自动拟合”执行参数搜索
3. 在参数面板实时调节几何/材质/颜色/动画参数
4. 可导出 PNG 与参数 JSON，并可重新导入

## 公式项说明

- `radialDecay`: 径向衰减，控制中心到边缘亮度衰减
- `radialFreq`: 径向频率，控制环纹密度
- `angularFreq`: 角向频率，控制方位纹理节奏
- `waveMix`: 基础场与波场混合比例
- `noiseStrength`/`noiseScale`: 噪声细节强度与尺度
- `hueShift`/`saturation`/`brightness`: 调色映射
- `speed`/`jitter`: 动画速度与微扰
