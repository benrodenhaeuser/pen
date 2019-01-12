import { model } from './model.js'; // import here?
import { actions } from './actions.js'; // import here?
import { blueprint } from './blueprint.js'; // import here?
import { nodeFactory } from './nodeFactory.js'; // import here?

import { machine } from './machine.js';
import { ui } from './ui.js';
import { db } from './db.js';

const app = {
  init() {
    model.init(); // creates "empty" project
    actions.init(model);
    machine.init(model, actions, blueprint);
    ui.init(machine, nodeFactory);
    db.init(machine);
  },
};

document.addEventListener('DOMContentLoaded', app.init);

// TODO

// Notes on object structure:

// machine:
// - state
// - actions (transform the state)

// machine.state:
// - label ('idle' etc)
// - project (an instance of the model)
// - aux (for more temporary data)

// the ui needs the nodeFactory, but I am not sure we should pass it in here.
// we can import it in the ui file
