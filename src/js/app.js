import { core } from './core/core.js';
import {  ui  } from './periphery/ui.js';
import {  db  } from './periphery/db.js';
import { hist } from './periphery/hist.js';

const app = {
  init() {
    core.init();
    // ^ after this step, the core is set up with an empty canvas to draw on.
    // but it's not wired up, and the interface has not yet been drawn.
    // in addition, we have not dimensioned the doc properly.

    // wire up peripherals:
    for (let component of [ui, db]) {
      component.init();
      component.bindEvents(core.compute.bind(core));
      core.attachPeripheral(component.name, component.receive.bind(component));
    }

    // should use `compute` instead of `setState`
    hist.init();
    hist.bindEvents(core.setState.bind(core)); // should use `compute`
    core.attachPeripheral(hist.name, hist.receive.bind(hist)); // this is like above

    // now everything is wired up, so we can start "publishing" stuff.

    core.kickoff(this.getCanvasSize());
  },

  getCanvasSize() {
    const canvasWidth   = document.documentElement.clientWidth;
    const toolbarHeight = 35;
    const canvasHeight  = (document.documentElement.clientHeight - toolbarHeight);
    const canvasSize    = { width: canvasWidth, height: canvasHeight };

    return canvasSize;
  }
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
