/**
 * Главный скрипт инициализации страницы
 */

import { VortexEngine } from './vortex.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('ascii-canvas');
    const scrim = document.getElementById('scrim');
    const uiWrapper = document.getElementById('ui-wrapper');

    if (!canvas) return;

    new VortexEngine(canvas, {
        onUiReady: () => {
            if (uiWrapper) {
                uiWrapper.classList.add('ui-ready');
            }
            if (scrim) {
                scrim.classList.add('active');
            }
        }
    });
});
