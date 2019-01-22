import { core } from './core.js';
import { ui } from './ui.js';
import { ds } from './ds.js';
import { hist } from './hist.js';

const app = {
  init() {
    core.init();

    for (let component of [ui, ds]) {
      component.init();
      component.bindEvents(core.process.bind(core));
      core.periphery[component.name] = component.sync.bind(component);
    }

    hist.bindEvents(core.setState.bind(core));
    core.periphery[hist.name] = hist.sync.bind(hist);

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
