/**
 * 动画控制器 - 控制轮圆动画的播放、暂停、速度
 *
 * 管理动画状态和播放循环，协调 Canvas 渲染
 */

import { renderEpicycles } from './epicycle-renderer.js';

/**
 * AnimationController 类
 * 负责管理轮圆动画的播放状态和渲染循环
 */
export class AnimationController {
  #canvas;
  #ctx;
  #coeffs;
  #isPlaying;
  #speed;
  #currentFrame;
  #totalFrames;
  #trajectory;
  #animationId;

  /**
   * 创建动画控制器
   * @param {HTMLCanvasElement} canvas - Canvas 元素
   * @param {Object} coeffs - 傅里叶系数 {a, b, c, d}
   * @param {Object} options - 配置选项
   * @param {number} options.speed - 播放速度（0.5, 1, 2）
   * @param {number} options.totalFrames - 总帧数（默认 360）
   */
  constructor(canvas, coeffs, options = {}) {
    // 参数验证
    if (!canvas) {
      throw new Error('Canvas is required');
    }
    if (!coeffs) {
      throw new Error('Coefficients are required');
    }

    this.#canvas = canvas;
    this.#ctx = canvas.getContext('2d');
    this.#coeffs = coeffs;

    // 初始化状态
    this.#isPlaying = false;
    this.#speed = options.speed || 1;
    this.#currentFrame = 0;
    this.#totalFrames = options.totalFrames || 360;
    this.#trajectory = [];
    this.#animationId = null;
  }

  /**
   * 开始播放动画
   */
  play() {
    if (this.#isPlaying) return;

    this.#isPlaying = true;
    this.#animationLoop();
  }

  /**
   * 暂停动画
   */
  pause() {
    this.#isPlaying = false;
    if (this.#animationId) {
      cancelAnimationFrame(this.#animationId);
      this.#animationId = null;
    }
  }

  /**
   * 重置动画到初始状态
   */
  reset() {
    this.pause();
    this.#currentFrame = 0;
    this.#trajectory = [];
  }

  /**
   * 设置播放速度
   * @param {number} speed - 播放速度（0.5, 1, 2）
   */
  setSpeed(speed) {
    // 验证速度值在允许范围内
    const validSpeeds = [0.5, 1, 2];
    if (!validSpeeds.includes(speed)) {
      throw new Error(`Invalid speed. Must be one of: ${validSpeeds.join(', ')}`);
    }
    this.#speed = speed;
  }

  /**
   * 跳转到指定帧
   * @param {number} frame - 帧索引
   */
  seek(frame) {
    // 限制在有效范围内
    this.#currentFrame = Math.max(0, Math.min(frame, this.#totalFrames - 1));
  }

  /**
   * 获取当前帧索引
   * @returns {number} 当前帧
   */
  getCurrentFrame() {
    return this.#currentFrame;
  }

  /**
   * 检查播放状态
   * @returns {boolean} 是否正在播放
   */
  isPlaying() {
    return this.#isPlaying;
  }

  /**
   * 获取播放速度
   * @returns {number} 播放速度
   */
  getSpeed() {
    return this.#speed;
  }

  /**
   * 获取总帧数
   * @returns {number} 总帧数
   */
  getTotalFrames() {
    return this.#totalFrames;
  }

  /**
   * 动画循环
   * 负责逐帧更新和渲染
   */
  #animationLoop() {
    if (!this.#isPlaying) return;

    // 计算时间参数
    const dt = (2 * Math.PI) / this.#totalFrames;
    const t = this.#currentFrame * dt;

    // 渲染当前帧
    renderEpicycles(
      this.#ctx,
      this.#canvas.width,
      this.#canvas.height,
      this.#coeffs,
      t,
      this.#trajectory
    );

    // 递增帧计数（根据速度调整）
    this.#currentFrame += this.#speed;

    // 循环播放
    if (this.#currentFrame >= this.#totalFrames) {
      this.#currentFrame = 0;
      this.#trajectory = []; // 清空轨迹
    }

    // 继续下一帧
    this.#animationId = requestAnimationFrame(() => this.#animationLoop());
  }
}
