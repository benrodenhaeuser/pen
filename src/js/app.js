import { core    } from './core/core.js';
import { db      } from './periphery/db.js';
import { hist    } from './periphery/history.js';
import { canvas  } from './periphery/ui.js';
import { editor  } from './periphery/ui.js';
import { tools   } from './periphery/ui.js';
import { message } from './periphery/ui.js';

const modules = [
  canvas,
  editor,
  tools,
  message,
  hist,
  db
];

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
