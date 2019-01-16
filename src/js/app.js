import { core } from './core.js';
import { ui } from './ui.js';
import { db } from './db.js';

const app = {
  init() {
    core.init();
    ui.init(core);
    db.init(core);

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init);
