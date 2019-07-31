import { GraphicsNode } from './_.js';
import { SyntaxTree } from './_.js';

const xmlns = 'http://www.w3.org/2000/svg';

const Canvas = Object.create(GraphicsNode);
Canvas.type = 'canvas';

Object.assign(Canvas, {
  findFocus() {
    return this.findDescendant(
      node => node.class.includes('focus')
    );
  },

  removeFocus() {
    const focus = this.findFocus();

    if (focus) {
      focus.class.remove('focus');
    }
  },

  findFrontier() {
    return this.findDescendants(
      node => node.class.includes('frontier')
    );
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
      } while (node.parent.type !== 'doc');
    } else {
      for (let child of this.children) {
        child.class = child.class.add('frontier');
      }
    }
  },

  findSelection() {
    return this.findDescendant(
      node => node.class.includes('selected')
    );
  },

  removeSelection() {
    const selected = this.findSelection();

    if (selected) {
      selected.class.remove('selected');
    }

    this.updateFrontier();
  },

  findEditing() {
    return this.findDescendant(
      node => node.class.includes('editing')
    );
  },

  removeEditing() {
    const editing = this.findEditing();

    if (editing) {
      editing.class.remove('editing');
    }
  },

  findPen() {
    return this.findDescendant(
      node => node.class.includes('pen')
    );
  },

  removePen() {
    const pen = this.findPen();

    if (pen) {
      pen.class.remove('pen');
    }
  },

  globallyUpdateBounds(graphicsNode) {
    for (let child of graphicsNode.children) {
      child.updateBounds();
    }

    for (let ancestor of graphicsNode.graphicsAncestors) {
      ancestor.updateBounds();
    }
  },

  toVDOMNode() {
    return {
      tag: 'svg',
      children: [],
      props: {
        'data-key': this.key,
        'data-type': 'canvas',
        viewBox: this.viewBox.toString(),
        xmlns: 'http://www.w3.org/2000/svg',
        class: this.class.toString(),
      },
    };
  },

  toSVGNode() {
    return {
      tag: 'svg',
      children: [],
      props: {
        viewBox: this.viewBox.toString(),
        xmlns: xmlns,
      },
    };
  },

  toASTNodes() {
    const open = SyntaxTree.create();
    open.markup = `<svg xmlns="${xmlns}" viewBox="${this.viewBox.toString()}">`;
    open.key = this.key;

    const close = SyntaxTree.create();
    close.markup = '</svg>';
    close.key = this.key;

    return {
      open: open,
      close: close,
    };
  },
});

Object.defineProperty(Canvas, 'viewBox', {
  get() {
    return this.payload.viewBox;
  },
  set(value) {
    this.payload.viewBox = value;
  },
});

export { Canvas };
