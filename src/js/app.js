import { core } from './core/core.js';
import {  ui  } from './periphery/ui.js';
import {  db  } from './periphery/db.js';
import { hist } from './periphery/hist.js';

const app = {
  init() {
    core.init();

    for (let peripheral of [ui, db, hist]) {
      peripheral.init();
      peripheral.bindEvents(core.compute.bind(core));
      core.attach(peripheral.name, peripheral.receive.bind(peripheral));
    }

    core.kickoff();
  },

  // getCanvasSize() {
  //   const canvasWidth   = 600;
  //   const canvasHeight  = 395;
  //   const canvasSize    = { width: canvasWidth, height: canvasHeight };
  //
  //   return canvasSize;
  // }
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
