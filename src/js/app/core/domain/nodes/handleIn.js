import { ControlNode } from './_.js';

const HandleIn = Object.create(ControlNode);

Object.assign(HandleIn, {
  create() {
    return ControlNode
      .create.bind(this)()
      .set({ type: 'handleIn' });
  },
});

export { HandleIn };
