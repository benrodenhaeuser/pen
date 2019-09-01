import { Node } from './_.js';
import { types } from './_.js';

const Editor = Object.create(Node);

Object.assign(Editor, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({ type: types.EDITOR })
      .set(opts);
  },
});

Object.defineProperty(Editor, 'message', {
  get() {
    return this.root.findDescendant(node => node.type === types.MESSAGE);
  },
});

Object.defineProperty(Editor, 'canvas', {
  get() {
    return this.root.findDescendant(node => node.type === types.CANVAS);
  },
});

Object.defineProperty(Editor, 'tools', {
  get() {
    return this.root.findDescendant(node => node.type === types.TOOLS);
  },
});

Object.defineProperty(Editor, 'docs', {
  get() {
    return this.root.findDescendant(node => node.type === types.DOCS);
  },
});

Object.defineProperty(Editor, 'doc', {
  get() {
    return this.root.findDescendant(node => node.type === types.DOC);
  },
});

export { Editor };
