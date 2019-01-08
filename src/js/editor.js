import { model } from './model.js';
import { actions } from './actions.js';
import { blueprint } from './blueprint.js';
import { machine } from './machine.js';
import { canvas } from './canvas.js';
import { nodeFactory } from './nodeFactory.js';

// sample data - to be read from db
const json = '[[{"top":200,"left":200,"width":100,"height":100},{"top":320,"left":320,"width":100,"height":100}]]';

const editor = {
  init(event) {
    model.init(json);
    actions.init(model);
    machine.init(model, actions, blueprint);
    canvas.init(machine, nodeFactory);

    machine.dispatch(event);
  },
};

export { editor };
