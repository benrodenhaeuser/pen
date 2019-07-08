import { Node } from './node.js';
import { ASTNode } from '../../ports/export/ast.js';

const Scene = Object.create(Node);
Scene.type  = 'scene';

const xmlns = 'http://www.w3.org/2000/svg';

Scene.toVDOMNode = function() {
  return {
    tag:      'svg',
    children: [],
    props: {
      'data-key':   this.key,
      'data-type': 'content',
      'viewBox':    this.viewBox.toString(),
      xmlns:       'http://www.w3.org/2000/svg',
    },
  };
};

Scene.toSVGNode = function() {
  return {
    tag:      'svg',
    children: [],
    props: {
      'viewBox': this.viewBox.toString(),
      xmlns:     xmlns,
    },
  };
};

Scene.toASTNodes = function() {
  const open = ASTNode.create();
  open.markup = `<svg xmlns="${xmlns}" viewBox="${this.viewBox.toString()}">`;
  open.key = this.key;

  const close = ASTNode.create();
  close.markup = '</svg>';
  close.key = this.key;

  return {
    open: open,
    close: close,
  }
};

// Scene.toOpeningTag = function() {
//   const astNode = ASTNode.create();
//   astNode.markup = `<svg xmlns="${xmlns}" viewBox="${this.viewBox.toString()}">`;
//   astNode.key = this.key;
//   return astNode;
// };
//
// Scene.toClosingTag = function() {
//   const astNode = ASTNode.create();
//   astNode.markup = '</svg>';
//   astNode.key = this.key;
//   return astNode;
// };

export { Scene }
