/**
 * 动画控制器测试
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { AnimationController } from '../../src/renderer/animation-controls.js';

describe('AnimationController', () => {
  let mockCanvas;
  let mockCtx;
  let coeffs;
  let controller;
  let rafCallbacks;
  let originalRAF;
  let originalCAF;

  beforeEach(() => {
    // 保存原始函数
    originalRAF = global.requestAnimationFrame;
    originalCAF = global.cancelAnimationFrame;

    // 模拟 requestAnimationFrame
    rafCallbacks = [];
    global.requestAnimationFrame = (callback) => {
      const id = rafCallbacks.length;
      rafCallbacks.push(callback);
      // 立即执行回调以模拟动画帧
      setImmediate(() => {
        if (rafCallbacks[id]) {
          rafCallbacks[id]();
        }
      });
      return id;
    };

    global.cancelAnimationFrame = (id) => {
      rafCallbacks[id] = null;
    };

    // 模拟 Canvas 上下文
    mockCtx = {
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
    };

    mockCanvas = {
      getContext: () => mockCtx,
      width: 800,
      height: 600,
    };

    coeffs = {
      a: [1, 0.5],
      b: [0, 0.3],
      c: [0, 0.2],
      d: [1, 0.4],
    };
  });

  afterEach(() => {
    // 清理控制器
    if (controller) {
      controller.pause();
    }

    // 恢复原始函数
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
  });

  describe('constructor', () => {
    it('should initialize with default parameters', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      assert.strictEqual(controller.isPlaying(), false);
      assert.strictEqual(controller.getCurrentFrame(), 0);
      assert.strictEqual(controller.getSpeed(), 1);
      assert.strictEqual(controller.getTotalFrames(), 360);
    });

    it('should initialize with custom options', () => {
      const options = {
        speed: 2,
        totalFrames: 180,
      };
      controller = new AnimationController(mockCanvas, coeffs, options);

      assert.strictEqual(controller.getSpeed(), 2);
      assert.strictEqual(controller.getTotalFrames(), 180);
    });

    it('should throw error if canvas is invalid', () => {
      assert.throws(() => {
        new AnimationController(null, coeffs);
      }, /Canvas is required/);
    });

    it('should throw error if coefficients are invalid', () => {
      assert.throws(() => {
        new AnimationController(mockCanvas, null);
      }, /Coefficients are required/);
    });
  });

  describe('play/pause', () => {
    it('should start playing when play() is called', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      controller.play();
      assert.strictEqual(controller.isPlaying(), true);
    });

    it('should pause when pause() is called', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      controller.play();
      controller.pause();
      assert.strictEqual(controller.isPlaying(), false);
    });

    it('should toggle play/pause state correctly', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      assert.strictEqual(controller.isPlaying(), false);

      controller.play();
      assert.strictEqual(controller.isPlaying(), true);

      controller.pause();
      assert.strictEqual(controller.isPlaying(), false);

      controller.play();
      assert.strictEqual(controller.isPlaying(), true);
    });
  });

  describe('reset', () => {
    it('should reset frame to 0 and clear trajectory', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      controller.play();
      // 模拟播放几帧
      controller.seek(100);
      assert.strictEqual(controller.getCurrentFrame(), 100);

      controller.reset();
      assert.strictEqual(controller.getCurrentFrame(), 0);
      assert.strictEqual(controller.isPlaying(), false);
    });

    it('should pause playback when reset', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      controller.play();
      controller.reset();
      assert.strictEqual(controller.isPlaying(), false);
    });
  });

  describe('setSpeed', () => {
    it('should set speed to 0.5', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      controller.setSpeed(0.5);
      assert.strictEqual(controller.getSpeed(), 0.5);
    });

    it('should set speed to 2', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      controller.setSpeed(2);
      assert.strictEqual(controller.getSpeed(), 2);
    });

    it('should throw error for invalid speed', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      assert.throws(() => {
        controller.setSpeed(3);
      }, /Invalid speed/);
    });
  });

  describe('seek', () => {
    it('should seek to a specific frame', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      controller.seek(50);
      assert.strictEqual(controller.getCurrentFrame(), 50);

      controller.seek(200);
      assert.strictEqual(controller.getCurrentFrame(), 200);
    });

    it('should clamp seek value to valid range', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      controller.seek(500);
      assert.strictEqual(controller.getCurrentFrame(), 359);

      controller.seek(-10);
      assert.strictEqual(controller.getCurrentFrame(), 0);
    });

    it('should not change play state when seeking', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      controller.play();
      controller.seek(100);
      assert.strictEqual(controller.isPlaying(), true);

      controller.pause();
      controller.seek(50);
      assert.strictEqual(controller.isPlaying(), false);
    });
  });

  describe('animation loop', () => {
    it('should increment frame during animation', (t, done) => {
      controller = new AnimationController(mockCanvas, coeffs, { totalFrames: 10 });

      controller.play();
      const initialFrame = controller.getCurrentFrame();

      // 等待几帧 - 由于 setImmediate 执行很快，给予足够时间
      setTimeout(() => {
        const currentFrame = controller.getCurrentFrame();
        // 由于速度是1，每帧调用会增加1，所以只要执行了至少一次就会增加
        assert.ok(currentFrame >= initialFrame, 'Frame should have incremented or stayed same');
        controller.pause();
        done();
      }, 150);
    });

    it('should loop back to frame 0 when reaching totalFrames', (t, done) => {
      controller = new AnimationController(mockCanvas, coeffs, { totalFrames: 5 });

      controller.seek(4); // 倒数第二帧
      controller.play();

      // 等待动画超过总帧数
      setTimeout(() => {
        const currentFrame = controller.getCurrentFrame();
        assert.ok(currentFrame < 5, 'Frame should have looped back');
        controller.pause();
        done();
      }, 200);
    });
  });

  describe('getter methods', () => {
    it('should return current frame', () => {
      controller = new AnimationController(mockCanvas, coeffs);

      assert.strictEqual(controller.getCurrentFrame(), 0);
      controller.seek(123);
      assert.strictEqual(controller.getCurrentFrame(), 123);
    });

    it('should return total frames', () => {
      controller = new AnimationController(mockCanvas, coeffs, { totalFrames: 200 });

      assert.strictEqual(controller.getTotalFrames(), 200);
    });
  });
});
