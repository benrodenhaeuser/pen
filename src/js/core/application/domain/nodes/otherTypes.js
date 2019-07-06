import { Node } from './node.js';

const Anchor    = Object.create(Node);
const HandleIn  = Object.create(Node);
const HandleOut = Object.create(Node);
const Store      = Object.create(Node);
const Doc        = Object.create(Node);
const Docs       = Object.create(Node);
const Markup     = Object.create(Node);
const Message    = Object.create(Node);
const Text       = Object.create(Node);
const Identifier = Object.create(Node);

Anchor.type    = 'anchor';
HandleIn.type  = 'handleIn';
HandleOut.type = 'handleOut';
Store.type      = 'store';
Doc.type        = 'doc';
Docs.type       = 'docs';
Markup.type     = 'markup';
Message.type    = 'message';
Text.type       = 'text';
Identifier.type = 'identifier';

export {
  Anchor,
  HandleIn,
  HandleOut,
  Store,
  Doc,
  Docs,
  Markup,
  Message,
  Text,
  Identifier
};
