(function () {
  'use strict';

  const clock = {
    tick() {
      this.time += 1;
    },

    init(time) {
      this.time = time || 0;
      return this;
    },
  };

  const Matrix = {
    multiply(other) {
      const m = math.multiply(this.m, other.m);
      return Object.create(Matrix).init(m);

      // const thisRows  = this.m.length;
      // const thisCols  = this.m[0].length;
      // const otherRows = other.m.length;
      // const otherCols = other.m[0].length;
      // const m         = new Array(thisRows);
      //
      // for (let r = 0; r < thisRows; r += 1) {
      //   m[r] = new Array(otherCols);
      //
      //   for (let c = 0; c < otherCols; c += 1) {
      //     m[r][c] = 0;
      //
      //     for (let i = 0; i < thisCols; i += 1) {
      //       m[r][c] += this.m[r][i] * other.m[i][c];
      //     }
      //   }
      // }
    },

    invert() {
      const m = JSON.parse(JSON.stringify(this.m));
      return Object.create(Matrix).init(math.inv(m));
    },

    identity() {
      const m = JSON.parse(JSON.stringify(
        [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1]
        ]
      ));

      return Object.create(Matrix).init(m);
    },

    rotation(angle, origin) {
      const [originX, originY] = origin;
      const sin                = Math.sin(angle);
      const cos                = Math.cos(angle);

      const m = [
        [cos, -sin, -originX * cos + originY * sin + originX],
        [sin,  cos, -originX * sin - originY * cos + originY],
        [0,    0,    1                                      ]
      ];

      return Object.create(Matrix).init(m);
    },

    translation(...vector) {
      const [vectorX, vectorY] = vector;

      const m = [
        [1, 0, vectorX],
        [0, 1, vectorY],
        [0, 0, 1      ]
      ];

      return Object.create(Matrix).init(m);
    },

    scale(factor, origin) {
      const [originX, originY] = origin;

      const m = [
        [factor, 0,      originX - factor * originX],
        [0,      factor, originY - factor * originY],
        [0,      0,      1                         ]
      ];

      return Object.create(Matrix).init(m);
    },

    // TODO: not general enough
    toVector() {
      return [
        this.m[0][0], this.m[1][0], this.m[0][1],
        this.m[1][1], this.m[0][2], this.m[1][2]
      ];
    },

    toArray() {
      return this.m;
    },

    fromDOMMatrix($matrix) {
      this.m = [
        [$matrix.a, $matrix.c, $matrix.e],
        [$matrix.b, $matrix.d, $matrix.f],
        [0,         0,         1        ]
      ];

      return this;
    },

    toJSON() {
      return this.toAttributeString();
    },

    toAttributeString() {
      return `matrix(${this.toVector()})`;
    },

    init(m) {
      this.m = m;
      return this;
    },
  };

  const ClassList = {
    add(className) {
      this.set.add(className);
    },

    includes(className) {
      return this.set.has(className);
    },

    remove(className) {
      this.set.delete(className);
    },

    toJSON() {
      return Array.from(this.set).join(' ');
    },

    init(classList) {
      classList = classList ? classList : [];
      this.set = new Set(classList);
      return this;
    },
  };

  const createID = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);
    return randomString + timestamp;
  };

  const Node = {
    findAncestor(predicate) {
      if (predicate(this)) {
        return this;
      } else if (this.parent === null) {
        return null;
      } else {
        return this.parent.findAncestor(predicate);
      }
    },

    findAncestors(predicate, resultList = []) {
      if (this.parent === null) {
        return resultList;
      } else {
        if (predicate(this.parent)) {
          resultList.push(this.parent);
        }
        return this.parent.findAncestors(predicate, resultList);
      }
    },

    findDescendant(predicate) {
      if (predicate(this)) {
        return this;
      } else {
        for (let child of this.children) {
          let val = child.findDescendant(predicate);
          if (val) { return val; }
        }
      }

      return null;
    },

    findDescendants(predicate, resultList = []) {
      if (predicate(this)) {
        resultList.push(this);
      }

      for (let child of this.children) {
        child.findDescendants(predicate, resultList);
      }

      return resultList;
    },

    get root() {
      return this.findAncestor((node) => {
        return node.parent === null;
      });
    },

    get ancestors() {
      return this.findAncestors(node => true);
    },

    get descendants() {
      return this.findDescendants(node => true);
    },

    get selected() {
      return this.root.findDescendant((node) => {
        return node.classList.includes('selected');
      });
    },

    get frontier() {
      return this.root.findDescendants((node) => {
        return node.classList.includes('frontier');
      });
    },

    get classList() {
      return this.props.class;
    },

    get transform() {
      return this.props.transform;
    },

    set transform(value) {
      this.props.transform = value;
    },

    totalTransform() {
      return this.ancestorTransform().multiply(this.transform);
    },

    ancestorTransform() {
      let matrix = Matrix.identity();

      for (let ancestor of this.ancestors.reverse()) {
        matrix = matrix.multiply(ancestor.transform);
      }

      return matrix;
    },

    // for debugging purposes
    plot(point) {
      const node = Object.create(Node).init();
      node.tag = 'circle';
      node.props = Object.assign(node.props, {
        r: 5, cx: point[0], cy: point[1], fill: 'red'
      });
      node.box = { x: point[0], y: point[1], width: 5, height: 5};
      this.root.append(node);
    },

    updateBox() {
      // store all the children's corners
      const corners = [];

      for (let child of this.children) {
        let childCorners = child.findCorners();
        for (let corner of childCorners) {
          corner = this.transformPoint(corner, this.totalTransform().invert());
          corners.push(corner);
        }
      }

      if (corners.length === 0) {
        return;
      }

      // find min and max:
      const xValue  = point => point[0];
      const yValue  = point => point[1];
      const xValues = corners.map(xValue);
      const yValues = corners.map(yValue);

      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);

      // use min and max to update coordinates:
      this.box = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    },

    findCorners() {
      const northWest = [
        this.box.x, this.box.y
      ];

      const northEast = [
        this.box.x + this.box.width, this.box.y
      ];

      const southWest = [
        this.box.x, this.box.y + this.box.height
      ];

      const southEast = [
        this.box.x + this.box.width, this.box.y + this.box.height
      ];

      // return [northWest, northEast, southWest, southEast];

      return [
        this.transformPoint(northWest, this.totalTransform()),
        this.transformPoint(northEast, this.totalTransform()),
        this.transformPoint(southWest, this.totalTransform()),
        this.transformPoint(southEast, this.totalTransform()),
      ];
    },

    transformPoint(pt, matrix) {
      const column      = Object.create(Matrix).init([[pt[0]], [pt[1]], [1]]);
      const transformed = matrix.multiply(column).toArray();

      return [transformed[0][0], transformed[1][0]];
    },

    get siblings() {
      return this.parent.children.filter((node) => {
        return node !== this;
      });
    },

    unsetFrontier() {
      const frontier = this.root.findDescendants((node) => {
        return node.classList.includes('frontier');
      });

      for (let node of frontier) {
        node.classList.remove('frontier');
      }
    },

    unfocus() {
      const focussed = this.root.findDescendants((node) => {
        return node.classList.includes('focus');
      });

      for (let node of focussed) {
        node.classList.remove('focus');
      }
    },

    setFrontier() {
      this.unsetFrontier();

      if (this.selected) {
        this.selected.classList.add('frontier');

        let node = this.selected;

        do {
          for (let sibling of node.siblings) {
            sibling.classList.add('frontier');
          }
          node = node.parent;
        } while (node.parent !== null);
      } else {
        for (let child of this.root.children) {
          child.classList.add('frontier');
        }
      }
    },

    deselectAll() {
      if (this.selected) {
        this.selected.classList.remove('selected');
      }
      this.setFrontier();
    },

    select() {
      this.deselectAll();
      this.classList.add('selected');
      this.setFrontier();
    },

    append(node) {
      this.children.push(node);
      node.parent = this;
    },

    set(opts) {
      for (let key of Object.keys(opts)) {
        this[key] = opts[key];
      }
    },

    toJSON() {
      return {
        _id:      this._id,
        parent:   this.parent && this.parent._id,
        children: this.children,
        tag:      this.tag,
        props:    this.props,
        box:      this.box,
      };
    },

    defaults() {
      return {
        _id:      createID(),
        box:      { x: 0, y: 0, width: 0, height: 0 },
        children: [],
        parent:   null,
        tag:      null,
        props:    {
          transform: Matrix.identity(),
          class:     Object.create(ClassList).init(),
        },
      };
    },

    init(opts = {}) {
      this.set(this.defaults());
      this.set(opts);
      return this;
    },
  };

  const sceneBuilder = {
    processAttributes($node, node) {
      const $attributes = Array.from($node.attributes);
      for (let $attribute of $attributes) {
        node.props[$attribute.name] = $attribute.value;
      }
      delete node.props.xmlns;

      // store `transform` as a Matrix object:
      if ($node.transform && $node.transform.baseVal && $node.transform.baseVal.consolidate()) {
        const $matrix = $node.transform.baseVal.consolidate().matrix;
        node.props.transform = Object.create(Matrix).fromDOMMatrix($matrix);
      } else {
        node.props.transform = Matrix.identity();
      }

      // store `class` as a ClassList object:
      node.props.class = Object.create(ClassList).init(
        Array.from($node.classList)
      );
    },

    copyTagName($node, node) {
      node.tag = $node.tagName;
    },

    copyStyles($node, node) {
      node.styles = Array.from($node.querySelectorAll('style'));
    },

    copyDefs($node, node) {
      node.defs = Array.from($node.querySelectorAll('style'));
    },

    copyBBox($node, node) {
      const box = $node.getBBox();
      node.box = {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
      // console.log(node.box);
    },

    buildTree($node, node) {
      this.copyTagName($node, node);
      this.processAttributes($node, node);

      this.copyBBox($node, node);

      const $graphics = Array.from($node.children).filter((child) => {
        return child instanceof SVGGElement || child instanceof SVGGeometryElement
      });

      for (let $child of $graphics) {
        const child = Object.create(Node).init();
        node.append(child);
        this.buildTree($child, child);
      }
    },

    process($svg, svg) {
      this.copyStyles($svg, svg);
      this.copyDefs($svg, svg);
      this.buildTree($svg, svg);
      svg.setFrontier();
    },

    createScene(markup) {
      const $svg = new DOMParser()
        .parseFromString(markup, "application/xml")
        .documentElement;
      const svg = Object.create(Node).init();

      document.body.appendChild($svg);
      this.process($svg, svg);
      $svg.remove();

      return svg;
    },
  };

  const createID$1 = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);
    return randomString + timestamp;
  };

  const doc = {
    init(markup) {
      this._id   = createID$1();
      this.scene = sceneBuilder.createScene(markup);

      return this;
    },

    toJSON() {
      return {
        _id: this._id,
        scene: this.scene,
      }
    }
  };

  let aux = {};

  const transformers = {

    // NEW

    // select/shift
    select(state, input) {
      const selected = state.doc.scene
        .findDescendant((node) => {
          return node._id === input.pointer.targetID;
        })
        .findAncestor((node) => {
          return node.props.class.includes('frontier');
        });

      selected ? selected.select() : state.doc.scene.deselectAll();

      aux.sourceX = input.pointer.x;
      aux.sourceY = input.pointer.y;
    },

    shift(state, input) {
      const selected     = state.doc.scene.selected;

      if (!selected) { return; }

      const targetX      = input.pointer.x;
      const targetY      = input.pointer.y;
      const vectorX      = targetX - aux.sourceX;
      const vectorY      = targetY - aux.sourceY;
      const shift        = Matrix.translation(vectorX, vectorY);
      const ancTransform = selected.ancestorTransform();
      const inv          = ancTransform.invert();
      const matrix       = inv.multiply(shift).multiply(ancTransform);
      selected.transform = matrix.multiply(selected.transform);
      aux.sourceX        = targetX;
      aux.sourceY        = targetY;
    },

    // rotate

    initRotate(state, input) {
      const selected             = state.doc.scene.selected;
      aux.sourceX                = input.pointer.x;
      aux.sourceY                = input.pointer.y;
      const box                  = selected.box;
      const centerX              = box.x + box.width / 2;
      const centerY              = box.y + box.height / 2;
      const center               = [centerX, centerY];
      const matrix               = selected.totalTransform();
      [aux.centerX, aux.centerY] = Node.transformPoint(center, matrix);
    },

    rotate(state, input) {
      const selected     = state.doc.scene.selected;
      const targetX      = input.pointer.x;
      const targetY      = input.pointer.y;
      const sourceVector = [aux.sourceX - aux.centerX, aux.sourceY - aux.centerY];
      const targetVector = [targetX - aux.centerX, targetY - aux.centerY];
      const sourceAngle  = Math.atan2(...sourceVector);
      const targetAngle  = Math.atan2(...targetVector);
      const angle        = sourceAngle - targetAngle;
      const rotation     = Matrix.rotation(angle, [aux.centerX, aux.centerY]);
      const ancTransform = selected.ancestorTransform();
      const inv          = ancTransform.invert();
      const matrix       = inv.multiply(rotation).multiply(ancTransform);
      selected.transform = matrix.multiply(selected.transform);
      aux.sourceX        = targetX;
      aux.sourceY        = targetY;
    },

    // scale

    // (NOTE: thats the exact same code as for initRotate)
    initScale(state, input) {
      const selected             = state.doc.scene.selected;
      aux.sourceX                = input.pointer.x;
      aux.sourceY                = input.pointer.y;
      const box                  = selected.box;
      const centerX              = box.x + box.width / 2;
      const centerY              = box.y + box.height / 2;
      const center               = [centerX, centerY];
      const matrix               = selected.totalTransform();
      [aux.centerX, aux.centerY] = Node.transformPoint(center, matrix);
    },

    scale(state, input) {
      const selected = state.doc.scene.selected;
      const targetX = input.pointer.x;
      const targetY = input.pointer.y;

      const distanceSource = Math.sqrt(Math.pow(aux.sourceX - aux.centerX, 2) + Math.pow(aux.sourceY - aux.centerY, 2));
      const distanceTarget = Math.sqrt(Math.pow(targetX - aux.centerX, 2) + Math.pow(targetY - aux.centerY, 2));

      const scaleFactor = distanceTarget / distanceSource;

      const scaleMatrix = Matrix.scale(scaleFactor, [aux.centerX, aux.centerY]);
      const ancTransform = selected.ancestorTransform();
      const inv          = ancTransform.invert();
      const matrix       = inv.multiply(scaleMatrix).multiply(ancTransform);
      selected.transform = matrix.multiply(selected.transform);

      aux.sourceX = targetX;
      aux.sourceY = targetY;
    },

    release(state, input) {
      const selected = state.doc.scene.selected;
      for (let ancestor of selected.ancestors) {
        ancestor.updateBox();
      }
      aux = {};
    },

    selectThrough(state, input) {
      const target = state.doc.scene.findDescendant((node) => {
        return node._id === input.pointer.targetID;
      });

      const selection = target.findAncestor((node) => {
        return node.parent && node.parent.props.class.includes('frontier');
      });

      if (selection) {
        selection.select();
        state.doc.scene.setFrontier();
        state.doc.scene.unfocus();
      }
    },

    focus(state, input) {
      const target = state.doc.scene.findDescendant((node) => {
        return node._id === input.pointer.targetID;
      });

      if (target) {
        const highlight = target.findAncestor((node) => {
          return node.props.class.includes('frontier');
        });

        if (highlight) {
          const realPointer = Node.transformPoint([input.pointer.x, input.pointer.y], highlight.totalTransform().invert());

          if (realPointer[0] >= highlight.box.x && realPointer[0] <= highlight.box.x + highlight.box.width && realPointer[1] >= highlight.box.y && realPointer[1] <= highlight.box.y + highlight.box.height) {
            highlight.props.class.add('focus');
          } else {
            state.doc.scene.unfocus();
          }
        }
      }
    },

    // OLD

    createShape(state, input) {
      state.doc.appendShape();

      input.pointerData.target; // 'wrapper'
      input.pointerData.targetID; // our id ...
      input.pointerData.x;  // x coord with offset
      input.pointerData.y;  // y coord with offset

    },

    createDoc(state, input) {
      state.doc.init();
      state.docs.ids.push(state.doc._id);
      state.docs.selectedID = state.doc._id;
    },

    deleteFrame(state, input) {
      state.doc.deleteSelectedFrame();
    },

    updateDocList(state, input) {
      state.docs.ids = input.data.docIDs;
    },

    requestDoc(state, input) {
      state.docs.selectedID = input.pointer.targetID;
    },

    setDoc(state, input) {
      state.doc.init(input.data.doc);
    },

    setFrameOrigin(state, input) { // don't have it
      state.doc.insertFrameInPlace();
      this.aux.originX = input.pointer.x;
      this.aux.originY = input.pointer.y;
    },

    findOppCorner(state, input) {
      // purpose was to find the fixed point of resizing
      // but we don't do that.
      const frame = state.doc.selected.frame;

      let opp;

      switch (input.pointer.target) {
      case 'top-left-corner':
        opp = [frame.x + frame.width, frame.y + frame.height]; // bottom right
        break;
      case 'top-right-corner':
        opp = [frame.x, frame.y + frame.height];               // bottom left
        break;
      case 'bot-right-corner':
        opp = [frame.x, frame.y];                              // top left
        break;
      case 'bot-left-corner':
        opp = [frame.x + frame.width, frame.y];                // top right
        break;
      }

      // store opposite corner
      [this.aux.oppX, this.aux.oppY] = opp;
      // store centre of frame
      this.aux.center = [frame.x + frame.width / 2, frame.y + frame.height / 2];
    },

    // rotate point around center by angle radians
    // rotate(point, center, angle) {
    //   const [pointX,  pointY ] = point;
    //   const [centerX, centerY] = center;
    //   const cos                = Math.cos(angle);
    //   const sin                = Math.sin(angle);
    //
    //   return [
    //     cos * (pointX - centerX) - sin * (pointY - centerY) + centerX,
    //     sin * (pointX - centerX) + cos * (pointY - centerY) + centerY
    //   ];
    // },

    resizeFrame(state, input) { // becomes scale transform - different!
      const frame = state.doc.selected.frame;
      const shape = state.doc.selected.shape;

      // rotate stored opposite corner
      const angle = frame.angle;
      const opp = [this.aux.oppX, this.aux.oppY];
      const oppRotated = this.rotate(opp, this.aux.center, angle);
      const [oppXr, oppYr] = oppRotated;

      // use rotated opposite corner to unrotate mouse position
      const cornerRotated = [input.pointer.x, input.pointer.y];
      const [cornerXr, cornerYr] = cornerRotated;
      const newCenter = [(cornerXr + oppXr)/2, (cornerYr + oppYr)/2];
      const [newCenterX, newCenterY] = newCenter;
      const corner = this.rotate(cornerRotated, newCenter, -angle);
      const [cornerX, cornerY] = corner;

      // use corner/newCenter to find new opposite corner
      const newOpp = [
        newCenterX + (newCenterX - cornerX),
        newCenterY + (newCenterY - cornerY)
      ];

      // store new opposite corner (unrotated) and new center
      const [newOppX, newOppY] = newOpp;
      [this.aux.oppX, this.aux.oppY] = newOpp;
      this.aux.center = newCenter;

      const newWidth  = Math.abs(newOppX - cornerX);
      const newHeight = newWidth / shape.aspectRatio;

      // mutate frame state
      state.doc.selected.frame.set({
        x:      Math.min(newOppX, cornerX),
        y:      Math.min(newOppY, cornerY),
        width:  newWidth,
        height: newHeight,
      });
    },

    sizeFrame(state, input) { // part of creating a frame: we don't do that
      const shape     = state.doc.selected.shape;
      const newWidth  = Math.abs(this.aux.originX - input.pointer.x);
      const newHeight = newWidth / shape.aspectRatio;

      state.doc.selected.frame.set({
        x:      Math.min(this.aux.originX, input.pointer.x),
        y:      Math.min(this.aux.originY, input.pointer.y),
        width:  newWidth,
        height: newHeight,
      });
    },

    // releaseFrame(state, input) {
    //   const frame = state.doc.selected.frame;
    // },

    clean(state, input) {
      const same = (val1, val2) => {
        const treshold = 1;
        return Math.abs(val1 - val2) <= treshold;
      };

      const sameX = same(this.aux.originX, input.pointer.x);
      const sameY = same(this.aux.originY, input.pointer.y);

      if (sameX && sameY) {
        state.doc.deleteSelectedFrame();
      }
    },

    getFrameOrigin(state, input) {
      state.doc.select(input.pointer.targetID);
      this.aux.originX = input.pointer.x;
      this.aux.originY = input.pointer.y;
    },

    moveFrame(state, input) {
      const frame = state.doc.selected.frame;

      frame.set({
        y: frame.y  + (input.pointer.y - this.aux.originY),
        x: frame.x + (input.pointer.x - this.aux.originX),
      });

      this.aux.originX = input.pointer.x;
      this.aux.originY = input.pointer.y;
    },

    getStartAngle(state, input) {
      const frame              = state.doc.select(input.pointer.targetID);
      this.aux.centerX         = frame.x + frame.width / 2;
      this.aux.centerY         = frame.y + frame.height / 2;
      const startX             = input.pointer.x - this.aux.centerX;
      const startY             = input.pointer.y - this.aux.centerY;
      this.aux.startAngle      = Math.atan2(startY, startX);
      this.aux.frameStartAngle = frame.angle;
    },

    rotateFrame(state, input) { // don't really need that?
      const frame        = state.doc.selected.frame;
      const currentX     = input.pointer.x - this.aux.centerX;
      const currentY     = input.pointer.y - this.aux.centerY;
      const currentAngle = Math.atan2(currentY, currentX);
      const angleToAdd   = currentAngle - this.aux.startAngle;

      frame.set({ angle: this.aux.frameStartAngle + angleToAdd });
    },

    init() {
      this.aux = {};
    },
  };

  const transitionTable = [
    // kickoff
    [{ from: 'start',     input: 'kickoff'        }, { to: 'idle'              }],

    // NEW
    [{ from: 'idle',      input: 'selectThrough'  }, { to: 'idle'              }],
    [{ from: 'idle',      input: 'movePointer'    }, { to: 'idle', do: 'focus' }],

    // select/shift
    [{ from: 'idle',      input: 'select'         }, { to: 'shifting'          }],
    [{ from: 'shifting',  input: 'movePointer'    }, { do: 'shift'             }],
    [{ from: 'shifting',  input: 'release'        }, { to: 'idle'              }],

    // rotate
    [{ from: 'idle',      input: 'initRotate'     }, { to: 'rotating'          }],
    [{ from: 'rotating',  input: 'movePointer'    }, { do: 'rotate'            }],
    [{ from: 'rotating',  input: 'release'        }, { to: 'idle'              }],

    // scale
    [{ from: 'idle',      input: 'initScale'      }, { to: 'scaling'           }],
    [{ from: 'scaling',   input: 'movePointer'    }, { do: 'scale'             }],
    [{ from: 'scaling',   input: 'release'        }, { to: 'idle'              }],

    // OLD (mostly irrelevant now)

    // create and delete
    [{ from: 'idle',      input: 'createShape'    }, {                         }],
    [{ from: 'idle',      input: 'createDoc'      }, {                         }],
    [{ from: 'idle',      input: 'deleteFrame'    }, {                         }],
    [{                    input: 'docSaved'       }, {                         }],
    [{                    input: 'updateDocList'  }, {                         }],
    [{                    input: 'requestDoc'     }, { to: 'busy'              }],
    [{ from: 'busy',      input: 'setDoc'         }, { to: 'idle'              }],

    // draw
    [{ from: 'idle',      input: 'setFrameOrigin' }, { to: 'drawing'           }],
    [{ from: 'drawing',   input: 'changeCoords'   }, { do: 'sizeFrame'         }],
    [{ from: 'drawing',   input: 'releaseFrame'   }, { to: 'idle', do: 'clean' }],

    // rotate
    [{ from: 'idle',      input: 'getStartAngle'  }, { to: 'rotating'          }],
    [{ from: 'rotating',  input: 'changeCoords'   }, { do: 'rotateFrame'       }],
    [{ from: 'rotating',  input: 'releaseFrame'   }, { to: 'idle'              }],

    // move
    [{ from: 'idle',      input: 'getFrameOrigin' }, { to: 'dragging'          }],
    [{ from: 'dragging',  input: 'changeCoords'   }, { do: 'moveFrame'         }],
    [{ from: 'dragging',  input: 'releaseFrame'   }, { to: 'idle'              }],

    // resize
    [{ from: 'idle',      input: 'findOppCorner'     }, { to: 'resizing'          }],
    [{ from: 'resizing',  input: 'changeCoords'   }, { do: 'resizeFrame'       }],
    [{ from: 'resizing',  input: 'releaseFrame'   }, { to: 'idle'              }],

    // animate
    [{ from: 'idle',      input: 'animate'        }, { to: 'animating'         }],
    [{ from: 'animating', input: 'animate'        }, { to: 'animating'         }],
    [{ from: 'animating', input: 'edit'           }, { to: 'idle'              }],
    [{ from: 'animating', input: 'createDoc'      }, { to: 'idle'              }],
    [{ from: 'animating', input: 'createShape'    }, { to: 'idle'              }],
  ];

  transitionTable.get = function(key) {
    const match = (pair) => {
      return (pair[0].from === key[0] || !pair[0].from) &&
        pair[0].input === key[1];
    };

    const pair = transitionTable.find(match);

    if (pair) {
      return pair[1];
    }
  };

  const core = {
    get stateData() {
      return JSON.parse(JSON.stringify(this.state));
    },

    syncPeriphery() {
      const keys = Object.keys(this.periphery);
      for (let key of keys) {
        this.periphery[key](JSON.parse(JSON.stringify(this.state)));
      }
    },

    // TODO: write a proper function to initalize state from stateData
    setState(stateData) {
      this.state = stateData;
      this.state.doc = doc.init(stateData.doc);
      this.state.clock = clock.init(stateData.clock.time);
      this.periphery['ui'] &&
        this.periphery['ui'](JSON.parse(JSON.stringify(this.state)));
      // ^ only UI is synced
      // ^ TODO: call syncPeriphery here, and make that method more flexible
    },

    processInput(input) {
      const transition = transitionTable.get([this.state.id, input.id]);

      if (transition) {
        this.transform(input, transition);
        this.syncPeriphery();
      }
    },

    transform(input, transition) {
      const transformer = transformers[transition.do] || transformers[input.id];
      transformer && transformer.bind(transformers)(this.state, input);

      this.state.clock.tick();
      this.state.currentInput = input.id;
      this.state.id = transition.to || this.state.id;
    },

    init() {
      this.state = {
        clock: clock.init(),
        id: 'start',
        doc: doc.init(markup),
        docs: { ids: [], selectedID: null },
      };

      transformers.init();
      this.periphery = [];
      return this;
    },

    // TODO: why do we need this function? why can't we just do:
    //   this.processInput({ id: 'kickoff' });
    // ?
    kickoff() {
      this.syncPeriphery();
      this.processInput({ id: 'kickoff' });
      // ^ TODO: this involves two syncs, is that really necessary?
    },
  };

  const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">

    <g>
      <circle cx="200" cy="200" r="50"></circle>
      <g>
        <rect x="260" y="250" width="100" height="100"></rect>
        <rect x="400" y="250" width="100" height="100"></rect>
      </g>
    </g>

    <rect x="400" y="400" width="100" height="100"></rect>
  </svg>
