import { ControlNode } from './_.js';
import { types } from './_.js';

const HandleOut = Object.create(ControlNode);

Object.assign(HandleOut, {
  create(opts = {}) {
    return ControlNode.create
      .bind(this)()
      .set({ type: types.HANDLEOUT })
      .set(opts);
  },
});

export { HandleOut };
