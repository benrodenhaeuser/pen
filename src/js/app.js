import { core } from './core.js';
import { ui } from './ui.js';
import { db } from './db.js';

const app = {
  connect(core, component) {
    component.bindEvents(core.dispatch.bind(core));
    core.periphery.push(component.sync.bind(component));
  },

  init() {
    core.init();

    this.connect(core, ui);
    this.connect(core, db);

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
