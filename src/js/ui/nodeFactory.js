const nodeFactory = {
  makeDocListNode(id) {
    const node = document.createElement('li');
    node.innerHTML = `
      <a href="#" class="pure-menu-link"  data-type="doc-list-entry" data-id="${id}">${id}</a>
    `;
    node.classList.add('pure-menu-item');

    return node;
  },

  makeNavigatorNode(doc) {
    const node = document.createElement('ul');
    node.classList.add('navigator-list');
    // generate innerHTML in a loop
  },

  makeInspectorNode(frame) {
    const node = document.createElement('ul');
    node.classList.add('inspector-list');

    if (frame !== undefined) {
      node.innerHTML = `
        <li>x: ${frame.x}</li>
        <li>y: ${frame.y}</li>
        <li>width: ${frame.width}</li>
        <li>height: ${frame.height}</li>
        <li>angle: ${frame.angle}</li>
      `;
    }

    return node;
  }
};

export { nodeFactory };
