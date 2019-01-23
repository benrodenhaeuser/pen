import { core } from './core/core.js';
import { timeline } from './timeline/timeline.js';
import { ui } from './ui/ui.js';
import { db } from './db/db.js';

const app = {
  init() {
    core.init();

    for (let component of [ui, db]) {
      component.init();
      component.bindEvents(core.processInput.bind(core));
      core.periphery[component.name] = component.sync.bind(component);
    }

    timeline.init();
    timeline.bindEvents(core.setState.bind(core));
    core.periphery[timeline.name] = timeline.sync.bind(timeline);

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
