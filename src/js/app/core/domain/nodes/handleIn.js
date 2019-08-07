import { ControlNode } from './_.js';
import { types } from './_.js';

const HandleIn = Object.create(ControlNode);

Object.assign(HandleIn, {
  create() {
    return ControlNode.create
      .bind(this)()
      .set({ type: types.HANDLEIN });
  },
});

export { HandleIn };
