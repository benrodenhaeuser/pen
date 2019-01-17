const frameTemplate = (index) => {
  const template = document.createElement('template');
  template.innerHTML = `
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
  makeShapeNode(id) {
    const node = document.createElement('div');
    node.classList.add('shape');
    node.dataset.id = id;
    node.dataset.type = 'shape';
    return node;
  },

  makeFrameNode(index, id) {
    const node = document.createElement('div');
    node.classList.add('frame');
    node.dataset.type = 'frame';
    node.dataset.id = id;
    node.appendChild(frameTemplate(index).content.cloneNode(true));
    return node;
  },

  makeListNode(id) {
    const node = document.createElement('li');
    node.innerHTML = `
      <li class="pure-menu-item doc-list-entry" data-type="doc-list-entry" data-id="${id}">
        <a href="#" class="pure-menu-link">${id}</a>
      </li>
    `;
    return node;
  },
};

export { nodeFactory };
