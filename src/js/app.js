import { core } from './app/core.js';
import { db } from './app/periphery.js';
import { hist } from './app/periphery.js';
import { canvas } from './app/periphery.js';
import { editor } from './app/periphery.js';
import { tools } from './app/periphery.js';
import { message } from './app/periphery.js';

const modules = [canvas, editor, tools, message, hist, db];

const app = {
  init() {
    core.init();

    for (let module of modules) {
      module.init(core.state.export());
      module.bindEvents(core.compute.bind(core));
      core.attach(module.name, module.react.bind(module));
    }

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
