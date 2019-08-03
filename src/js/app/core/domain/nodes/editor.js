import { Node } from './_.js';

const Editor = Object.create(Node);

Object.assign(Editor, {
  create() {
    return Node.create
      .bind(this)()
      .set({ type: 'editor' });
  },
});

Object.defineProperty(Editor, 'message', {
  get() {
    return this.root.findDescendant(node => node.type === 'message');
  },
});

Object.defineProperty(Editor, 'canvas', {
  get() {
    return this.root.findDescendant(node => node.type === 'canvas');
  },
});

Object.defineProperty(Editor, 'docs', {
  get() {
    return this.root.findDescendant(node => node.type === 'docs');
  },
});

Object.defineProperty(Editor, 'doc', {
  get() {
    return this.root.findDescendant(node => node.type === 'doc');
  },
});

Object.defineProperty(Editor, 'syntaxTree', {
  get() {
    return this.root.findDescendant(node => node.type === 'markupNode');
  },
});

export { Editor };
