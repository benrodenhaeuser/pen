import { Graphics } from './graphics.js';
import { Matrix } from '../geometry.js';
import { SyntaxTree } from '../syntaxtree.js';

const Group = Object.create(Graphics);
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
