// input: a string (svg markup)
// output: a parse tree representing the surface syntax of the svg markup

const markupToAST = (markup) => {
  const $svg = new DOMParser()
    .parseFromString(markup, "image/svg+xml")
    .documentElement;

  if ($svg instanceof SVGElement) {
    const ast = ASTNode.create();
    buildTree($svg, ast);
    return ast;
  } else {
    return null;
  }
};

// $node - a DOM node, aNode - an ast node
const buildTree = ($node, aNode) => {
  // do the work ...
};


export { markupToPTree };
