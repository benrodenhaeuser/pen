import { core } from './app/core.js';
import { db } from './app/periphery/_.js';
import { hist } from './app/periphery/_.js';
import { canvas } from './app/periphery/_.js';
import { markup } from './app/periphery/_.js';
import { tools } from './app/periphery/_.js';
import { message } from './app/periphery/_.js';
import { keyboard } from './app/periphery/_.js';

const modules = [canvas, markup, keyboard, tools, message, hist, db];

const app = {
  init() {
    core.init();

    for (let module of modules) {
      module.init(core.state.snapshot);
      module.bindEvents(core.compute.bind(core));
      core.attach(module.name, module.react.bind(module));
    }

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init);
