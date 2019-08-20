import { GraphicsNode } from './_.js';
import { types } from './_.js';
import { Matrix } from '../geometry/_.js';
import { Line } from './_.js';
import { Token } from './_.js';
import { comps } from '../components/_.js';

const Group = Object.create(GraphicsNode);

Object.assign(Group, {
  create(opts = {}) {
    return GraphicsNode.create
      .bind(this)()
      .set({ type: types.GROUP })
      .set(opts);
  },

  toTags(level) {
    let openMarkup;
    if (this.transform) {
      openMarkup = `<g transform="${this.transform.toString()}">`;
    } else {
      openMarkup = `<g>`;
    }

    const open = Line
      .create({ indent: this.height })
      .mount(
        Token.create({
          markup: openMarkup,
          key: this.key,
          class: this.class,
        })
      );

    const close = Line
      .create({ indent: this.height })
      .mount(
        Token.create({
          markup: '</g>',
          key: this.key,
          class: this.class,
        })
      );

    return () => [open, ...this.children.flatMap(child => child.tags()), close];
  },

  toComponent() {
    const wrapper = comps.wrapper(this);
    const group = comps.group(this);
    const outerUI = comps.outerUI(this);
    wrapper.children.push(group);
    wrapper.children.push(outerUI);

    return () => {
      group.children = this.children.map(child => child.renderElement());
      return wrapper;
    };
  },
});

export { Group };
