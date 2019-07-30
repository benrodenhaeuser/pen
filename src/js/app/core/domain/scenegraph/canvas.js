import { GraphicsNode } from './_.js';
import { SyntaxTree } from '../syntaxtree/syntaxtree.js';

const Canvas = Object.create(GraphicsNode);
Canvas.type = 'canvas';

const xmlns = 'http://www.w3.org/2000/svg';

Canvas.toVDOMNode = function() {
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
};

Canvas.toSVGNode = function() {
  return {
    tag: 'svg',
    children: [],
    props: {
      viewBox: this.viewBox.toString(),
      xmlns: xmlns,
    },
  };
};

Canvas.toASTNodes = function() {
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
};

export { Canvas };
