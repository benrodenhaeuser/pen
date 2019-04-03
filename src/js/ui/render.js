const svgns = 'http://www.w3.org/2000/svg';
const xmlns = 'http://www.w3.org/2000/xmlns/';

const render = (vNode) => {
  const $node = document.createElementNS(svgns, vNode.tag);

  for (let [key, value] of Object.entries(vNode.props)) {
    if (key === 'xmlns') {
      $node.setAttributeNS(xmlns, key, value);
    } else {
      $node.setAttributeNS(null, key, value);
    }
  }

  for (let vChild of vNode.children) {
    $node.appendChild(render(vChild));
  }

  return $node;
};

export { render };
