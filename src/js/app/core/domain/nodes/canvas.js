import { GraphicsNode } from './_.js';
import { Shape } from './_.js';
import { Line } from './_.js';
import { Token } from './_.js';
import { types } from './_.js';
import { comps } from '../components/_.js';
import { MarkupRoot } from './_.js';

const Canvas = Object.create(GraphicsNode);
Canvas.defineProps(['viewBox', 'xmlns', 'cursor']);

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
    }
  },

  findSelection() {
    return this.findDescendant(node => node.class.includes('selected'));
  },

  removeSelection() {
    const selected = this.findSelection();

    if (selected) {
      selected.class = selected.class.remove('selected');
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

    for (let ancestor of graphicsNode.shapeOrGroupAncestors) {
      ancestor.computeBounds();
    }
  },

  setCursor(input, stateDescription) {
    const mode = stateDescription.mode;
    const label = stateDescription.label;
    const update = stateDescription.update;
    const inputType = input.type;
    const inputTarget = input.target;

    if (mode === 'pen') {
      this.activateCursor('penCursor');
    }

    if (mode === 'select' && label === 'idle' && inputType === 'mousemove') {
      switch (inputTarget) {
        case 'dot':
          this.activateCursor('rotationCursor');
          break;
        case 'nw-corner':
          this.activateCursor('scaleCursorSE');
          break;
        case 'se-corner':
          this.activateCursor('scaleCursorSE');
          break;
        case 'ne-corner':
          this.activateCursor('scaleCursorNE');
          break;
        case 'sw-corner':
          this.activateCursor('scaleCursorNE');
          break;
        case 'group':
          // only visualize group as shiftable if "closed":
          const node = this.findDescendantByKey(input.key);
          if (node && node.class.includes('focus')) {
            this.activateCursor('shiftableCursor');
          } else {
            this.activateCursor('selectCursor');
          }
          break;
        case 'shape':
          this.activateCursor('shiftableCursor');
          break;
        case 'curve':
          this.activateCursor('shiftableCursor');
          break;
        case 'canvas':
          this.activateCursor('selectCursor');
          break;
      }
    }

    // two special cases:

    // shift/shiftable cursors:
    if (update === 'select') {
      this.activateCursor('shiftCursor');
    } else if (this.cursor === 'shiftCursor' && update === 'release') {
      this.activateCursor('shiftableCursor');
    }

    // escape from penMode (need selectCursor *immediately*):
    if (input.target === 'esc') {
      this.activateCursor('selectCursor');
    }
  },

  activateCursor(cursorName) {
    this.class = this.class.remove(this.cursor).add(cursorName);
    this.cursor = cursorName;
  },

  mountShape() {
    const shape = Shape.create();
    this.mount(shape);
    return shape;
  },

  toTags() {
    const open = Line.create({ indent: 0 }).mount(
      Token.create({
        markup: `<svg xmlns="${
          this.xmlns
        }" viewBox="${this.viewBox.toString()}">`,
        key: this.key,
      })
    );

    const close = Line.create({ indent: 0 }).mount(
      Token.create({
        markup: '</svg>',
        key: this.key,
      })
    );

    return () => {
      return MarkupRoot.create().mount(
        open,
        ...this.children.flatMap(child => child.tags()),
        close
      );
    };
  },

  toComponent() {
    const canvas = comps.canvas(this);

    return () => {
      canvas.children = this.children.map(child => child.renderElement());
      return canvas;
    };
  },

  renderTags() {
    return this.tags(); // TODO: tags is an odd name for a *function* that returns tags!
  },
});

export { Canvas };
