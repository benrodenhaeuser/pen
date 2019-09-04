const resize = (func, source) => {
  func({
    source: source,
    type: 'resize',
    width: document.querySelector('#canvas-wrapper').clientWidth,
  });
};

export { resize };
