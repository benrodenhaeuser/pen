import { Node } from './node.js';

const Store = Object.create(Node);
Store.type = 'store';

Object.defineProperty(Store, 'message', {
  get() {
    return this.root.findDescendant(node => node.type === 'message');
  },
});

Object.defineProperty(Store, 'scene', {
  get() {
    return this.root.findDescendant(node => node.type === 'scene');
  },
});

Object.defineProperty(Store, 'docs', {
  get() {
    return this.root.findDescendant(node => node.type === 'docs');
  },
});

Object.defineProperty(Store, 'doc', {
  get() {
    return this.root.findDescendant(node => node.type === 'doc');
  },
});

export { Store };
