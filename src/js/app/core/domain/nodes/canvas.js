import { GraphicsNode } from './_.js';
import { Shape } from './_.js';
import { types } from './_.js';

const Canvas = Object.create(GraphicsNode);
Canvas.defineProps(['viewBox', 'xmlns']);

Object.assign(Canvas, {
  create(opts = {}) {
    return GraphicsNode.create
      .bind(this)()
      .set({
        type: types.CANVAS,
        xmlns: 'http://www.w3.org/2000/svg',
      })
      .set(opts);
  },

  findFocus() {
    return this.findDescendant(node => node.class.includes('focus'));
  },

  removeFocus() {
    const focus = this.findFocus();

    if (focus) {
      focus.class.remove('focus');
    }
  },

  findSelection() {
    return this.findDescendant(node => node.class.includes('selected'));
  },

  removeSelection() {
    const selected = this.findSelection();

    if (selected) {
      selected.class.remove('selected');
    }

    this.updateFrontier();
  },

  findPen() {
    return this.findDescendant(node => node.class.includes('pen'));
  },

  removePen() {
    const pen = this.findPen();

    if (pen) {
      pen.class.remove('pen');
      this.removePenTip();
    }
  },

  findPenTip() {
    return this.findDescendant(node => node.class.includes('tip'));
  },

  removePenTip() {
    const penTip = this.findPenTip();

    if (penTip) {
      penTip.class.remove('tip');
      penTip.parent.class.remove('containsTip');
    }
  },

  findFrontier() {
    return this.findDescendants(node => node.class.includes('frontier'));
  },

  removeFrontier() {
    for (let node of this.findFrontier()) {
      node.class.remove('frontier');
    }
  },

  updateFrontier() {
    this.removeFrontier();

    if (this.findSelection() && this.findSelection() !== this) {
      const selected = this.findSelection();
      selected.class = selected.class.add('frontier');
      let node = selected;

      do {
        for (let sibling of node.siblings) {
          sibling.class = sibling.class.add('frontier');
        }
        node = node.parent;
      } while (node.parent.type !== types.DOC);
    } else {
      for (let child of this.children) {
        child.class = child.class.add('frontier');
      }
    }
  },

  updateBounds(graphicsNode) {
    for (let child of graphicsNode.children) {
      child.computeBounds();
    }

    for (let ancestor of graphicsNode.graphicsAncestors) {
      ancestor.computeBounds();
    }
  },

  appendShape() {
    const shape = Shape.create();
    this.append(shape);
    return shape;
  },

  toVDOMNode() {
    return {
      tag: 'svg',
      children: [],
      props: {
        'data-key': this.key,
        'data-type': this.type,
        viewBox: this.viewBox.toString(),
        xmlns: this.xmlns,
        class: this.class.toString(),
      },
    };
  },

  toTags() {
    const tags = {
      open: [],
      close: []
    }

    tags.open.push(
      Line
        .create({ indent: 0 })
        .append(
          Token.create({
            markup: `<svg xmlns="${this.xmlns}" viewBox="${this.viewBox.toString()}">`,
            key: this.key,
          })
        )
    );

    tags.close.push(
      Line
        .create({ indent: -1 })
        .append(
          Token.create({
            markup: '</svg>',
            key: this.key,
          })
        )
    );

    return tags;
  },
});

export { Canvas };
