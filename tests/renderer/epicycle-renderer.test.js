import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { prepareRenderer, renderEpicycles } from '../../src/renderer/epicycle-renderer.js';

describe('Epicycle Renderer', () => {
  describe('prepareRenderer', () => {
    it('should return correct scale and offset for square canvas', () => {
      const canvasWidth = 800;
      const canvasHeight = 800;
      const coeffs = {
        a: [1, 0.5, 0.3],
        b: [0, 0.2, 0.1],
        c: [],
        d: []
      };

      const result = prepareRenderer(coeffs, canvasWidth, canvasHeight);

      // scale应该是min(width, height) * 0.4 = 800 * 0.4 = 320
      assert.strictEqual(result.scale, 320);
      // offset应该是中心点
      assert.strictEqual(result.offsetX, 400);
      assert.strictEqual(result.offsetY, 400);
    });

    it('should handle rectangular canvas (landscape)', () => {
      const canvasWidth = 1000;
      const canvasHeight = 600;
      const coeffs = {
        a: [1],
        b: [0],
        c: [],
        d: []
      };

      const result = prepareRenderer(coeffs, canvasWidth, canvasHeight);

      // scale = min(1000, 600) * 0.4 = 240
      assert.strictEqual(result.scale, 240);
      assert.strictEqual(result.offsetX, 500);
      assert.strictEqual(result.offsetY, 300);
    });

    it('should handle rectangular canvas (portrait)', () => {
      const canvasWidth = 600;
      const canvasHeight = 1000;
      const coeffs = {
        a: [1],
        b: [0],
        c: [],
        d: []
      };

      const result = prepareRenderer(coeffs, canvasWidth, canvasHeight);

      // scale = min(600, 1000) * 0.4 = 240
      assert.strictEqual(result.scale, 240);
      assert.strictEqual(result.offsetX, 300);
      assert.strictEqual(result.offsetY, 500);
    });
  });

  describe('renderEpicycles', () => {
    let mockCtx;
    let canvasWidth;
    let canvasHeight;

    beforeEach(() => {
      // 创建mock canvas context
      mockCtx = {
        clearRect: () => {},
        beginPath: () => {},
        arc: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        strokeStyle: '',
        fillColor: '',
        lineWidth: 0
      };
      canvasWidth = 800;
      canvasHeight = 800;
    });

    it('should return early if coeffs is null', () => {
      const trajectory = [];
      const result = renderEpicycles(null, canvasWidth, canvasHeight, null, 0, trajectory);

      assert.strictEqual(result, undefined);
    });

    it('should return early if coeffs is missing required properties', () => {
      const trajectory = [];
      const invalidCoeffs = { a: [1] }; // missing b, c, d
      const result = renderEpicycles(mockCtx, canvasWidth, canvasHeight, invalidCoeffs, 0, trajectory);

      assert.strictEqual(result, undefined);
    });

    it('should return early if ctx is invalid', () => {
      const trajectory = [];
      const coeffs = {
        a: [1, 0],
        b: [0, 0],
        c: [],
        d: []
      };
      const result = renderEpicycles(null, canvasWidth, canvasHeight, coeffs, 0, trajectory);

      assert.strictEqual(result, undefined);
    });

    it('should clear canvas on each render', () => {
      const trajectory = [];
      const coeffs = {
        a: [100, 50],
        b: [0, 0],
        c: [],
        d: []
      };

      let clearRectCalled = false;
      mockCtx.clearRect = (x, y, w, h) => {
        clearRectCalled = true;
        assert.strictEqual(x, 0);
        assert.strictEqual(y, 0);
        assert.strictEqual(w, canvasWidth);
        assert.strictEqual(h, canvasHeight);
      };

      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);

      assert.ok(clearRectCalled, 'clearRect should be called');
    });

    it('should draw correct number of circles for N coefficients', () => {
      const trajectory = [];
      const coeffs = {
        a: [100, 50, 30],
        b: [0, 0, 0],
        c: [],
        d: []
      };

      let arcCallCount = 0;
      mockCtx.arc = () => {
        arcCallCount++;
      };

      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);

      // N=3个轮圆 + N=3个圆心点 + 1个红色笔尖 = 7次arc调用
      assert.strictEqual(arcCallCount, 7);
    });

    it('should accumulate trajectory points', () => {
      const trajectory = [];
      const coeffs = {
        a: [100, 50],
        b: [0, 0],
        c: [],
        d: []
      };

      // Mock stroke to track line drawing
      const lines = [];
      mockCtx.moveTo = (x, y) => lines.push({ type: 'moveTo', x, y });
      mockCtx.lineTo = (x, y) => lines.push({ type: 'lineTo', x, y });

      // 第一次渲染
      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);
      assert.strictEqual(trajectory.length, 1);

      // 第二次渲染
      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, Math.PI / 2, trajectory);
      assert.strictEqual(trajectory.length, 2);
    });

    it('should draw trajectory with correct style', () => {
      const trajectory = [];
      const coeffs = {
        a: [100],
        b: [0],
        c: [],
        d: []
      };

      // 渲染两次以产生轨迹
      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);
      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0.1, trajectory);

      // 验证轨迹样式已设置（通过stroke的调用）
      let strokeCalled = false;
      const originalStroke = mockCtx.stroke;
      mockCtx.stroke = function() {
        strokeCalled = true;
      };

      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0.2, trajectory);

      assert.ok(strokeCalled, 'stroke should be called for trajectory');
    });

    it('should handle empty coefficients array', () => {
      const trajectory = [];
      const coeffs = {
        a: [],
        b: [],
        c: [],
        d: []
      };

      let arcCalled = false;
      mockCtx.arc = () => {
        arcCalled = true;
      };

      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);

      // 只有红色笔尖（在中心位置）
      // 由于没有系数，笔尖应该在中心
      assert.ok(arcCalled, 'should still draw red pen tip at center');
    });

    it('should use correct visual styles', () => {
      const trajectory = [];
      const coeffs = {
        a: [100],
        b: [0],
        c: [],
        d: []
      };

      const styles = [];
      mockCtx.stroke = function() {
        styles.push({ strokeStyle: this.strokeStyle });
      };
      mockCtx.fill = function() {
        styles.push({ fillStyle: this.fillStyle });
      };

      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);

      // 验证至少包含淡蓝色和红色样式
      const hasBlueStyle = styles.some(s =>
        s.strokeStyle && s.strokeStyle.includes('100, 149, 237')
      );
      const hasRedStyle = styles.some(s =>
        s.fillStyle && s.fillStyle === 'red'
      );

      assert.ok(hasBlueStyle, 'should use blue style for epicycles');
      assert.ok(hasRedStyle, 'should use red style for pen tip');
    });
  });
});
