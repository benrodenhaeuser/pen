import { core } from './core/core.js';
// import {  ui  } from './periphery/ui.js';
import { canvas } from  './periphery/ui/canvas.js';
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
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
