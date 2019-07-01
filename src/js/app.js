import { core    } from './core/core.js';
import { canvas  } from './modules/ui/canvas.js';
import { editor  } from './modules/ui/editor.js';
import { tools   } from './modules/ui/tools.js';
import { message } from './modules/ui/message.js';
import { db      } from './modules/db.js';
import { hist    } from './modules/history.js';

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
