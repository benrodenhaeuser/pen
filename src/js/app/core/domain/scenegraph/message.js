import { Node } from './node.js';

const Message = Object.create(Node);
Message.type = 'message';

export { Message };
