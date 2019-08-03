import { createID } from '../domain/helpers/_.js';

const markupToDOM = markup => {
  const $svg = new DOMParser().parseFromString(markup, 'image/svg+xml')
    .documentElement;

  if ($svg instanceof SVGElement) {
    addKeys($svg);
    return $svg;
  } else {
    return null;
  }
};

const addKeys = $node => {
  $node.key = createID();

  for (let $child of $node.children) {
    addKeys($child);
  }
};

export { markupToDOM };
