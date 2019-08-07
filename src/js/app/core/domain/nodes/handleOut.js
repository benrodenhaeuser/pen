import { ControlNode } from './_.js';
import { types } from './_.js';

const HandleOut = Object.create(ControlNode);

Object.assign(HandleOut, {
  create() {
    return ControlNode.create
      .bind(this)()
      .set({ type: types.HANDLEOUT });
  },
});

export { HandleOut };
