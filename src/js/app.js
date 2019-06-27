import { core    } from './core/core.js';
import { canvas  } from './periphery/ui/canvas.js';
import { editor  } from './periphery/ui/editor.js';
import { tools   } from './periphery/ui/tools.js';
import { message } from './periphery/ui/message.js';
import { db      } from './periphery/db.js';
import { hist    } from './periphery/history.js';

const components = [canvas, editor, tools, message, hist, db];

const app = {
  init() {
    core.init();

    for (let component of components) {
      component.init(core.state.export());
      component.bindEvents(core.compute.bind(core));
      core.attach(component.name, component.react.bind(component));
    }

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