`;

  const log = {
    bindEvents(setState) {
      window.addEventListener('popstate', (event) => {
        setState(event.state);
      });
    },

    sync(state) {
      const ignored = [
        'docSaved', 'edit', 'createDoc', 'createShape', 'movePointer'
      ];
      const ignore  = ignored.includes(state.currentInput);
      const idle    = state.id === 'idle';
      if (ignore || !idle) {
        return;
      }

      window.history.pushState(state, 'entry');
    },

    init() {
      this.name = 'log';
      return this;
    }
  };

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

  const inputTable = [
    // event type     pointer target        input
    [['click',       'newShapeButton'   ], 'createShape'     ],
    [['click',       'newDocButton'     ], 'createDoc'       ],
    [['click',       'animateButton'    ], 'animate'         ],
    [['click',       'doc-list-entry'   ], 'requestDoc'      ],
    // NEW
    [['mousedown',   'wrapper'          ], 'select'          ],
    [['mousedown',   'dot'              ], 'initRotate'      ],
    [['mousedown',   'corner'           ], 'initScale'       ],
    [['dblclick',    'wrapper'          ], 'selectThrough'   ],
    [['mousemove'                       ], 'movePointer'     ],
    [['mouseup'                         ], 'release'         ],

    // [['click',       'deleteLink'       ], 'deleteFrame'     ],
    // [['click',       'canvas'           ], 'edit'            ],
    // [['mousedown',   'frame'            ], 'getFrameOrigin'  ],
    // [['mousedown',   'top-left-corner'  ], 'findOppCorner'   ],
    // [['mousedown',   'top-right-corner' ], 'findOppCorner'   ],
    // [['mousedown',   'bot-left-corner'  ], 'findOppCorner'   ],
    // [['mousedown',   'bot-right-corner' ], 'findOppCorner'   ],
    // [['mousedown',   'canvas'           ], 'setFrameOrigin'  ],
    // [['mousedown',   'rotate-handle'    ], 'getStartAngle'   ],
    // [['mousemove'                       ], 'changeCoords'    ],
    // [['mouseup'                         ], 'releaseFrame'    ],
  ];

  inputTable.get = function(key) {
    const match = (pair) => {
      return pair[0][0] === key[0] &&
        (pair[0][1] === key[1] || pair[0][1] === undefined);
    };

    const pair = inputTable.find(match);

    if (pair) {
      return pair[1];
    }
  };

  const svgns = 'http://www.w3.org/2000/svg';
  const xmlns = 'http://www.w3.org/2000/xmlns/';

  SVGElement.prototype.getSVGAttr = function(...args) {
    return this.getAttributeNS.apply(this, [null].concat(args));
  };

  SVGElement.prototype.setSVGAttr = function(...args) {
    return this.setAttributeNS.apply(this, [null].concat(args));
  };

  SVGElement.prototype.setSVGAttrs = function(obj) {
    for (let key of Object.keys(obj)) {
      this.setSVGAttr(key, obj[key]);
    }
  };

  const wrap = ($node, node) => {
    const wrapper    = document.createElementNS(svgns, 'g');
    const chrome     = document.createElementNS(svgns, 'g');
    const frame      = document.createElementNS(svgns, 'rect');
    const topLCorner = document.createElementNS(svgns, 'rect');
    const botLCorner = document.createElementNS(svgns, 'rect');
    const topRCorner = document.createElementNS(svgns, 'rect');
    const botRCorner = document.createElementNS(svgns, 'rect');
    const topLDot    = document.createElementNS(svgns, 'circle');
    const botLDot    = document.createElementNS(svgns, 'circle');
    const topRDot    = document.createElementNS(svgns, 'circle');
    const botRDot    = document.createElementNS(svgns, 'circle');
    const corners    = [topLCorner, botLCorner, topRCorner, botRCorner];
    const dots       = [topLDot,    botLDot,    topRDot,    botRDot];

    const width     = node.box.width;
    const height    = node.box.height;
    const x         = node.box.x;
    const y         = node.box.y;
    const transform = node.props.transform;
    const id        = node._id;

    $node.setSVGAttrs({
      'data-type': 'content',
      'pointer-events': 'none',
    });

    wrapper.setSVGAttrs({
      'data-type':      'wrapper',
      'pointer-events': 'bounding-box',
      'data-id':        id,
    });

    chrome.setSVGAttrs({
      'data-type': 'chrome',
      'data-id': id,
      'pointer-events': 'visiblePainted',
      'visibility': 'hidden',
    });

    frame.setSVGAttrs({
      'data-type':      'frame',
      x:                 x,
      y:                 y,
      width:             width,
      height:            height,
      stroke:            '#d3d3d3',
      'vector-effect':  'non-scaling-stroke',
      'stroke-width':   '1px',
      transform:         transform,            // the frame should be transformed
      fill:             'none',
      'pointer-events': 'none',
      'data-id':        id,
    });

    for (let corner of corners) {
      corner.setSVGAttrs({
        'data-type':     'corner',
        'data-id':       id,
        transform:       transform,
        width:           8,
        height:          8,
        stroke:          '#d3d3d3',
        'vector-effect': 'non-scaling-stroke',
        'stroke-width':  '1px',
        fill:            '#FFFFFF',
      });
    }

    topLCorner.setSVGAttrs({ x: x - 4,         y: y - 4          });
    botLCorner.setSVGAttrs({ x: x - 4,         y: y + height - 4 });
    topRCorner.setSVGAttrs({ x: x + width - 4, y: y - 4          });
    botRCorner.setSVGAttrs({ x: x + width - 4, y: y + height - 4 });

    for (let dot of dots) {
      dot.setSVGAttrs({
        'data-type':     'dot',
        'data-id':       id,
        transform:       transform,
        r:               5,
        stroke:          '#d3d3d3',
        'vector-effect': 'non-scaling-stroke',
        'stroke-width':  '1px',
        fill:            '#FFFFFF',
      });
    }

    topLDot.setSVGAttrs({ cx: x - 8,         cy: y - 8          });
    botLDot.setSVGAttrs({ cx: x - 8,         cy: y + height + 8 });
    topRDot.setSVGAttrs({ cx: x + width + 8, cy: y - 8          });
    botRDot.setSVGAttrs({ cx: x + width + 8, cy: y + height + 8 });

    wrapper.appendChild($node);
    wrapper.appendChild(chrome);
    chrome.appendChild(frame);
    for (let corner of corners) {
      chrome.appendChild(corner);
    }
    for (let dot of dots) {
      chrome.appendChild(dot);
    }

    return wrapper;
  };


  // TODO: need to take care of style and defs

  const sceneRenderer = {
    render(scene, $canvas) {
      canvas.innerHTML = '';
      this.build(scene, $canvas);
    },

    build(node, $parent) {
      const $node = document.createElementNS(svgns, node.tag);
      $node.setSVGAttrs(node.props);
      $node.setSVGAttr('data-id', node._id);

      if (node.tag === 'svg') {
        $node.setAttributeNS(xmlns, 'xmlns', svgns);
        $node.setAttributeNS(svgns, 'data-type', 'root');
        $parent.appendChild($node);
      } else {
        const $wrapper = wrap($node, node);
        $parent.appendChild($wrapper);
      }

      for (let child of node.children) {
        sceneRenderer.build(child, $node);
      }
    },
  };


  // Need to reorganize this in such a way that we have access to the pair ($node, node) throughout

  SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(element) {
      return element.getScreenCTM().inverse().multiply(this.getScreenCTM());
  };

  const ui = {
    bindEvents(processInput) {
      this.canvasNode = document.querySelector('#canvas');

      const getSVGCoords = (x, y) => {
        const svg = document.querySelector('svg');
        let point = svg.createSVGPoint();
        point.x   = x;
        point.y   = y;
        point     = point.matrixTransform(svg.getScreenCTM().inverse());

        return [point.x, point.y];
      };

      const pointerData = (event) => {
        const [x, y] = getSVGCoords(event.clientX, event.clientY);

        return {
          x:        x,
          y:        y,
          target:   event.target.dataset.type,
          targetID: event.target.dataset.id,
        };
      };

      for (let eventType of ['mousedown', 'mousemove', 'mouseup']) {
        this.canvasNode.addEventListener(eventType, (event) => {
          event.preventDefault();

          processInput({
            id:      inputTable.get([eventType, event.target.dataset.type]),
            pointer: pointerData(event),
          });
        });
      }

      document.addEventListener('click', (event) => {
        event.preventDefault();
        if (event.detail > 1) {
          return;
        }

        processInput({
          id:      inputTable.get(['click', event.target.dataset.type]),
          pointer: pointerData(event)
        });
      });

      document.addEventListener('dblclick', (event) => {
        event.preventDefault();

        processInput({
          id:      inputTable.get(['dblclick', event.target.dataset.type]),
          pointer: pointerData(event)
        });
      });
    },

    sync(state) {
      const changes = (state1, state2) => {
        const keys = Object.keys(state1);
        return keys.filter(key => !equalData(state1[key], state2[key]));
      };

      const equalData = (obj1, obj2) => {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
      };

      if (state.id === 'start') {
        this.start(state);
        this.renderScene(state); // ?
        return;
      }

      for (let changed of changes(state, this.previousState)) {
        this.render[changed] && this.render[changed](state);
      }

      this.previousState = state;
    },

    render: {
      doc(state) {
        ui.renderScene(state);
        // ui.renderInspector(state); // TODO ==> later
      },

      docs(state) {
        ui.renderDocList(state);
      },

      currentInput(state) {
        if (state.currentInput === 'docSaved') {
          ui.renderFlash('Saved');
        }

        if (state.currentInput === 'edit') {
          ui.renderScene(state);
        }
      },

      clock(state) {
        if (state.currentInput === 'animate') {
          ui.renderAnimations(state);
        }
      },
    },

    renderScene(state) {
      sceneRenderer.render(state.doc.scene, ui.canvasNode);
    },

    renderDocList(state) {
      const docList = document.querySelector('.doc-list');
      docList.innerHTML = '';

      for (let docID of state.docs.ids) {
        const node = nodeFactory.makeDocListNode(docID);
        docList.appendChild(node);
        if (docID === state.docs.selectedID) {
          node.classList.add('selected');
        }
      }
    },

    renderInspector(state) {
      const findSelected = (doc) => {
        for (let shape of doc.shapes) {
          for (let frame of shape.frames) {
            if (frame._id === doc.selected.frameID) {
              return frame;
            }
          }
        }
      };

      const inspector = document.querySelector('#inspector');
      inspector.innerHTML = '';

      const node = nodeFactory.makeInspectorNode(findSelected(state.doc));
      inspector.appendChild(node);
    },

    renderAnimations(state) {
      const convertAngleToDegrees = (frame) => {
        return {
          x:        frame.x,
          y:        frame.y,
          width:    frame.width,
          height:   frame.height,
          rotation: frame.angle * 57.2958, // convert to degrees
        };
      };

      ui.canvasNode.innerHTML = '';

      for (let shape of state.doc.shapes) {
        const timeline = new TimelineMax();
        const shapeNode = nodeFactory.makeShapeNode(state);
        shapeNode.innerHTML = shape.markup;

        for (let i = 0; i < shape.frames.length - 1; i += 1) {
          let start = shape.frames[i];
          let end   = shape.frames[i + 1];

          timeline.fromTo(
            shapeNode,
            0.3,
            convertAngleToDegrees(start),
            convertAngleToDegrees(end)
          );
        }

        ui.canvasNode.appendChild(shapeNode);
      }
    },

    renderFlash(message) {
      const flash = document.createElement('p');
      flash.innerHTML = message;
      flash.classList.add('flash');
      window.setTimeout(() => document.body.appendChild(flash), 500);
      window.setTimeout(() => flash.remove(), 1500);
    },

    writeCSS(node, frame) {
      node.style.left      = String(frame.x) + 'px';
      node.style.top       = String(frame.y) + 'px';
      node.style.width     = String(frame.width) + 'px';
      node.style.height    = String(frame.height) + 'px';
      node.style.transform = `rotate(${frame.angle}rad)`;
    },

    start(state) {
      this.previousState = state;
    },

    init() {
      this.name = 'ui';
    }
  };

  const db = {
    bindEvents(processInput) {
      window.addEventListener('upsert', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          processInput({
            id: 'docSaved',
            data: {}
          });
        });

        request.open('POST', "/docs/" + event.detail._id);
        request.send(JSON.stringify(event.detail));
      });

      window.addEventListener('read', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          processInput({
            id: 'setDoc',
            data: {
              doc: request.response
            }
          });
        });

        request.open('GET', "/docs/" + event.detail);
        request.responseType = 'json';
        request.send(JSON.stringify(event.detail));
      });

      window.addEventListener('loadDocIDs', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          processInput({
            id: 'updateDocList',
            data: {
              docIDs: request.response
            }
          });
        });

        request.open('GET', "/ids");
        request.responseType = 'json';
        request.send();
      });
    },

    sync(state) {
      if (state.id === 'start') {
        db.loadDocIDs();
        this.previousState = state;
        return;
      }

      if (['idle', 'busy'].includes(state.id)) {
        for (let changed of this.changes(state, this.previousState)) {
          this.crud[changed] && this.crud[changed](state);
        }
        this.previousState = state;
      }
    },

    crud: {
      docs(state) {
        if (state.docs.selectedID !== db.previousState.docs.selectedID) {
          window.dispatchEvent(new CustomEvent(
            'read',
            { detail: state.docs.selectedID }
          ));
        }
      },

      doc(state) {
        if (state.docs.selectedID === db.previousState.docs.selectedID) {
          window.dispatchEvent(new CustomEvent(
            'upsert',
            { detail: state.doc }
          ));
        }
      },
    },

    changes(state1, state2) {
      const keys = Object.keys(state1);
      return keys.filter(key => !db.equal(state1[key], state2[key]));
    },

    equal(obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    },

    loadDocIDs() {
      window.dispatchEvent(new Event('loadDocIDs'));
    },

    init() {
      this.name = 'db';
    }
  };

  const app = {
    init() {
      core.init();

      // wire up `ui` and `db`
      for (let component of [ui, db]) {
        component.init();
        component.bindEvents(core.processInput.bind(core));
        core.periphery[component.name] = component.sync.bind(component);
      }

      // wire up `log`
      log.init();
      log.bindEvents(core.setState.bind(core));
      core.periphery[log.name] = log.sync.bind(log);

      core.kickoff();
    },
  };

  document.addEventListener('DOMContentLoaded', app.init.bind(app));

}());
//# sourceMappingURL=bundle.js.map
