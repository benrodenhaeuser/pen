import { Node } from './_.js';
import { types } from './_.js';

const Tool = Object.create(Node);
Tool.defineProps(['name', 'iconPath', 'toolType']);

Object.assign(Tool, {
  create(opts = {}) {
    return Node.create
      .bind(this)()
      .set({
        type: types.Tool,
      })
      .set(opts);
  },
});

export { Tool };
