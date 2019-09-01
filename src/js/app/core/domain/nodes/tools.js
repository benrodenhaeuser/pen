import { Node } from './_.js';
import { types } from './_.js';

const Tools = Object.create(Node);

Object.assign(Tools, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({
        type: types.TOOLS,
      })
      .set(opts);
  },
});

export { Tools };
