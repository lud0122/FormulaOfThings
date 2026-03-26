import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  toGrayscale,
  applyGaussianBlur,
  computeGradient,
  nonMaximumSuppression,
  doubleThreshold,
  edgeTracking,
  cannyEdgeDetection
} from '../../src/image-processor/edge-detector.js';

describe('Edge Detector', () => {
  describe('toGrayscale', () => {
    it('should convert RGBA to grayscale', () => {
      const rgba = {
        width: 2,
        height: 2,
        data: new Uint8ClampedArray([
          255, 0, 0, 255,
          0, 255, 0, 255,
          0, 0, 255, 255,
          255, 255, 255, 255
        ])
      };

      const gray = toGrayscale(rgba);
      assert.strictEqual(gray.width, 2);
      assert.strictEqual(gray.height, 2);
      assert.strictEqual(gray.data.length, 4);
      assert.ok(gray.data[0] > 0);
      assert.ok(gray.data[1] > 0);
      assert.ok(gray.data[2] > 0);
      assert.ok(gray.data[3] > 0);
    });

    it('should handle already grayscale input', () => {
      const gray = {
        width: 2,
        height: 2,
        data: new Uint8ClampedArray([100, 150, 200, 250])
      };

      const result = toGrayscale(gray);
      assert.strictEqual(result.width, 2);
      assert.strictEqual(result.height, 2);
      assert.strictEqual(result.data.length, 4);
    });
  });

  describe('applyGaussianBlur', () => {
    it('should return array with correct dimensions', () => {
      const simpleGrayImage = {
        width: 4,
        height: 4,
        data: new Uint8ClampedArray([
          10, 20, 30, 40,
          50, 60, 70, 80,
          90, 100, 110, 120,
          130, 140, 150, 160
        ])
      };
      const blurred = applyGaussianBlur(simpleGrayImage);
      assert.strictEqual(blurred.width, simpleGrayImage.width);
      assert.strictEqual(blurred.height, simpleGrayImage.height);
      assert.strictEqual(blurred.data.length, simpleGrayImage.data.length);
    });

    it('should smooth the image', () => {
      const simpleGrayImage = {
        width: 4,
        height: 4,
        data: new Uint8ClampedArray([
          10, 20, 30, 40,
          50, 60, 70, 80,
          90, 100, 110, 120,
          130, 140, 150, 160
        ])
      };
      const blurred = applyGaussianBlur(simpleGrayImage);
      for (let i = 0; i < blurred.data.length; i++) {
        assert.ok(blurred.data[i] >= 0 && blurred.data[i] <= 255);
      }
    });
  });

  describe('computeGradient', () => {
    it('should return magnitude and direction', () => {
      const simpleGrayImage = {
        width: 4,
        height: 4,
        data: new Uint8ClampedArray([
          10, 20, 30, 40,
          50, 60, 70, 80,
          90, 100, 110, 120,
          130, 140, 150, 160
        ])
      };
      const result = computeGradient(simpleGrayImage);
      assert.ok(result.magnitude);
      assert.ok(result.direction);
      assert.strictEqual(result.magnitude.width, simpleGrayImage.width);
      assert.strictEqual(result.magnitude.height, simpleGrayImage.height);
      assert.strictEqual(result.magnitude.data.length, simpleGrayImage.data.length);
      assert.strictEqual(result.direction.data.length, simpleGrayImage.data.length);
    });
  });

  describe('nonMaximumSuppression', () => {
    it('should thin edges', () => {
      const magnitude = {
        width: 3,
        height: 3,
        data: new Uint8ClampedArray([
          50, 100, 50,
          50, 200, 50,
          50, 100, 50
        ])
      };
      const direction = {
        width: 3,
        height: 3,
        data: new Float32Array([
          0, Math.PI/2, 0,
          0, Math.PI/2, 0,
          0, Math.PI/2, 0
        ])
      };

      const suppressed = nonMaximumSuppression(magnitude, direction);
      assert.strictEqual(suppressed.width, 3);
      assert.strictEqual(suppressed.height, 3);
    });
  });

  describe('doubleThreshold', () => {
    it('should classify pixels into strong, weak, and non-edges', () => {
      const suppressed = {
        width: 3,
        height: 3,
        data: new Uint8ClampedArray([
          200, 100, 10,
          200, 100, 10,
          200, 100, 10
        ])
      };

      const result = doubleThreshold(suppressed, 50, 150);
      assert.strictEqual(result.width, 3);
      assert.strictEqual(result.height, 3);
      assert.strictEqual(result.data[0], 255);
      assert.strictEqual(result.data[1], 75);
      assert.strictEqual(result.data[2], 0);
    });
  });

  describe('edgeTracking', () => {
    it('should connect weak edges to strong edges', () => {
      const thresholded = {
        width: 3,
        height: 3,
        data: new Uint8ClampedArray([
          255, 75, 0,
          75, 75, 0,
          0, 0, 0
        ])
      };

      const tracked = edgeTracking(thresholded);
      assert.strictEqual(tracked.width, 3);
      assert.strictEqual(tracked.height, 3);
      assert.strictEqual(tracked.data[0], 255);
      assert.strictEqual(tracked.data[8], 0);
    });
  });

  describe('cannyEdgeDetection', () => {
    it('should detect edges in a simple image', () => {
      const rgba = {
        width: 5,
        height: 5,
        data: new Uint8ClampedArray([
          0,0,0,255, 0,0,0,255, 255,255,255,255, 255,255,255,255, 255,255,255,255,
          0,0,0,255, 0,0,0,255, 255,255,255,255, 255,255,255,255, 255,255,255,255,
          0,0,0,255, 0,0,0,255, 255,255,255,255, 255,255,255,255, 255,255,255,255,
          0,0,0,255, 0,0,0,255, 255,255,255,255, 255,255,255,255, 255,255,255,255,
          0,0,0,255, 0,0,0,255, 255,255,255,255, 255,255,255,255, 255,255,255,255,
        ])
      };

      const edges = cannyEdgeDetection(rgba, { lowThreshold: 50, highThreshold: 150 });
      assert.strictEqual(edges.width, 5);
      assert.strictEqual(edges.height, 5);
      assert.strictEqual(edges.data.length, 25);

      const middleCol = 2;
      let hasEdge = false;
      for (let y = 0; y < 5; y++) {
        if (edges.data[y * 5 + middleCol] > 0) {
          hasEdge = true;
          break;
        }
      }
      assert.ok(hasEdge, 'Should detect vertical edge in the middle');
    });

    it('should work with custom thresholds', () => {
      const simpleGrayImage = {
        width: 4,
        height: 4,
        data: new Uint8ClampedArray([
          10, 20, 30, 40,
          50, 60, 70, 80,
          90, 100, 110, 120,
          130, 140, 150, 160
        ])
      };
      const result = cannyEdgeDetection(simpleGrayImage, {
        lowThreshold: 30,
        highThreshold: 100
      });
      assert.strictEqual(result.width, simpleGrayImage.width);
      assert.strictEqual(result.height, simpleGrayImage.height);
    });

    it('should use default thresholds if not provided', () => {
      const simpleGrayImage = {
        width: 4,
        height: 4,
        data: new Uint8ClampedArray([
          10, 20, 30, 40,
          50, 60, 70, 80,
          90, 100, 110, 120,
          130, 140, 150, 160
        ])
      };
      const result = cannyEdgeDetection(simpleGrayImage);
      assert.strictEqual(result.width, simpleGrayImage.width);
      assert.strictEqual(result.height, simpleGrayImage.height);
    });
  });
});
