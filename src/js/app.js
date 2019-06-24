import { core } from './core/core.js';
import {  ui  } from './periphery/ui.js';
import {  db  } from './periphery/db.js';
import { hist } from './periphery/hist.js';

const peripherals = [ui, db, hist];

const app = {
  init() {
    core.init();

    for (let peripheral of peripherals) {
      peripheral.init();
      peripheral.bindEvents(core.compute.bind(core));
      core.attach(peripheral.name, peripheral.receive.bind(peripheral));
    }

    core.kickoff(this.getCanvasSize());
  },

  getCanvasSize() {
    const canvasWidth   = 600;
    const canvasHeight  = 400 - 35;
    const canvasSize    = { width: canvasWidth, height: canvasHeight };

    return canvasSize;
  }
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
