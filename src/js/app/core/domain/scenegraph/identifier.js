import { Node } from './node.js';

const Identifier = Object.create(Node);
Identifier.type = 'identifier';

export { Identifier };
