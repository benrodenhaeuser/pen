import { core } from './core/core.js';
import { ui } from './ui/ui.js';
import { db } from './db/db.js';
import { diary } from './history/diary.js';

const app = {
  init() {
    core.init();
 
    for (let component of [ui, db]) {
      component.init();
      component.bindEvents(core.processInput.bind(core));
      core.periphery[component.name] = component.sync.bind(component);
    }

    diary.init();
    diary.bindEvents(core.setState.bind(core));
    core.periphery[diary.name] = diary.sync.bind(diary);

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
