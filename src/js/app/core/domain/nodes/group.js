import { GraphicsNode } from './_.js';
import { Matrix } from '../geometry/_.js';
import { SyntaxTree } from './_.js';

const Group = Object.create(GraphicsNode);
Group.type = 'group';

Group.toVDOMNode = function() {
  return {
    tag: 'g',
    children: [],
    props: {
      'data-key': this.key,
      'data-type': 'group',
      transform: this.transform.toString(),
      class: this.class.toString(),
    },
  };
};

Group.toSVGNode = function() {
  const svgNode = {
    tag: 'g',
    children: [],
    props: {},
  };

  if (!this.transform.equals(Matrix.identity())) {
    svgNode.props.transform = this.transform.toString();
  }

  return svgNode;
};

Group.toASTNodes = function() {
  const open = SyntaxTree.create();

  if (!this.transform.equals(Matrix.identity())) {
    open.markup = `<g transform="${this.transform.toString()}">`;
  } else {
    open.markup = '<g>';
  }

  open.key = this.key;
  open.class = this.class;

  const close = SyntaxTree.create();
  close.markup = '</g>';
  close.key = this.key;

  return {
    open: open,
    close: close,
  };
};

export { Group };
