import { ControlNode } from './_.js';

const Anchor = Object.create(ControlNode);

Object.assign(Anchor, {
  create() {
    return ControlNode
      .create.bind(this)()
      .set({ type: 'anchor' });
  },
});

export { Anchor };
