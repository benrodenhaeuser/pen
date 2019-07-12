import { Node } from './node.js';

const Anchor    = Object.create(Node);
const HandleIn  = Object.create(Node);
const HandleOut = Object.create(Node);
const Doc        = Object.create(Node);
const Docs       = Object.create(Node); // TODO: get rid of this?
const Store      = Object.create(Node); // TODO: get rid of this?
const Message    = Object.create(Node); // TODO: get rid of this?
const Text       = Object.create(Node); // TODO: get rid of this?
const Identifier = Object.create(Node); // TODO: get rid of this?

Anchor.type     = 'anchor';
HandleIn.type   = 'handleIn';
HandleOut.type  = 'handleOut';
Doc.type        = 'doc';
Store.type      = 'store';
Docs.type       = 'docs';
Message.type    = 'message';
Text.type       = 'text';
Identifier.type = 'identifier';

export {
  Anchor,
  HandleIn,
  HandleOut,
  Doc,
  Store,
  Docs,
  Message,
  Text,
  Identifier
};
