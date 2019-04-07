import { core } from './core/core.js';
import {  ui  } from './periphery/ui.js';
import {  db  } from './periphery/db.js';
import { hist } from './periphery/hist.js';

const app = {
  init() {
    core.init();

    // wire up peripherals:
    for (let component of [ui, db]) {
      component.init();
      component.bindEvents(core.compute.bind(core));
      core.attach(component.name, component.sync.bind(component));
    }

    // todo: unify this with above attach loop for ui and db:
    // instead of setState, hist should also use compute.
    hist.init();
    hist.bindEvents(core.setState.bind(core));
    core.attach(hist.name, hist.sync.bind(hist));

    this.setCanvasWidth();
    core.kickoff();
  }, 

  setCanvasWidth() {
    const canvasNode = document.querySelector('#canvas');
    core.state.canvasWidth = canvasNode.clientWidth;
  },
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
