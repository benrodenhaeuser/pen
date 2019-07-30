import { Node } from './_.js';

const Identifier = Object.create(Node);
Identifier.type = 'identifier';

export { Identifier };
