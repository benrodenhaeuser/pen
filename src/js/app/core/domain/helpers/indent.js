const indent = level => {
  let pad = '';

  for (let i = 0; i < level; i += 1) {
    pad += '  ';
  }

  return pad;
};

export { indent };
