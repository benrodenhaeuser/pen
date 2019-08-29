import { Node } from './_.js';
import { types } from './_.js';

const SceneNode = Object.create(Node);

Object.assign(SceneNode, {
  invalidateCache() {
    for (let ancestor of this.graphicsAncestors) {
      ancestor.cache = {};
    }
  },
});

Object.defineProperty(SceneNode, 'canvas', {
  get() {
    return this.findAncestor(node => node.type === types.CANVAS);
  },
});

Object.defineProperty(SceneNode, 'doc', {
  get() {
    return this.findAncestor(node => node.type === types.DOC);
  },
});

export { SceneNode };
