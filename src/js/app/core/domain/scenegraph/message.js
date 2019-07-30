import { Node } from './dir.js';

const Message = Object.create(Node);
Message.type = 'message';

export { Message };
