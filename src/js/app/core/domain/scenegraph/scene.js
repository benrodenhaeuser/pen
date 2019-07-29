import { Graphics } from './graphics.js';
import { SyntaxTree } from '../syntaxtree/syntaxtree.js';

const Scene = Object.create(Graphics);
Scene.type = 'scene';

const xmlns = 'http://www.w3.org/2000/svg';

Scene.toVDOMNode = function() {
  return {
    tag: 'svg',
    children: [],
    props: {
      'data-key': this.key,
      'data-type': 'scene',
      viewBox: this.viewBox.toString(),
      xmlns: 'http://www.w3.org/2000/svg',
      class: this.class.toString(),
    },
  };
};

Scene.toSVGNode = function() {
  return {
    tag: 'svg',
    children: [],
    props: {
      viewBox: this.viewBox.toString(),
      xmlns: xmlns,
    },
  };
};

Scene.toASTNodes = function() {
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

export { Scene };
