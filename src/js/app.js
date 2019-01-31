import { core } from './core/core.js';
import { log } from './log/log.js';
import { ui } from './ui/ui.js';
import { db } from './db/db.js';

const app = {
  init() {
    core.init();

    // wire up `ui` and `db`
    for (let component of [ui, db]) {
      component.init();
      component.bindEvents(core.processInput.bind(core));
      core.periphery[component.name] = component.sync.bind(component);
    }

    // wire up `log`
    log.init();
    log.bindEvents(core.setState.bind(core));
    core.periphery[log.name] = log.sync.bind(log);

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
