import { Node } from './dir.js';

const Identifier = Object.create(Node);
Identifier.type = 'identifier';

export { Identifier };
