import { GraphicsNode } from './_.js';
import { Shape } from './_.js';
import { Line } from './_.js';
import { Token } from './_.js';
import { types } from './_.js';
import { stuff } from '../components/_.js';
import { MarkupRoot } from './_.js';

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
      .set({ height: 0 })
      .set(opts);
  },

  findFocus() {
    return this.findDescendant(node => node.class.includes('focus'));
  },

  removeFocus() {
    const focus = this.findFocus();

    if (focus) {
      focus.class = focus.class.remove('focus');
      focus.invalidateCache();
    }
  },

  findSelection() {
    return this.findDescendant(node => node.class.includes('selected'));
  },

  removeSelection() {
    const selected = this.findSelection();

    if (selected) {
      selected.class = selected.class.remove('selected');
      selected.invalidateCache();
    }

    this.updateFrontier();
  },

  findPen() {
    return this.findDescendant(node => node.class.includes('pen'));
  },

  removePen() {
    const pen = this.findPen();

    if (pen) {
      pen.class = pen.class.remove('pen');
      this.removePenTip();
      pen.invalidateCache();
    }
  },

  findPenTip() {
    return this.findDescendant(node => node.class.includes('tip'));
  },

  removePenTip() {
    const penTip = this.findPenTip();

    if (penTip) {
      penTip.class = penTip.class.remove('tip');
      penTip.parent.class = penTip.parent.class.remove('containsTip');
    }
  },

  findFrontier() {
    return this.findDescendants(node => node.class.includes('frontier'));
  },

  removeFrontier() {
    for (let node of this.findFrontier()) {
      node.class = node.class.remove('frontier');
      node.invalidateCache();
    }
  },

  updateFrontier() {
    this.removeFrontier();

    if (this.findSelection() && this.findSelection() !== this) {
      const selected = this.findSelection();
      selected.class = selected.class.add('frontier');
      selected.invalidateCache();
      let node = selected;

      do {
        for (let sibling of node.siblings) {
          sibling.class = sibling.class.add('frontier');
          sibling.invalidateCache();
        }
        node = node.parent;
      } while (node.parent.type !== types.DOC);
    } else {
      for (let child of this.children) {
        child.class = child.class.add('frontier');
        child.invalidateCache();
      }
    }
  },

  updateBounds(graphicsNode) {
    for (let child of graphicsNode.children) {
      child.computeBounds();

      if (child.isGraphicsNode()) {
        child.invalidateCache();
      }
    }

    for (let ancestor of graphicsNode.graphicsAncestors) {
      ancestor.computeBounds();
      ancestor.invalidateCache();
    }
  },

  appendShape() {
    const shape = Shape.create();
    this.append(shape);
    return shape;
  },

  toTags() {
    const open = Line
      .create({ indent: 0 })
      .append(
        Token.create({
          markup: `<svg xmlns="${
            this.xmlns
          }" viewBox="${this.viewBox.toString()}">`,
          key: this.key,
        })
      );

    const close = Line
      .create({ indent: 0 })
      .append(
        Token.create({
          markup: '</svg>',
          key: this.key,
        })
      );

    return () => {
      return MarkupRoot
        .create()
        .append(
          open,
          ...this.children.flatMap(child => child.tags()),
          close
        );
    };
  },

  toComponent() {
    const canvas = stuff.canvas(this);

    return () => {
      canvas.children = this.children.map(child => child.renderElement());
      return canvas;
    };
  },

  // TODO: this should go to graphicsNode
  renderTags() {
    return this.tags(); // TODO: tags is an odd name for a *function* that returns tags!
  },
});

export { Canvas };
