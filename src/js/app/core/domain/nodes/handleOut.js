import { ControlNode } from './_.js';

const HandleOut = Object.create(ControlNode);

Object.assign(HandleOut, {
  create() {
    return ControlNode.create
      .bind(this)()
      .set({ type: 'handleOut' });
  },
});

export { HandleOut };
