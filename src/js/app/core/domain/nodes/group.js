import { Node } from './node.js';
import { ASTNode } from '../../ports/export/ast.js';

const Group = Object.create(Node);
Group.type  = 'group';

Group.toVDOMNode = function() {
  return {
    tag:      'g',
    children: [],
    props: {
      'data-key':   this.key,
      'data-type': 'content',
      transform:   this.transform.toString(),
      class:       this.class.toString(),
    },
  };
};

Group.toSVGNode = function() {
  const svgNode = {
    tag:      'g',
    children: [],
    props:    {},
  };

  svgNode.props.transform = this.transform.toString();

  return svgNode;
};

Group.toASTNodes = function() {
  const open = ASTNode.create();
  open.markup = '<g>'; // TODO: transform
  open.key = this.key;

  const close = ASTNode.create();
  close.markup = '</g>';
  close.key = this.key;

  return {
    open: open,
    close: close,
  };
};

// Group.toOpeningTag = function() {
//   const astNode = ASTNode.create();
//   astNode.markup = '<g>'; // TODO: transform
//   astNode.key = this.key;
//   return astNode;
// };
//
// Group.toClosingTag = function() {
//   const astNode = ASTNode.create();
//   astNode.markup = '</g>';
//   astNode.key = this.key;
//   return astNode;
// };

export { Group };
