import { Node } from './_.js';
import { types } from './_.js';

const Message = Object.create(Node);
Message.defineProps(['text']);

Object.assign(Message, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({ type: types.MESSAGE })
      .set(opts);
  },
});

export { Message };
