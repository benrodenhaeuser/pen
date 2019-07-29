import { Node } from './node.js';

const Store = Object.create(Node);
Store.type = 'store';

Object.defineProperty(Node, 'message', {
  get() {
    return this.root.findDescendant(node => node.type === 'message');
  },
});

Object.defineProperty(Node, 'scene', {
  get() {
    return this.root.findDescendant(node => node.type === 'scene');
  },
});

Object.defineProperty(Node, 'docs', {
  get() {
    return this.root.findDescendant(node => node.type === 'docs');
  },
});

Object.defineProperty(Node, 'doc', {
  get() {
    return this.root.findDescendant(node => node.type === 'doc');
  },
});

export { Store };
