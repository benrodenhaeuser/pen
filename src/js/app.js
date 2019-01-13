import { machine } from './machine.js';
import { ui } from './ui.js';
import { db } from './db.js';

const app = {
  init() {
    machine.init();
    ui.init(machine);
    db.init(machine);

    machine.handle(new Event('kickoff'));
  },
};

document.addEventListener('DOMContentLoaded', app.init);
