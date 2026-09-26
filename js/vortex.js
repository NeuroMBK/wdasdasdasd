/**
 * ASCII Vortex Background Engine
 * Отрисовка кода с последующей трансформацией в спиральный ASCII-вихрь
 */

import { getParsedSnippet } from './snippet.js';

const CHARS = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const CHAR_LEN = CHARS.length;

export class VortexEngine {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onUiReady = options.onUiReady || (() => {});
        
        this.tokenizedCode = options.tokenizedCode || getParsedSnippet();

        this.charWidth = 9.5;
        this.charHeight = 16;
        this.cols = 0;
        this.rows = 0;
        this.time = 0;

        // Тайминги трансформации (в секундах)
        this.codeHoldTime = options.codeHoldTime ?? 1.8;
        this.morphDuration = options.morphDuration ?? 2.6;
        this.uiRevealTime = options.uiRevealTime ?? 3.8;

        this.startTime = performance.now();
        this.uiTriggered = false;

        // Смещение центра вихря (по умолчанию правее центра)
        this.mouse = { x: 0.72, y: 0.48, targetX: 0.72, targetY: 0.48 };

        this.init();
    }

    init() {
        this.bindEvents();
        this.resize();
        requestAnimationFrame(() => this.render());
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.targetX = e.clientX / window.innerWidth;
            this.mouse.targetY = e.clientY / window.innerHeight;
        });

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cols = Math.ceil(this.canvas.width / this.charWidth);
        this.rows = Math.ceil(this.canvas.height / this.charHeight);
        this.ctx.font = `600 ${this.charHeight - 2}px 'JetBrains Mono', monospace`;
        this.ctx.textBaseline = 'top';
    }

    getCodeToken(x, y) {
        const line = this.tokenizedCode[y % this.tokenizedCode.length];
        if (!line || x >= line.length) return null;
        return line[x];
    }

    render() {
        const elapsed = (performance.now() - this.startTime) / 1000;
        this.time += 0.016;

        let morph = (elapsed - this.codeHoldTime) / this.morphDuration;
        morph = Math.max(0, Math.min(1, morph));

        // Активация UI и затемняющей маски
        if (elapsed > this.uiRevealTime && !this.uiTriggered) {
            this.uiTriggered = true;
            this.onUiReady();
        }

        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

        // Очистка фона
        this.ctx.fillStyle = '#020202';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.cols * this.mouse.x;
        const centerY = this.rows * this.mouse.y;

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const dx = (x - centerX) * 0.72;
                const dy = (y - centerY) * 1.30;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                // Динамика спирали вихря
                const spiral = angle * 3.0 - Math.log(dist + 0.1) * 3.6 + this.time * 1.6;
                const wave1 = Math.sin(spiral);
                const wave2 = Math.cos(dist * 0.14 - this.time * 2.0);
                const wave3 = Math.sin(angle * 6.0 + dist * 0.07 - this.time);

                let vortexIntensity = (wave1 * 1.3 + wave2 * 0.8 + wave3 * 0.4) / 2.5;
                vortexIntensity = (vortexIntensity + 1) / 2;
                vortexIntensity = Math.pow(vortexIntensity, 1.3);

                const centerFalloff = Math.min(dist / 5, 1);
                const edgeFalloff = Math.max(0, 1 - dist / (Math.max(this.cols, this.rows) * 0.95));
                vortexIntensity = vortexIntensity * centerFalloff * edgeFalloff;

                let vortexCharIdx = Math.floor(vortexIntensity * CHAR_LEN);
                vortexCharIdx = Math.max(0, Math.min(CHAR_LEN - 1, vortexCharIdx));
                const vortexChar = CHARS[vortexCharIdx];

                const codeToken = this.getCodeToken(x, y);

                let renderChar = ' ';
                let r = 255, g = 255, b = 255, a = 0;

                if (morph < 0.99) {
                    const threshold = (Math.sin(x * 0.22 + y * 0.4 + spiral) + 1) / 2;

                    if (morph === 0 || threshold > morph * 1.2) {
                        // Исходный читаемый код
                        if (codeToken) {
                            renderChar = codeToken.char;
                            [r, g, b] = codeToken.color;
                            a = 0.95;
                        }
                    } else {
                        // Переход в вихрь
                        renderChar = vortexChar;
                        a = Math.min(1.0, vortexIntensity * 1.1 * morph);
                        if (codeToken) {
                            r = Math.round(codeToken.color[0] * (1 - morph) + 245 * morph);
                            g = Math.round(codeToken.color[1] * (1 - morph) + 250 * morph);
                            b = Math.round(codeToken.color[2] * (1 - morph) + 255 * morph);
                        } else {
                            r = 240; g = 248; b = 255;
                        }
                    }
                } else {
                    // Стабильный вихрь высокой контрастности
                    renderChar = vortexChar;
                    a = Math.min(0.92, vortexIntensity * 1.05 + 0.05);
                    r = 235;
                    g = 245;
                    b = 255;
                }

                if (renderChar !== ' ' && a > 0.02) {
                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
                    this.ctx.fillText(renderChar, x * this.charWidth, y * this.charHeight);
                }
            }
        }

        requestAnimationFrame(() => this.render());
    }
}
