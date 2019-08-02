import { Node } from './_.js';

const Message = Object.create(Node);

Object.assign(Message, {
  create() {
    return Node.create
      .bind(this)()
      .set({ type: 'message' });
  },
});

export { Message };
