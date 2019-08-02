import { Node } from './_.js';

const Store = Object.create(Node);
Store.type = 'store';

Object.defineProperty(Store, 'message', {
  get() {
    return this.root.findDescendant(node => node.type === 'message');
  },
});

Object.defineProperty(Store, 'canvas', {
  get() {
    return this.root.findDescendant(node => node.type === 'canvas');
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

Object.defineProperty(Store, 'syntaxTree', {
  get() {
    return this.root.findDescendant(node => node.type === 'markupNode');
  },
});

export { Store };
