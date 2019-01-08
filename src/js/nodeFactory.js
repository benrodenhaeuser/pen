const frameTemplate = (index) => {
  const template = document.createElement('template');
  template.innerHTML = `
    <div class="corner top-left" data-type="corner" data-corner="top-left">
      <div class="center"></div>
    </div>
    <div class="corner top-right" data-type="corner" data-corner="top-right">
      <div class="center"></div>
    </div>
    <div class="corner bottom-left" data-type="corner" data-corner="bottom-left">
      <div class="center"></div>
    </div>
    <div class="corner bottom-right" data-type="corner" data-corner="bottom-right">
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
};

export { nodeFactory };
