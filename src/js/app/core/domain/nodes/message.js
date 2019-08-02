import { Node } from './_.js';

const Message = Object.create(Node);
Message.defineProps(['text']);

Object.assign(Message, {
  create() {
    return Node.create
      .bind(this)()
      .set({ type: 'message' });
  },
});

export { Message };
