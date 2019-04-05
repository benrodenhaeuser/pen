import { core } from './core/core.js';
import {  ui  } from './ui/ui.js';
import {  db  } from './db/db.js';
import { hist } from './history/history.js';

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

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
