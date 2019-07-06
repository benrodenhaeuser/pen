import { Node } from './node.js';

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

Group.toOpeningTag = function() {
  return {
    markup: '<g>',
    key: this.key,
  };
};

Group.toClosingTag = function() {
  return {
    markup: '</g>',
    key: this.key,
  };
};

export { Group };
