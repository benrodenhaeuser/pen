const mount = ($node, $mountPoint) => {
  $mountPoint.innerHTML = '';
  $mountPoint.appendChild($node);
};

export { mount };
