// TODO frameTemplate makes svg node by simply copying svg markup into the template.

const frameTemplate = (index, shape, frame) => {
  const template = document.createElement('template');
  template.innerHTML = `
    <div class="svg">${shape.markup}</div>
    <div class="frame-body" data-type="frame" data-id="${frame._id}"></div>
    <div class="rotate-handle" data-type="rotate-handle">
    </div>
    <div class="corner top-left" data-type="top-left-corner">
      <div class="center"></div>
    </div>
    <div class="corner top-right" data-type="top-right-corner">
      <div class="center"></div>
    </div>
    <div class="corner bottom-left" data-type="bot-left-corner">
      <div class="center"></div>
    </div>
    <div class="corner bottom-right" data-type="bot-right-corner">
      <div class="center"></div>
    </div>
    <div class="counter" data-type="counter">${index}</div>
    <a class="deleteLink" href="#" data-type="deleteLink">&times;</a>
  `;
  return template;
};

const nodeFactory = {
  makeShapeNode(state, id) {
    const node = document.createElement('div');
    node.classList.add('shape');
    node.dataset.id = id;
    node.dataset.type = 'shape';
    return node;
  },

  makeFrameNode(index, shape, frame) {
    const node = document.createElement('div');
    node.classList.add('frame');
    // node.dataset.type = 'frame';
    node.dataset.id = frame._id;
    node.appendChild(frameTemplate(index, shape, frame).content.cloneNode(true));

    const handle = node.querySelector('.rotate-handle');
    handle.dataset.id = frame._id;

    return node;
  },

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
