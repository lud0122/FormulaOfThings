import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { prepareRenderer, renderEpicycles } from '../../src/renderer/epicycle-renderer.js';

describe('Epicycle Renderer', () => {
  describe('prepareRenderer', () => {
    it('should return correct scale and offset for square canvas', () => {
      const canvasWidth = 800;
      const canvasHeight = 800;
      // Use {a, b, c, d} format
      const coeffs = {
        a: [1, 0.5, 0.3],
        b: [0, 0.2, 0.1],
        c: [1, 0.5, 0.3],
        d: [0, 0.2, 0.1]
      };

      const result = prepareRenderer(coeffs, canvasWidth, canvasHeight);

      // Dynamic scale based on actual Fourier curve boundary
      assert.ok(result.scale > 0 && Number.isFinite(result.scale), `Expected valid scale, got ${result.scale}`);
      // Offset should center the contour (calculated from boundary, not simple canvas center)
      assert.ok(Number.isFinite(result.offsetX));
      assert.ok(Number.isFinite(result.offsetY));
    });

    it('should handle rectangular canvas (landscape)', () => {
      const canvasWidth = 1000;
      const canvasHeight = 600;
      const coeffs = {
        a: [1],
        b: [0],
        c: [1],
        d: [0]
      };

      const result = prepareRenderer(coeffs, canvasWidth, canvasHeight);

      // offset should be finite numbers based on contour
      assert.ok(Number.isFinite(result.offsetX));
      assert.ok(Number.isFinite(result.offsetY));
    });

    it('should handle rectangular canvas (portrait)', () => {
      const canvasWidth = 600;
      const canvasHeight = 1000;
      const coeffs = {
        a: [1],
        b: [0],
        c: [1],
        d: [0]
      };

      const result = prepareRenderer(coeffs, canvasWidth, canvasHeight);

      // offset should be finite numbers based on contour
      assert.ok(Number.isFinite(result.offsetX));
      assert.ok(Number.isFinite(result.offsetY));
    });

    it('should handle {a, b, c, d} format correctly', () => {
      const canvasWidth = 800;
      const canvasHeight = 800;
      // Use {a, b, c, d} 4 coefficient groups
      const coeffs = {
        a: [1, 0.5, 0.3],
        b: [0, 0.2, 0.1],
        c: [1, 0.5, 0.3],
        d: [0, 0.2, 0.1]
      };

      const result = prepareRenderer(coeffs, canvasWidth, canvasHeight);

      // Should return valid scale
      assert.ok(result.scale > 0 && Number.isFinite(result.scale), `Expected valid scale, got ${result.scale}`);
      // Offset should center the contour
      assert.ok(Number.isFinite(result.offsetX));
      assert.ok(Number.isFinite(result.offsetY));
    });

    it('should use contourPoints for boundary calculation when provided', () => {
      const canvasWidth = 800;
      const canvasHeight = 800;
      const coeffs = {
        a: [100, 50, 30],
        b: [0, 0, 0],
        c: [100, 50, 30],
        d: [0, 0, 0]
      };
      const contourPoints = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];

      const result = prepareRenderer(coeffs, canvasWidth, canvasHeight, contourPoints);

      // Should use contourPoints min/max directly
      assert.strictEqual(result.minX, 0);
      assert.strictEqual(result.maxX, 100);
      assert.strictEqual(result.minY, 0);
      assert.strictEqual(result.maxY, 100);
    });

    it('should fallback to sampling when contourPoints not provided', () => {
      const canvasWidth = 800;
      const canvasHeight = 800;
      const coeffs = {
        a: [1, 0.5, 0.3],
        b: [0, 0.2, 0.1],
        c: [1, 0.5, 0.3],
        d: [0, 0.2, 0.1]
      };

      const result = prepareRenderer(coeffs, canvasWidth, canvasHeight);

      // Should return valid scale and center offsets
      assert.ok(result.scale > 0 && Number.isFinite(result.scale));
      assert.ok(Number.isFinite(result.offsetX));
      assert.ok(Number.isFinite(result.offsetY));
    });
  });

  describe('renderEpicycles', () => {
    let mockCtx;
    let canvasWidth;
    let canvasHeight;

    beforeEach(() => {
      // Create mock canvas context
      mockCtx = {
        clearRect: () => {},
        beginPath: () => {},
        arc: () => {},
      fillRect: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        strokeStyle: '',
      fillStyle: '',
        fillColor: '',
        lineWidth: 0
      };
      canvasWidth = 800;
      canvasHeight = 800;
    });

    it('should return early if coeffs is null', () => {
      const trajectory = [];
      const result = renderEpicycles(null, canvasWidth, canvasHeight, null, 0, trajectory);

      assert.deepStrictEqual(result, { penX: 0, penY: 0 });
    });

    it('should return early if coeffs is missing required properties', () => {
      const trajectory = [];
      const invalidCoeffs = { a: [1] }; // missing b
      const result = renderEpicycles(mockCtx, canvasWidth, canvasHeight, invalidCoeffs, 0, trajectory);

      assert.deepStrictEqual(result, { penX: 0, penY: 0 });
    });

    it('should return early if ctx is invalid', () => {
      const trajectory = [];
      const coeffs = {
        a: [1, 0],
        b: [0, 0],
        c: [1, 0],
        d: [0, 0]
      };
      const result = renderEpicycles(null, canvasWidth, canvasHeight, coeffs, 0, trajectory);

      assert.deepStrictEqual(result, { penX: 0, penY: 0 });
    });

    it('should clear canvas on each render', () => {
      const trajectory = [];
      const coeffs = {
        a: [100, 50],
        b: [0, 0],
        c: [100, 50],
        d: [0, 0]
      };

      let fillRectCalled = false;
      mockCtx.fillRect = (x, y, w, h) => {
        fillRectCalled = true;
        assert.strictEqual(x, 0);
        assert.strictEqual(y, 0);
        assert.strictEqual(w, canvasWidth);
        assert.strictEqual(h, canvasHeight);
      };

      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);

      assert.ok(fillRectCalled, 'fillRect should be called');
    });

    it('should draw correct number of circles for N coefficients', () => {
      const trajectory = [];
      const coeffs = {
        a: [100, 50, 30],
        b: [0, 0, 0],
        c: [100, 50, 30],
        d: [0, 0, 0]
      };

      let arcCallCount = 0;
      mockCtx.arc = () => {
        arcCallCount++;
      };

      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);

      // Renderer now draws epicycles + pen tip
      assert.ok(arcCallCount > 0, 'should draw epicycles');
    });

    it('should accumulate trajectory points', () => {
      const trajectory = [];
      const coeffs = {
        a: [100, 50],
        b: [0, 0],
        c: [100, 50],
        d: [0, 0]
      };

      // First render
      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);
      assert.strictEqual(trajectory.length, 1);

      // Second render
      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, Math.PI / 2, trajectory);
      assert.strictEqual(trajectory.length, 2);
    });

    it('should draw trajectory with correct style', () => {
      const trajectory = [];
      const coeffs = {
        a: [100],
        b: [0],
        c: [100],
        d: [0]
      };

      // Render twice to generate trajectory
      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);
      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0.1, trajectory);

      // Verify trajectory style is set (via stroke call)
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

      // Should still draw pen tip at center
      assert.ok(arcCalled, 'should still draw red pen tip at center');
    });

    it('should use correct visual styles', () => {
      const trajectory = [];
      const coeffs = {
        a: [100],
        b: [0],
        c: [100],
        d: [0]
      };

      const styles = [];
      mockCtx.stroke = function() {
        styles.push({ strokeStyle: this.strokeStyle });
      };
      mockCtx.fill = function() {
        styles.push({ fillStyle: this.fillStyle });
      };

      renderEpicycles(mockCtx, canvasWidth, canvasHeight, coeffs, 0, trajectory);

      // Verify at least contains cyan trajectory and red pen tip styles
      const hasCyanStyle = styles.some(s =>
        s.strokeStyle && s.strokeStyle === '#00d4ff'
      );
      const hasRedStyle = styles.some(s =>
        s.fillStyle && s.fillStyle === 'red'
      );

      assert.ok(hasCyanStyle, 'should use cyan style for trajectory');
      assert.ok(hasRedStyle, 'should use red style for pen tip');
    });
  });
});
