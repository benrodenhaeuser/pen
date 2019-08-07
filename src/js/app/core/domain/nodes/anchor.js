import { ControlNode } from './_.js';
import { types } from './_.js';

const Anchor = Object.create(ControlNode);

Object.assign(Anchor, {
  create() {
    return ControlNode.create
      .bind(this)()
      .set({ type: types.ANCHOR });
  },
});

export { Anchor };
