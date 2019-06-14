import { core } from './core/core.js';
import {  ui  } from './periphery/ui.js';
import {  db  } from './periphery/db.js';
import { hist } from './periphery/hist.js';

const peripherals = [ui, db, hist];
const toolbarHeight = 35;

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
    const canvasWidth   = document.documentElement.clientWidth;
    const canvasHeight  = (document.documentElement.clientHeight - toolbarHeight);
    const canvasSize    = { width: canvasWidth, height: canvasHeight };

    return canvasSize;
  }
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
