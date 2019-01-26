SVGElement.prototype.getTransformToElement =
  SVGElement.prototype.getTransformToElement || function(element) {
    return element.getScreenCTM().inverse().multiply(this.getScreenCTM());
  };

const parse = (markup) => {
  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(markup, "image/svg+xml");
  const svg = svgDocument.documentElement;
  return svg;
};

const explode = (svg) => {
  document.body.appendChild(svg);

  const isSvgGroup = (element) => element.tagName === 'g';
  const rootGroups = Array.from(svg.children).filter(isSvgGroup);
  const svgs       = rootGroups.map(toSVG);

  svg.remove();
  return svgs;
};

const toSVG = (groupElement) => {
  const owner = groupElement.ownerSVGElement;
  const svg   = document.createElementNS(owner.namespaceURI,'svg');
  const css   = Array.from(owner.querySelectorAll('style, defs'));

  for (let element of css) {
    svg.appendChild(element.cloneNode(true));
  }

  svg.appendChild(groupElement.cloneNode(true));

  const bb = globalBoundingBox(groupElement);
  svg.setAttribute('viewBox',[bb.x, bb.y, bb.width, bb.height].join(' '));
  return svg;
};

const globalBoundingBox = (element) => {
  let   bb    = element.getBBox();
  const owner = element.ownerSVGElement;
  const m     = element.getTransformToElement(owner);

  const points = [
    owner.createSVGPoint(), owner.createSVGPoint(),
    owner.createSVGPoint(), owner.createSVGPoint()
  ];

  points[0].x = bb.x;            points[0].y = bb.y;
  points[1].x = bb.x + bb.width; points[1].y = bb.y;
  points[2].x = bb.x + bb.width; points[2].y = bb.y + bb.height;
  points[3].x = bb.x;            points[3].y = bb.y + bb.height;

  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  points.forEach((point) => {
    point = point.matrixTransform(m);
    xMin  = Math.min(xMin, point.x);
    xMax  = Math.max(xMax, point.x);
    yMin  = Math.min(yMin, point.y);
    yMax  = Math.max(yMax, point.y);
  });

  bb        = {};
  bb.x      = xMin;
  bb.width  = xMax - xMin;
  bb.y      = yMin;
  bb.height = yMax - yMin;

  return bb;
};

const getCoordinates = (svg) => {
  const coordinates = svg.getAttribute('viewBox').split(' ');

  return {
      x:      Number(coordinates[0]),
      y:      Number(coordinates[1]),
      width:  Number(coordinates[2]),
      height: Number(coordinates[3])
    };
};

const toString = (svg) => {
  return new XMLSerializer().serializeToString(svg);
}

const output = (svg) => {
  return Object.assign(getCoordinates(svg), { markup: toString(svg) });
};

const svgSplitter = {
  split(markup) {
    return explode(parse(markup)).map(output);
  }
};

export { svgSplitter };
