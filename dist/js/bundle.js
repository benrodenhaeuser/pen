(function () {
  'use strict';

  const clock = {
    init(time = 0) {
      this.time = time;
      return this;
    },

    tick() {
      this.time += 1;
    },
  };

  const Vector = {
    create(x = 0, y = 0) {
      return Object.create(Vector).init(x, y);
    },

    createWithID(x,y) {
      return Vector.create(x, y).addID();
    },

    init(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },

    coords() {
      return { x: this.x, y: this.y };
    },

    transform(matrix) {
      return matrix.transform(this);
    },

    add(other) {
      return Vector.create(this.x + other.x, this.y + other.y);
    },

    subtract(other) {
      return Vector.create(this.x - other.x, this.y - other.y);
    },

    abs() {
      return Vector.create(Math.abs(this.x), Math.abs(this.y));
    },

    isWithin(rectangle) {
      return this.x >= rectangle.x &&
             this.x <= rectangle.x + rectangle.width &&
             this.y >= rectangle.y &&
             this.y <= rectangle.y + rectangle.height;
    },

    addID() {
      this._id = createID();
      return this;
    },
  };

  const Matrix = {
    create(m) {
      return Object.create(Matrix).init(m);
    },

    init(m) {
      this.m = m;
      return this;
    },

    createFromDOMMatrix($matrix) {
      const m = [
        [$matrix.a, $matrix.c, $matrix.e],
        [$matrix.b, $matrix.d, $matrix.f],
        [0,         0,         1        ]
      ];

      return Matrix.create(m);
    },

    toJSON() {
      return this.toAttributeString();
    },

    toAttributeString() {
      return `matrix(${this.toVector()})`;
    },

    toVector() {
      return [
        this.m[0][0], this.m[1][0], this.m[0][1],
        this.m[1][1], this.m[0][2], this.m[1][2]
      ];
    },

    transform(vector) {
      const column      = Matrix.create([[vector.x], [vector.y], [1]]);
      const transformed = this.multiply(column).toArray();

      return Vector.create(transformed[0][0], transformed[1][0]);
    },

    toArray() {
      return this.m;
    },

    multiply(other) {
      const m = math.multiply(this.m, other.m);
      return Matrix.create(m);
    },

    invert() {
      const m = JSON.parse(JSON.stringify(this.m));
      return Matrix.create(math.inv(m));
    },

    identity() {
      const m = JSON.parse(JSON.stringify(
        [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1]
        ]
      ));

      return Matrix.create(m);
    },

    rotation(angle, origin) {
      const sin                = Math.sin(angle);
      const cos                = Math.cos(angle);

      const m = [
        [cos, -sin, -origin.x * cos + origin.y * sin + origin.x],
        [sin,  cos, -origin.x * sin - origin.y * cos + origin.y],
        [0,    0,    1                                         ]
      ];

      return Matrix.create(m);
    },

    translation(vector) {
      const m = [
        [1, 0, vector.x],
        [0, 1, vector.y],
        [0, 0, 1       ]
      ];

      return Matrix.create(m);
    },

    scale(factor, origin = Vector.create(0, 0)) {
      const m = [
        [factor, 0,      origin.x - factor * origin.x],
        [0,      factor, origin.y - factor * origin.y],
        [0,      0,      1                           ]
      ];

      return Matrix.create(m);
    },
  };

  let aux = {};

  const actions = {
    select(state, input) {
      const toSelect = state.scene
        .findDescendant((node) => {
          return node._id === input.pointer.targetID;
        })
        .findAncestor((node) => {
          return node.props.class.includes('frontier');
        });

      if (toSelect) {
        toSelect.select();
        aux.source = Vector.create(input.pointer.x, input.pointer.y);    } else {
        state.scene.deselectAll();
      }
    },

    shift(state, input) {
      const selected = state.scene.selected;

      if (!selected) { return; }

      const target      = Vector.create(input.pointer.x, input.pointer.y);
      const translate   = target.subtract(aux.source);
      const translation = Matrix.translation(translate);

      selected.transform = selected
        .ancestorTransform().invert()
        .multiply(translation)
        .multiply(selected.globalTransform());

      aux.source = target;
    },

    initRotate(state, input) {
      const selected = state.scene.selected;
      aux.source     = Vector.create(input.pointer.x, input.pointer.y);
      const box      = selected.box;
      const center   = Vector.create(box.x + box.width/2, box.y + box.height/2);
      aux.center     = center.transform(selected.globalTransform());
    },

    rotate(state, input) {
      const selected          = state.scene.selected;
      const target            = Vector.create(input.pointer.x, input.pointer.y);
      const sourceMinusCenter = aux.source.subtract(aux.center);
      const targetMinusCenter = target.subtract(aux.center);

      const sourceAngle = Math.atan2(sourceMinusCenter.y, sourceMinusCenter.x);
      const targetAngle = Math.atan2(targetMinusCenter.y, targetMinusCenter.x);
      const angle       = targetAngle - sourceAngle;
      const rotation    = Matrix.rotation(angle, aux.center);

      selected.transform = selected
        .ancestorTransform().invert()
        .multiply(rotation)
        .multiply(selected.globalTransform());

      aux.source = target;
    },

    initScale(state, input) {
      const selected = state.scene.selected;
      aux.source     = Vector.create(input.pointer.x, input.pointer.y);
      const box      = selected.box;
      const center   = Vector.create(box.x + box.width/2, box.y + box.height/2);
      aux.center     = center.transform(selected.globalTransform());
    },

    scale(state, input) {
      const selected          = state.scene.selected;
      const target            = Vector.create(input.pointer.x, input.pointer.y);
      const sourceMinusCenter = aux.source.subtract(aux.center);
      const targetMinusCenter = target.subtract(aux.center);

      const sourceDistance = Math.sqrt(
        Math.pow(sourceMinusCenter.x, 2) +
        Math.pow(sourceMinusCenter.y, 2)
      );
      const targetDistance = Math.sqrt(
        Math.pow(targetMinusCenter.x, 2) +
        Math.pow(targetMinusCenter.y, 2)
      );
      const factor     = targetDistance / sourceDistance;
      const scaling    = Matrix.scale(factor, aux.center);

      selected.transform = selected
        .ancestorTransform().invert()
        .multiply(scaling)
        .multiply(selected.globalTransform());

      aux.source = target;
    },

    release(state, input) {
      const selected = state.scene.selected;

      for (let ancestor of selected.ancestors) {
        ancestor.updateBBox();
      }

      aux = {};
    },

    deepSelect(state, input) {
      const target = state.scene.findDescendant((node) => {
        return node._id === input.pointer.targetID;
      });

      if (target.isSelected()) {
        target.edit();
        state.scene.unfocusAll();
        // state.id = 'pen'; // hack!
      } else {
        const toSelect = target.findAncestor((node) => {
          return node.parent && node.parent.props.class.includes('frontier');
        });

        if (toSelect) {
          toSelect.select();
          state.scene.setFrontier();
          state.scene.unfocusAll();
        }
      }
    },

    focus(state, input) {
      state.scene.unfocusAll(); // expensive but effective

      const target = state.scene.findDescendant((node) => {
        return node._id === input.pointer.targetID;
      });

      if (target) {
        const toFocus = target.findAncestor((node) => {
          return node.classList.includes('frontier');
        });

        if (toFocus) {
          const pointer = Vector
            .create(input.pointer.x, input.pointer.y)
            .transform(toFocus.globalTransform().invert());

          if (pointer.isWithin(toFocus.box)) {
            toFocus.focus();
          }
        }
      }
    },

    deselect(state, event) {
      state.scene.deselectAll();
    },

    // OLD (partially useless?):

    createDoc(state, input) {
      state.init();
      state.docs.ids.push(state.doc._id);
      state.docs.selectedID = state._id;
    },

    updateDocList(state, input) {
      state.docs.ids = input.data.docIDs;
    },

    requestDoc(state, input) {
      state.docs.selectedID = input.pointer.targetID;
    },

    setDoc(state, input) {
      state.init(input.data.doc);
    },

    // Pen tool

    initPen(state, event) {
      console.log('starting to draw with pen');
    },


  };

  // 'type' is mandatory
  // 'from', 'target', 'to' and `do` are optional

  const config = [
    { from: 'start', type: 'kickoff', do: 'kickoff', to: 'idle' },
    { from: 'idle', type: 'mousemove', do: 'focus' },
    { from: 'idle', type: 'dblclick', target: 'content', do: 'deepSelect' },
    // ^ TODO fix this
    { from: 'idle', type: 'mousedown', target: 'content', do: 'select', to: 'shifting' },
    { from: 'idle', type: 'mousedown', target: 'root', do: 'deselect' },
    { from: 'shifting', type: 'mousemove', do: 'shift' },
    { from: 'shifting', type: 'mouseup', do: 'release', to: 'idle' },
    { from: 'idle', type: 'mousedown', target: 'dot', do: 'initRotate', to: 'rotating' },
    { from: 'rotating', type: 'mousemove', do: 'rotate' },
    { from: 'rotating', type: 'mouseup', do: 'release', to: 'idle' },
    { from: 'idle', type: 'mousedown', target: 'corner', do: 'initScale', to: 'scaling' },
    { from: 'scaling', type: 'mousemove', do: 'scale' },
    { from: 'scaling', type: 'mouseup', do: 'release', to: 'idle' },
    { type: 'click', target: 'doc-list-entry', do: 'requestDoc' },
    { type: 'docSaved' },
    { type: 'updateDocList', do: 'updateDocList' },
    { type: 'requestDoc', do: 'requestDoc', to: 'busy' },
    { from: 'busy', type: 'setDoc', do: 'setDoc', to: 'idle' },
    // { from: 'idle', type: 'click', target: 'usePen', do: 'deselect', to: 'pen' },
    // { from: 'pen', type: 'mousedown', do: 'initPen' },
  ];

  config.get = function(state, input) {
    const isMatch = (row) => {
      const from   = row.from;
      const type   = row.type;
      const target = row.target;

      const stateMatch  = from === state.id || from === undefined;
      const typeMatch   = type === input.type;
      const targetMatch = target === input.target || target === undefined;

      return stateMatch && typeMatch && targetMatch;
    };

    const match = config.find(isMatch);

    if (match) {
      // console.log(input.target); // note that inputs from db don't have a target
      return {
        do: match.do,
        to: match.to || state.id,
      };
    }
  };

  const Rectangle = {
    create(origin = Vector.create(), size = Vector.create()) {
      return Object.create(Rectangle).init(origin, size);
    },

    init(origin, size) {
      this.origin = origin;
      this.size = size;

      return this;
    },

    createFromDimensions(x, y, width, height) {
      const origin = Vector.create(x, y);
      const size   = Vector.create(width, height);

      return Rectangle.create(origin, size);
    },

    createFromMinMax(min, max) {
      const origin = Vector.create(min.x, min.y);
      const size   = Vector.create(max.x - min.x, max.y - min.y);

      return Rectangle.create(origin, size);
    },

    // TODO: better to call on rect1 for consistency?
    getBoundingRect(rect1, rect2) {
      let min = Vector.create();
      let max = Vector.create();

      min.x = Math.min(rect1.min().x, rect2.min().x);
      min.y = Math.min(rect1.min().y, rect2.min().y);
      max.x = Math.max(rect1.max().x, rect2.max().x);
      max.y = Math.max(rect1.max().y, rect2.max().y);

      return Rectangle.createFromMinMax(min, max);
    },

    min() {
      return Vector.create(this.origin.x, this.origin.y);
    },

    max() {
      return Vector.create(this.origin.x + this.size.x, this.origin.y + this.size.y);
    },

    get x() {
      return this.origin.x;
    },

    get y() {
      return this.origin.y;
    },

    get width() {
      return this.size.x;
    },

    get height() {
      return this.size.y;
    },

    corners() {
      return [
        this.origin, // NW
        Vector.create(this.origin.x + this.size.x, this.origin.y), // NE
        Vector.create(this.origin.x, this.origin.y + this.size.y), // SW
        Vector.create(this.origin.x + this.size.x, this.origin.y + this.size.y) // SE
      ];
    },

    toJSON() {
      return {
        x:      this.origin.x,
        y:      this.origin.y,
        width:  this.size.x,
        height: this.size.y,
      };
    },

  };

  const ClassList = {
    create(classNames = []) {
      return Object.create(ClassList).init(classNames);
    },

    init(classNames) {
      this.set = new Set(classNames);
      return this;
    },

    toJSON() {
      return Array.from(this.set).join(' ');
    },

    includes(className) {
      return this.set.has(className);
    },

    add(className) {
      this.set.add(className);
    },

    remove(className) {
      this.set.delete(className);
    },
  };

  // TODO: adapt bounding box code

  const createID$2 = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);
    return randomString + timestamp;
  };

  const Node = {
    create(opts = {}) {
      return Object.create(Node).init(opts);
    },

    init(opts) {
      this.set(this.defaults);
      this.set(opts);

      return this;
    },

    get defaults() {
      return {
        _id:         createID$2(),
        children:    [],
        parent:      null,
        tag:         null,
        path:        null,
        box:         Rectangle.create(),
        props:       {
          transform: Matrix.identity(),
          class:     ClassList.create(),
        },
      };
    },

    toJSON() {
      return {
        _id:         this._id,
        children:    this.children,
        parent:      this.parent && this.parent._id,
        tag:         this.tag,
        box:         this.box,
        path:        this.path,
        props:       this.props,
        globalScale: this.globalScaleFactor(),
      };
    },

    set(opts) {
      for (let key of Object.keys(opts)) {
        this[key] = opts[key];
      }
    },

    append(node) {
      this.children.push(node);
      node.parent = this;
    },

    get root() {
      return this.findAncestor(node => node.parent === null);
    },

    get leaves() {
      return this.findDescendants(node => node.children.length === 0);
    },

    isLeaf() {
      return this.children.length === 0;
    },

    get ancestors() {
      return this.findAncestors(node => true);
    },

    get descendants() {
      return this.findDescendants(node => true);
    },

    get siblings() {
      return this.parent.children.filter(node => node !== this);
    },

    get selected() {
      return this.root.findDescendant((node) => {
        return node.classList.includes('selected');
      });
    },

    isSelected() {
      return this.classList.includes('selected');
    },

    get frontier() {
      return this.root.findDescendants((node) => {
        return node.classList.includes('frontier');
      });
    },

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

    get classList() {
      return this.props.class;
    },

    set classList(value) {
      this.props.class = value;
    },

    get transform() {
      return this.props.transform;
    },

    set transform(value) {
      this.props.transform = value;
    },

    globalTransform() {
      return this.ancestorTransform().multiply(this.transform);
    },

    ancestorTransform() {
      let matrix = Matrix.identity();

      for (let ancestor of this.ancestors.reverse()) {
        matrix = matrix.multiply(ancestor.transform);
      }

      return matrix;
    },

    globalScaleFactor() {
      const total  = this.globalTransform();
      const a      = total.m[0][0];
      const b      = total.m[1][0];

      return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
    },

    // TODO: note that this method memoizes the calculation!
    // so it's more like store bBox ... but it also returns the box :-)
    computeBBox() {
      if (this.isLeaf()) {
        console.log(this.path.bBox());
        this.box = this.path.bBox();
      } else {
        const corners = [];

        for (let child of this.children) {
          for (let corner of child.computeBBox().corners()) {
            corners.push(corner.transform(child.transform));
          }
        }

        const xValue  = vector => vector.x;
        const xValues = corners.map(xValue);
        const yValue  = vector => vector.y;
        const yValues = corners.map(yValue);

        const min = Vector.create(Math.min(...xValues), Math.min(...yValues));
        const max = Vector.create(Math.max(...xValues), Math.max(...yValues));

        this.box = Rectangle.createFromMinMax(min, max);
      }

      return this.box;
    },

    // TODO: repetitive with the previous method
    updateBBox() {
      const corners = [];

      for (let child of this.children) {
        for (let corner of child.box.corners()) {
          corners.push(corner.transform(child.transform));
        }
      }

      const xValue  = vector => vector.x;
      const xValues = corners.map(xValue);
      const yValue  = vector => vector.y;
      const yValues = corners.map(yValue);

      const min = Vector.create(Math.min(...xValues), Math.min(...yValues));
      const max = Vector.create(Math.max(...xValues), Math.max(...yValues));

      this.box = Rectangle.createFromMinMax(min, max);
    },

    setFrontier() {
      this.removeFrontier();

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

    removeFrontier() {
      const frontier = this.root.findDescendants((node) => {
        return node.classList.includes('frontier');
      });

      for (let node of frontier) {
        node.classList.remove('frontier');
      }
    },

    focus() {
      this.classList.add('focus');
    },

    unfocusAll() {
      const focussed = this.root.findDescendants((node) => {
        return node.classList.includes('focus');
      });

      for (let node of focussed) {
        node.classList.remove('focus');
      }
    },

    select() {
      this.deselectAll();
      this.classList.add('selected');
      this.setFrontier();
    },

    edit() {
      this.deselectAll();
      this.setFrontier();
      this.classList.add('editing');
    },

    deselectAll() {
      if (this.selected) {
        this.selected.classList.remove('selected');
      }
      this.setFrontier();
    },

    // plot point for debugging
    // plot(point) {
    //   const node = Node.create();
    //   node.tag = 'circle';
    //   node.props = Object.assign(node.props, {
    //     r: 5, cx: point[0], cy: point[1], fill: 'red'
    //   });
    //   node.box = { x: point[0], y: point[1], width: 5, height: 5};
    //   this.root.append(node);
    // },
  };

  var extendStatics=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,a){t.__proto__=a;}||function(t,a){for(var r in a)a.hasOwnProperty(r)&&(t[r]=a[r]);};function __extends(t,a){function r(){this.constructor=t;}extendStatics(t,a),t.prototype=null===a?Object.create(a):(r.prototype=a.prototype,new r);}function rotate(t,a){var r=t[0],e=t[1];return [r*Math.cos(a)-e*Math.sin(a),r*Math.sin(a)+e*Math.cos(a)]}function assertNumbers(){for(var t=[],a=0;a<arguments.length;a++)t[a]=arguments[a];for(var r=0;r<t.length;r++)if("number"!=typeof t[r])throw new Error("assertNumbers arguments["+r+"] is not a number. "+typeof t[r]+" == typeof "+t[r]);return !0}var PI=Math.PI;function annotateArcCommand(t,a,r){t.lArcFlag=0===t.lArcFlag?0:1,t.sweepFlag=0===t.sweepFlag?0:1;var e=t.rX,n=t.rY,i=t.x,o=t.y;e=Math.abs(t.rX),n=Math.abs(t.rY);var s=rotate([(a-i)/2,(r-o)/2],-t.xRot/180*PI),h=s[0],u=s[1],c=Math.pow(h,2)/Math.pow(e,2)+Math.pow(u,2)/Math.pow(n,2);1<c&&(e*=Math.sqrt(c),n*=Math.sqrt(c)),t.rX=e,t.rY=n;var m=Math.pow(e,2)*Math.pow(u,2)+Math.pow(n,2)*Math.pow(h,2),_=(t.lArcFlag!==t.sweepFlag?1:-1)*Math.sqrt(Math.max(0,(Math.pow(e,2)*Math.pow(n,2)-m)/m)),T=e*u/n*_,O=-n*h/e*_,p=rotate([T,O],t.xRot/180*PI);t.cX=p[0]+(a+i)/2,t.cY=p[1]+(r+o)/2,t.phi1=Math.atan2((u-O)/n,(h-T)/e),t.phi2=Math.atan2((-u-O)/n,(-h-T)/e),0===t.sweepFlag&&t.phi2>t.phi1&&(t.phi2-=2*PI),1===t.sweepFlag&&t.phi2<t.phi1&&(t.phi2+=2*PI),t.phi1*=180/PI,t.phi2*=180/PI;}function intersectionUnitCircleLine(t,a,r){assertNumbers(t,a,r);var e=t*t+a*a-r*r;if(0>e)return [];if(0===e)return [[t*r/(t*t+a*a),a*r/(t*t+a*a)]];var n=Math.sqrt(e);return [[(t*r+a*n)/(t*t+a*a),(a*r-t*n)/(t*t+a*a)],[(t*r-a*n)/(t*t+a*a),(a*r+t*n)/(t*t+a*a)]]}var SVGPathDataTransformer,DEG=Math.PI/180;function lerp(t,a,r){return (1-r)*t+r*a}function arcAt(t,a,r,e){return t+Math.cos(e/180*PI)*a+Math.sin(e/180*PI)*r}function bezierRoot(t,a,r,e){var n=a-t,i=r-a,o=3*n+3*(e-r)-6*i,s=6*(i-n),h=3*n;return Math.abs(o)<1e-6?[-h/s]:pqFormula(s/o,h/o,1e-6)}function bezierAt(t,a,r,e,n){var i=1-n;return t*(i*i*i)+a*(3*i*i*n)+r*(3*i*n*n)+e*(n*n*n)}function pqFormula(t,a,r){void 0===r&&(r=1e-6);var e=t*t/4-a;if(e<-r)return [];if(e<=r)return [-t/2];var n=Math.sqrt(e);return [-t/2-n,-t/2+n]}function a2c(t,a,r){var e,n,i,o;t.cX||annotateArcCommand(t,a,r);for(var s=Math.min(t.phi1,t.phi2),h=Math.max(t.phi1,t.phi2)-s,u=Math.ceil(h/90),c=new Array(u),m=a,_=r,T=0;T<u;T++){var O=lerp(t.phi1,t.phi2,T/u),p=lerp(t.phi1,t.phi2,(T+1)/u),y=p-O,S=4/3*Math.tan(y*DEG/4),f=[Math.cos(O*DEG)-S*Math.sin(O*DEG),Math.sin(O*DEG)+S*Math.cos(O*DEG)],V=f[0],N=f[1],D=[Math.cos(p*DEG),Math.sin(p*DEG)],P=D[0],l=D[1],v=[P+S*Math.sin(p*DEG),l-S*Math.cos(p*DEG)],E=v[0],A=v[1];c[T]={relative:t.relative,type:SVGPathData.CURVE_TO};var d=function(a,r){var e=rotate([a*t.rX,r*t.rY],t.xRot),n=e[0],i=e[1];return [t.cX+n,t.cY+i]};e=d(V,N),c[T].x1=e[0],c[T].y1=e[1],n=d(E,A),c[T].x2=n[0],c[T].y2=n[1],i=d(P,l),c[T].x=i[0],c[T].y=i[1],t.relative&&(c[T].x1-=m,c[T].y1-=_,c[T].x2-=m,c[T].y2-=_,c[T].x-=m,c[T].y-=_),m=(o=[c[T].x,c[T].y])[0],_=o[1];}return c}!function(t){function a(){return n(function(t,a,r){return t.relative&&(void 0!==t.x1&&(t.x1+=a),void 0!==t.y1&&(t.y1+=r),void 0!==t.x2&&(t.x2+=a),void 0!==t.y2&&(t.y2+=r),void 0!==t.x&&(t.x+=a),void 0!==t.y&&(t.y+=r),t.relative=!1),t})}function r(){var t=NaN,a=NaN,r=NaN,e=NaN;return n(function(n,i,o){return n.type&SVGPathData.SMOOTH_CURVE_TO&&(n.type=SVGPathData.CURVE_TO,t=isNaN(t)?i:t,a=isNaN(a)?o:a,n.x1=n.relative?i-t:2*i-t,n.y1=n.relative?o-a:2*o-a),n.type&SVGPathData.CURVE_TO?(t=n.relative?i+n.x2:n.x2,a=n.relative?o+n.y2:n.y2):(t=NaN,a=NaN),n.type&SVGPathData.SMOOTH_QUAD_TO&&(n.type=SVGPathData.QUAD_TO,r=isNaN(r)?i:r,e=isNaN(e)?o:e,n.x1=n.relative?i-r:2*i-r,n.y1=n.relative?o-e:2*o-e),n.type&SVGPathData.QUAD_TO?(r=n.relative?i+n.x1:n.x1,e=n.relative?o+n.y1:n.y1):(r=NaN,e=NaN),n})}function e(){var t=NaN,a=NaN;return n(function(r,e,n){if(r.type&SVGPathData.SMOOTH_QUAD_TO&&(r.type=SVGPathData.QUAD_TO,t=isNaN(t)?e:t,a=isNaN(a)?n:a,r.x1=r.relative?e-t:2*e-t,r.y1=r.relative?n-a:2*n-a),r.type&SVGPathData.QUAD_TO){t=r.relative?e+r.x1:r.x1,a=r.relative?n+r.y1:r.y1;var i=r.x1,o=r.y1;r.type=SVGPathData.CURVE_TO,r.x1=((r.relative?0:e)+2*i)/3,r.y1=((r.relative?0:n)+2*o)/3,r.x2=(r.x+2*i)/3,r.y2=(r.y+2*o)/3;}else t=NaN,a=NaN;return r})}function n(t){var a=0,r=0,e=NaN,n=NaN;return function(i){if(isNaN(e)&&!(i.type&SVGPathData.MOVE_TO))throw new Error("path must start with moveto");var o=t(i,a,r,e,n);return i.type&SVGPathData.CLOSE_PATH&&(a=e,r=n),void 0!==i.x&&(a=i.relative?a+i.x:i.x),void 0!==i.y&&(r=i.relative?r+i.y:i.y),i.type&SVGPathData.MOVE_TO&&(e=a,n=r),o}}function i(t,a,r,e,i,o){return assertNumbers(t,a,r,e,i,o),n(function(n,s,h,u){var c=n.x1,m=n.x2,_=n.relative&&!isNaN(u),T=void 0!==n.x?n.x:_?0:s,O=void 0!==n.y?n.y:_?0:h;function p(t){return t*t}n.type&SVGPathData.HORIZ_LINE_TO&&0!==a&&(n.type=SVGPathData.LINE_TO,n.y=n.relative?0:h),n.type&SVGPathData.VERT_LINE_TO&&0!==r&&(n.type=SVGPathData.LINE_TO,n.x=n.relative?0:s),void 0!==n.x&&(n.x=n.x*t+O*r+(_?0:i)),void 0!==n.y&&(n.y=T*a+n.y*e+(_?0:o)),void 0!==n.x1&&(n.x1=n.x1*t+n.y1*r+(_?0:i)),void 0!==n.y1&&(n.y1=c*a+n.y1*e+(_?0:o)),void 0!==n.x2&&(n.x2=n.x2*t+n.y2*r+(_?0:i)),void 0!==n.y2&&(n.y2=m*a+n.y2*e+(_?0:o));var y=t*e-a*r;if(void 0!==n.xRot&&(1!==t||0!==a||0!==r||1!==e))if(0===y)delete n.rX,delete n.rY,delete n.xRot,delete n.lArcFlag,delete n.sweepFlag,n.type=SVGPathData.LINE_TO;else{var S=n.xRot*Math.PI/180,f=Math.sin(S),V=Math.cos(S),N=1/p(n.rX),D=1/p(n.rY),P=p(V)*N+p(f)*D,l=2*f*V*(N-D),v=p(f)*N+p(V)*D,E=P*e*e-l*a*e+v*a*a,A=l*(t*e+a*r)-2*(P*r*e+v*t*a),d=P*r*r-l*t*r+v*t*t,G=(Math.atan2(A,E-d)+Math.PI)%Math.PI/2,C=Math.sin(G),x=Math.cos(G);n.rX=Math.abs(y)/Math.sqrt(E*p(x)+A*C*x+d*p(C)),n.rY=Math.abs(y)/Math.sqrt(E*p(C)-A*C*x+d*p(x)),n.xRot=180*G/Math.PI;}return void 0!==n.sweepFlag&&0>y&&(n.sweepFlag=+!n.sweepFlag),n})}function o(){return function(t){var a={};for(var r in t)a[r]=t[r];return a}}t.ROUND=function(t){function a(a){return Math.round(a*t)/t}return void 0===t&&(t=1e13),assertNumbers(t),function(t){return void 0!==t.x1&&(t.x1=a(t.x1)),void 0!==t.y1&&(t.y1=a(t.y1)),void 0!==t.x2&&(t.x2=a(t.x2)),void 0!==t.y2&&(t.y2=a(t.y2)),void 0!==t.x&&(t.x=a(t.x)),void 0!==t.y&&(t.y=a(t.y)),t}},t.TO_ABS=a,t.TO_REL=function(){return n(function(t,a,r){return t.relative||(void 0!==t.x1&&(t.x1-=a),void 0!==t.y1&&(t.y1-=r),void 0!==t.x2&&(t.x2-=a),void 0!==t.y2&&(t.y2-=r),void 0!==t.x&&(t.x-=a),void 0!==t.y&&(t.y-=r),t.relative=!0),t})},t.NORMALIZE_HVZ=function(t,a,r){return void 0===t&&(t=!0),void 0===a&&(a=!0),void 0===r&&(r=!0),n(function(e,n,i,o,s){if(isNaN(o)&&!(e.type&SVGPathData.MOVE_TO))throw new Error("path must start with moveto");return a&&e.type&SVGPathData.HORIZ_LINE_TO&&(e.type=SVGPathData.LINE_TO,e.y=e.relative?0:i),r&&e.type&SVGPathData.VERT_LINE_TO&&(e.type=SVGPathData.LINE_TO,e.x=e.relative?0:n),t&&e.type&SVGPathData.CLOSE_PATH&&(e.type=SVGPathData.LINE_TO,e.x=e.relative?o-n:o,e.y=e.relative?s-i:s),e.type&SVGPathData.ARC&&(0===e.rX||0===e.rY)&&(e.type=SVGPathData.LINE_TO,delete e.rX,delete e.rY,delete e.xRot,delete e.lArcFlag,delete e.sweepFlag),e})},t.NORMALIZE_ST=r,t.QT_TO_C=e,t.INFO=n,t.SANITIZE=function(t){void 0===t&&(t=0),assertNumbers(t);var a=NaN,r=NaN,e=NaN,i=NaN;return n(function(n,o,s,h,u){var c=Math.abs,m=!1,_=0,T=0;if(n.type&SVGPathData.SMOOTH_CURVE_TO&&(_=isNaN(a)?0:o-a,T=isNaN(r)?0:s-r),n.type&(SVGPathData.CURVE_TO|SVGPathData.SMOOTH_CURVE_TO)?(a=n.relative?o+n.x2:n.x2,r=n.relative?s+n.y2:n.y2):(a=NaN,r=NaN),n.type&SVGPathData.SMOOTH_QUAD_TO?(e=isNaN(e)?o:2*o-e,i=isNaN(i)?s:2*s-i):n.type&SVGPathData.QUAD_TO?(e=n.relative?o+n.x1:n.x1,i=n.relative?s+n.y1:n.y2):(e=NaN,i=NaN),n.type&SVGPathData.LINE_COMMANDS||n.type&SVGPathData.ARC&&(0===n.rX||0===n.rY||!n.lArcFlag)||n.type&SVGPathData.CURVE_TO||n.type&SVGPathData.SMOOTH_CURVE_TO||n.type&SVGPathData.QUAD_TO||n.type&SVGPathData.SMOOTH_QUAD_TO){var O=void 0===n.x?0:n.relative?n.x:n.x-o,p=void 0===n.y?0:n.relative?n.y:n.y-s;_=isNaN(e)?void 0===n.x1?_:n.relative?n.x:n.x1-o:e-o,T=isNaN(i)?void 0===n.y1?T:n.relative?n.y:n.y1-s:i-s;var y=void 0===n.x2?0:n.relative?n.x:n.x2-o,S=void 0===n.y2?0:n.relative?n.y:n.y2-s;c(O)<=t&&c(p)<=t&&c(_)<=t&&c(T)<=t&&c(y)<=t&&c(S)<=t&&(m=!0);}return n.type&SVGPathData.CLOSE_PATH&&c(o-h)<=t&&c(s-u)<=t&&(m=!0),m?[]:n})},t.MATRIX=i,t.ROTATE=function(t,a,r){void 0===a&&(a=0),void 0===r&&(r=0),assertNumbers(t,a,r);var e=Math.sin(t),n=Math.cos(t);return i(n,e,-e,n,a-a*n+r*e,r-a*e-r*n)},t.TRANSLATE=function(t,a){return void 0===a&&(a=0),assertNumbers(t,a),i(1,0,0,1,t,a)},t.SCALE=function(t,a){return void 0===a&&(a=t),assertNumbers(t,a),i(t,0,0,a,0,0)},t.SKEW_X=function(t){return assertNumbers(t),i(1,0,Math.atan(t),1,0,0)},t.SKEW_Y=function(t){return assertNumbers(t),i(1,Math.atan(t),0,1,0,0)},t.X_AXIS_SYMMETRY=function(t){return void 0===t&&(t=0),assertNumbers(t),i(-1,0,0,1,t,0)},t.Y_AXIS_SYMMETRY=function(t){return void 0===t&&(t=0),assertNumbers(t),i(1,0,0,-1,0,t)},t.A_TO_C=function(){return n(function(t,a,r){return SVGPathData.ARC===t.type?a2c(t,t.relative?0:a,t.relative?0:r):t})},t.ANNOTATE_ARCS=function(){return n(function(t,a,r){return t.relative&&(a=0,r=0),SVGPathData.ARC===t.type&&annotateArcCommand(t,a,r),t})},t.CLONE=o,t.CALCULATE_BOUNDS=function(){var t=function(t){var a={};for(var r in t)a[r]=t[r];return a},i=a(),o=e(),s=r(),h=n(function(a,r,e){var n=s(o(i(t(a))));function u(t){t>h.maxX&&(h.maxX=t),t<h.minX&&(h.minX=t);}function c(t){t>h.maxY&&(h.maxY=t),t<h.minY&&(h.minY=t);}if(n.type&SVGPathData.DRAWING_COMMANDS&&(u(r),c(e)),n.type&SVGPathData.HORIZ_LINE_TO&&u(n.x),n.type&SVGPathData.VERT_LINE_TO&&c(n.y),n.type&SVGPathData.LINE_TO&&(u(n.x),c(n.y)),n.type&SVGPathData.CURVE_TO){u(n.x),c(n.y);for(var m=0,_=bezierRoot(r,n.x1,n.x2,n.x);m<_.length;m++)0<(G=_[m])&&1>G&&u(bezierAt(r,n.x1,n.x2,n.x,G));for(var T=0,O=bezierRoot(e,n.y1,n.y2,n.y);T<O.length;T++)0<(G=O[T])&&1>G&&c(bezierAt(e,n.y1,n.y2,n.y,G));}if(n.type&SVGPathData.ARC){u(n.x),c(n.y),annotateArcCommand(n,r,e);for(var p=n.xRot/180*Math.PI,y=Math.cos(p)*n.rX,S=Math.sin(p)*n.rX,f=-Math.sin(p)*n.rY,V=Math.cos(p)*n.rY,N=n.phi1<n.phi2?[n.phi1,n.phi2]:-180>n.phi2?[n.phi2+360,n.phi1+360]:[n.phi2,n.phi1],D=N[0],P=N[1],l=function(t){var a=t[0],r=t[1],e=180*Math.atan2(r,a)/Math.PI;return e<D?e+360:e},v=0,E=intersectionUnitCircleLine(f,-y,0).map(l);v<E.length;v++)(G=E[v])>D&&G<P&&u(arcAt(n.cX,y,f,G));for(var A=0,d=intersectionUnitCircleLine(V,-S,0).map(l);A<d.length;A++){var G;(G=d[A])>D&&G<P&&c(arcAt(n.cY,S,V,G));}}return a});return h.minX=1/0,h.maxX=-1/0,h.minY=1/0,h.maxY=-1/0,h};}(SVGPathDataTransformer||(SVGPathDataTransformer={}));var _a,_a$1,TransformableSVG=function(){function t(){}return t.prototype.round=function(t){return this.transform(SVGPathDataTransformer.ROUND(t))},t.prototype.toAbs=function(){return this.transform(SVGPathDataTransformer.TO_ABS())},t.prototype.toRel=function(){return this.transform(SVGPathDataTransformer.TO_REL())},t.prototype.normalizeHVZ=function(t,a,r){return this.transform(SVGPathDataTransformer.NORMALIZE_HVZ(t,a,r))},t.prototype.normalizeST=function(){return this.transform(SVGPathDataTransformer.NORMALIZE_ST())},t.prototype.qtToC=function(){return this.transform(SVGPathDataTransformer.QT_TO_C())},t.prototype.aToC=function(){return this.transform(SVGPathDataTransformer.A_TO_C())},t.prototype.sanitize=function(t){return this.transform(SVGPathDataTransformer.SANITIZE(t))},t.prototype.translate=function(t,a){return this.transform(SVGPathDataTransformer.TRANSLATE(t,a))},t.prototype.scale=function(t,a){return this.transform(SVGPathDataTransformer.SCALE(t,a))},t.prototype.rotate=function(t,a,r){return this.transform(SVGPathDataTransformer.ROTATE(t,a,r))},t.prototype.matrix=function(t,a,r,e,n,i){return this.transform(SVGPathDataTransformer.MATRIX(t,a,r,e,n,i))},t.prototype.skewX=function(t){return this.transform(SVGPathDataTransformer.SKEW_X(t))},t.prototype.skewY=function(t){return this.transform(SVGPathDataTransformer.SKEW_Y(t))},t.prototype.xSymmetry=function(t){return this.transform(SVGPathDataTransformer.X_AXIS_SYMMETRY(t))},t.prototype.ySymmetry=function(t){return this.transform(SVGPathDataTransformer.Y_AXIS_SYMMETRY(t))},t.prototype.annotateArcs=function(){return this.transform(SVGPathDataTransformer.ANNOTATE_ARCS())},t}(),isWhiteSpace=function(t){return " "===t||"\t"===t||"\r"===t||"\n"===t},isDigit=function(t){return "0".charCodeAt(0)<=t.charCodeAt(0)&&t.charCodeAt(0)<="9".charCodeAt(0)},SVGPathDataParser$$1=function(t){function a(){var a=t.call(this)||this;return a.curNumber="",a.curCommandType=-1,a.curCommandRelative=!1,a.canParseCommandOrComma=!0,a.curNumberHasExp=!1,a.curNumberHasExpDigits=!1,a.curNumberHasDecimal=!1,a.curArgs=[],a}return __extends(a,t),a.prototype.finish=function(t){if(void 0===t&&(t=[]),this.parse(" ",t),0!==this.curArgs.length||!this.canParseCommandOrComma)throw new SyntaxError("Unterminated command at the path end.");return t},a.prototype.parse=function(t,a){var r=this;void 0===a&&(a=[]);for(var e=function(t){a.push(t),r.curArgs.length=0,r.canParseCommandOrComma=!0;},n=0;n<t.length;n++){var i=t[n];if(isDigit(i))this.curNumber+=i,this.curNumberHasExpDigits=this.curNumberHasExp;else if("e"!==i&&"E"!==i)if("-"!==i&&"+"!==i||!this.curNumberHasExp||this.curNumberHasExpDigits)if("."!==i||this.curNumberHasExp||this.curNumberHasDecimal){if(this.curNumber&&-1!==this.curCommandType){var o=Number(this.curNumber);if(isNaN(o))throw new SyntaxError("Invalid number ending at "+n);if(this.curCommandType===SVGPathData.ARC)if(0===this.curArgs.length||1===this.curArgs.length){if(0>o)throw new SyntaxError('Expected positive number, got "'+o+'" at index "'+n+'"')}else if((3===this.curArgs.length||4===this.curArgs.length)&&"0"!==this.curNumber&&"1"!==this.curNumber)throw new SyntaxError('Expected a flag, got "'+this.curNumber+'" at index "'+n+'"');this.curArgs.push(o),this.curArgs.length===COMMAND_ARG_COUNTS[this.curCommandType]&&(SVGPathData.HORIZ_LINE_TO===this.curCommandType?e({type:SVGPathData.HORIZ_LINE_TO,relative:this.curCommandRelative,x:o}):SVGPathData.VERT_LINE_TO===this.curCommandType?e({type:SVGPathData.VERT_LINE_TO,relative:this.curCommandRelative,y:o}):this.curCommandType===SVGPathData.MOVE_TO||this.curCommandType===SVGPathData.LINE_TO||this.curCommandType===SVGPathData.SMOOTH_QUAD_TO?(e({type:this.curCommandType,relative:this.curCommandRelative,x:this.curArgs[0],y:this.curArgs[1]}),SVGPathData.MOVE_TO===this.curCommandType&&(this.curCommandType=SVGPathData.LINE_TO)):this.curCommandType===SVGPathData.CURVE_TO?e({type:SVGPathData.CURVE_TO,relative:this.curCommandRelative,x1:this.curArgs[0],y1:this.curArgs[1],x2:this.curArgs[2],y2:this.curArgs[3],x:this.curArgs[4],y:this.curArgs[5]}):this.curCommandType===SVGPathData.SMOOTH_CURVE_TO?e({type:SVGPathData.SMOOTH_CURVE_TO,relative:this.curCommandRelative,x2:this.curArgs[0],y2:this.curArgs[1],x:this.curArgs[2],y:this.curArgs[3]}):this.curCommandType===SVGPathData.QUAD_TO?e({type:SVGPathData.QUAD_TO,relative:this.curCommandRelative,x1:this.curArgs[0],y1:this.curArgs[1],x:this.curArgs[2],y:this.curArgs[3]}):this.curCommandType===SVGPathData.ARC&&e({type:SVGPathData.ARC,relative:this.curCommandRelative,rX:this.curArgs[0],rY:this.curArgs[1],xRot:this.curArgs[2],lArcFlag:this.curArgs[3],sweepFlag:this.curArgs[4],x:this.curArgs[5],y:this.curArgs[6]})),this.curNumber="",this.curNumberHasExpDigits=!1,this.curNumberHasExp=!1,this.curNumberHasDecimal=!1,this.canParseCommandOrComma=!0;}if(!isWhiteSpace(i))if(","===i&&this.canParseCommandOrComma)this.canParseCommandOrComma=!1;else if("+"!==i&&"-"!==i&&"."!==i){if(0!==this.curArgs.length)throw new SyntaxError("Unterminated command at index "+n+".");if(!this.canParseCommandOrComma)throw new SyntaxError('Unexpected character "'+i+'" at index '+n+". Command cannot follow comma");if(this.canParseCommandOrComma=!1,"z"!==i&&"Z"!==i)if("h"===i||"H"===i)this.curCommandType=SVGPathData.HORIZ_LINE_TO,this.curCommandRelative="h"===i;else if("v"===i||"V"===i)this.curCommandType=SVGPathData.VERT_LINE_TO,this.curCommandRelative="v"===i;else if("m"===i||"M"===i)this.curCommandType=SVGPathData.MOVE_TO,this.curCommandRelative="m"===i;else if("l"===i||"L"===i)this.curCommandType=SVGPathData.LINE_TO,this.curCommandRelative="l"===i;else if("c"===i||"C"===i)this.curCommandType=SVGPathData.CURVE_TO,this.curCommandRelative="c"===i;else if("s"===i||"S"===i)this.curCommandType=SVGPathData.SMOOTH_CURVE_TO,this.curCommandRelative="s"===i;else if("q"===i||"Q"===i)this.curCommandType=SVGPathData.QUAD_TO,this.curCommandRelative="q"===i;else if("t"===i||"T"===i)this.curCommandType=SVGPathData.SMOOTH_QUAD_TO,this.curCommandRelative="t"===i;else{if("a"!==i&&"A"!==i)throw new SyntaxError('Unexpected character "'+i+'" at index '+n+".");this.curCommandType=SVGPathData.ARC,this.curCommandRelative="a"===i;}else a.push({type:SVGPathData.CLOSE_PATH}),this.canParseCommandOrComma=!0,this.curCommandType=-1;}else this.curNumber=i,this.curNumberHasDecimal="."===i;}else this.curNumber+=i,this.curNumberHasDecimal=!0;else this.curNumber+=i;else this.curNumber+=i,this.curNumberHasExp=!0;}return a},a.prototype.transform=function(t){return Object.create(this,{parse:{value:function(a,r){void 0===r&&(r=[]);for(var e=0,n=Object.getPrototypeOf(this).parse.call(this,a);e<n.length;e++){var i=n[e],o=t(i);Array.isArray(o)?r.push.apply(r,o):r.push(o);}return r}}})},a}(TransformableSVG),SVGPathData=function(t){function a(r){var e=t.call(this)||this;return e.commands="string"==typeof r?a.parse(r):r,e}return __extends(a,t),a.prototype.encode=function(){return a.encode(this.commands)},a.prototype.getBounds=function(){var t=SVGPathDataTransformer.CALCULATE_BOUNDS();return this.transform(t),t},a.prototype.transform=function(t){for(var a=[],r=0,e=this.commands;r<e.length;r++){var n=t(e[r]);Array.isArray(n)?a.push.apply(a,n):a.push(n);}return this.commands=a,this},a.encode=function(t){return encodeSVGPath$$1(t)},a.parse=function(t){var a=new SVGPathDataParser$$1,r=[];return a.parse(t,r),a.finish(r),r},a.CLOSE_PATH=1,a.MOVE_TO=2,a.HORIZ_LINE_TO=4,a.VERT_LINE_TO=8,a.LINE_TO=16,a.CURVE_TO=32,a.SMOOTH_CURVE_TO=64,a.QUAD_TO=128,a.SMOOTH_QUAD_TO=256,a.ARC=512,a.LINE_COMMANDS=a.LINE_TO|a.HORIZ_LINE_TO|a.VERT_LINE_TO,a.DRAWING_COMMANDS=a.HORIZ_LINE_TO|a.VERT_LINE_TO|a.LINE_TO|a.CURVE_TO|a.SMOOTH_CURVE_TO|a.QUAD_TO|a.SMOOTH_QUAD_TO|a.ARC,a}(TransformableSVG),COMMAND_ARG_COUNTS=((_a={})[SVGPathData.MOVE_TO]=2,_a[SVGPathData.LINE_TO]=2,_a[SVGPathData.HORIZ_LINE_TO]=1,_a[SVGPathData.VERT_LINE_TO]=1,_a[SVGPathData.CLOSE_PATH]=0,_a[SVGPathData.QUAD_TO]=4,_a[SVGPathData.SMOOTH_QUAD_TO]=2,_a[SVGPathData.CURVE_TO]=6,_a[SVGPathData.SMOOTH_CURVE_TO]=4,_a[SVGPathData.ARC]=7,_a),WSP=" ";function encodeSVGPath$$1(t){var a="";Array.isArray(t)||(t=[t]);for(var r=0;r<t.length;r++){var e=t[r];if(e.type===SVGPathData.CLOSE_PATH)a+="z";else if(e.type===SVGPathData.HORIZ_LINE_TO)a+=(e.relative?"h":"H")+e.x;else if(e.type===SVGPathData.VERT_LINE_TO)a+=(e.relative?"v":"V")+e.y;else if(e.type===SVGPathData.MOVE_TO)a+=(e.relative?"m":"M")+e.x+WSP+e.y;else if(e.type===SVGPathData.LINE_TO)a+=(e.relative?"l":"L")+e.x+WSP+e.y;else if(e.type===SVGPathData.CURVE_TO)a+=(e.relative?"c":"C")+e.x1+WSP+e.y1+WSP+e.x2+WSP+e.y2+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.SMOOTH_CURVE_TO)a+=(e.relative?"s":"S")+e.x2+WSP+e.y2+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.QUAD_TO)a+=(e.relative?"q":"Q")+e.x1+WSP+e.y1+WSP+e.x+WSP+e.y;else if(e.type===SVGPathData.SMOOTH_QUAD_TO)a+=(e.relative?"t":"T")+e.x+WSP+e.y;else{if(e.type!==SVGPathData.ARC)throw new Error('Unexpected command type "'+e.type+'" at index '+r+".");a+=(e.relative?"a":"A")+e.rX+WSP+e.rY+WSP+e.xRot+WSP+ +e.lArcFlag+WSP+ +e.sweepFlag+WSP+e.x+WSP+e.y;}}return a}var SVGPathData$1=function(t){function a(r){var e=t.call(this)||this;return e.commands="string"==typeof r?a.parse(r):r,e}return __extends(a,t),a.prototype.encode=function(){return a.encode(this.commands)},a.prototype.getBounds=function(){var t=SVGPathDataTransformer.CALCULATE_BOUNDS();return this.transform(t),t},a.prototype.transform=function(t){for(var a=[],r=0,e=this.commands;r<e.length;r++){var n=t(e[r]);Array.isArray(n)?a.push.apply(a,n):a.push(n);}return this.commands=a,this},a.encode=function(t){return encodeSVGPath$$1(t)},a.parse=function(t){var a=new SVGPathDataParser$$1,r=[];return a.parse(t,r),a.finish(r),r},a.CLOSE_PATH=1,a.MOVE_TO=2,a.HORIZ_LINE_TO=4,a.VERT_LINE_TO=8,a.LINE_TO=16,a.CURVE_TO=32,a.SMOOTH_CURVE_TO=64,a.QUAD_TO=128,a.SMOOTH_QUAD_TO=256,a.ARC=512,a.LINE_COMMANDS=a.LINE_TO|a.HORIZ_LINE_TO|a.VERT_LINE_TO,a.DRAWING_COMMANDS=a.HORIZ_LINE_TO|a.VERT_LINE_TO|a.LINE_TO|a.CURVE_TO|a.SMOOTH_CURVE_TO|a.QUAD_TO|a.SMOOTH_QUAD_TO|a.ARC,a}(TransformableSVG),COMMAND_ARG_COUNTS$1=((_a$1={})[SVGPathData$1.MOVE_TO]=2,_a$1[SVGPathData$1.LINE_TO]=2,_a$1[SVGPathData$1.HORIZ_LINE_TO]=1,_a$1[SVGPathData$1.VERT_LINE_TO]=1,_a$1[SVGPathData$1.CLOSE_PATH]=0,_a$1[SVGPathData$1.QUAD_TO]=4,_a$1[SVGPathData$1.SMOOTH_QUAD_TO]=2,_a$1[SVGPathData$1.CURVE_TO]=6,_a$1[SVGPathData$1.SMOOTH_CURVE_TO]=4,_a$1[SVGPathData$1.ARC]=7,_a$1);

  const Segment = {
    create(vectors = {}) {
      return Object.create(Segment).init(vectors);
    },

    init(vectors) {
      this.anchor    = vectors.anchor;
      this.handleIn  = vectors.handleIn;
      this.handleOut = vectors.handleOut;

      return this;
    },
  };

  // Bezier.js library by Pomax, https://github.com/Pomax/bezierjs

  var Bezier=function(t){function r(i){if(n[i])return n[i].exports;var e=n[i]={exports:{},id:i,loaded:!1};return t[i].call(e.exports,e,e.exports,r),e.loaded=!0,e.exports}var n={};return r.m=t,r.c=n,r.p="",r(0)}([function(t,r,n){t.exports=n(1);},function(t,r,n){var i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol?"symbol":typeof t};!function(){function r(t,r,n,i,e){"undefined"==typeof e&&(e=.5);var o=l.projectionratio(e,t),s=1-o,u={x:o*r.x+s*i.x,y:o*r.y+s*i.y},a=l.abcratio(e,t),f={x:n.x+(n.x-u.x)/a,y:n.y+(n.y-u.y)/a};return {A:f,B:n,C:u}}var e=Math.abs,o=Math.min,s=Math.max,u=Math.cos,a=Math.sin,f=Math.acos,c=Math.sqrt,h=Math.PI,x={x:0,y:0,z:0},l=n(2),y=n(3),p=function(t){var r=t&&t.forEach?t:[].slice.call(arguments),n=!1;if("object"===i(r[0])){n=r.length;var o=[];r.forEach(function(t){["x","y","z"].forEach(function(r){"undefined"!=typeof t[r]&&o.push(t[r]);});}),r=o;}var s=!1,u=r.length;if(n){if(n>4){if(1!==arguments.length)throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");s=!0;}}else if(6!==u&&8!==u&&9!==u&&12!==u&&1!==arguments.length)throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");var a=!s&&(9===u||12===u)||t&&t[0]&&"undefined"!=typeof t[0].z;this._3d=a;for(var f=[],c=0,h=a?3:2;u>c;c+=h){var x={x:r[c],y:r[c+1]};a&&(x.z=r[c+2]),f.push(x);}this.order=f.length-1,this.points=f;var y=["x","y"];a&&y.push("z"),this.dims=y,this.dimlen=y.length,function(t){for(var r=t.order,n=t.points,i=l.align(n,{p1:n[0],p2:n[r]}),o=0;o<i.length;o++)if(e(i[o].y)>1e-4)return void(t._linear=!1);t._linear=!0;}(this),this._t1=0,this._t2=1,this.update();},v=n(4);p.SVGtoBeziers=function(t){return v(p,t)},p.quadraticFromPoints=function(t,n,i,e){if("undefined"==typeof e&&(e=.5),0===e)return new p(n,n,i);if(1===e)return new p(t,n,n);var o=r(2,t,n,i,e);return new p(t,o.A,i)},p.cubicFromPoints=function(t,n,i,e,o){"undefined"==typeof e&&(e=.5);var s=r(3,t,n,i,e);"undefined"==typeof o&&(o=l.dist(n,s.C));var u=o*(1-e)/e,a=l.dist(t,i),f=(i.x-t.x)/a,c=(i.y-t.y)/a,h=o*f,x=o*c,y=u*f,v=u*c,d={x:n.x-h,y:n.y-x},m={x:n.x+y,y:n.y+v},g=s.A,z={x:g.x+(d.x-g.x)/(1-e),y:g.y+(d.y-g.y)/(1-e)},b={x:g.x+(m.x-g.x)/e,y:g.y+(m.y-g.y)/e},_={x:t.x+(z.x-t.x)/e,y:t.y+(z.y-t.y)/e},w={x:i.x+(b.x-i.x)/(1-e),y:i.y+(b.y-i.y)/(1-e)};return new p(t,_,w,i)};var d=function(){return l};p.getUtils=d,p.PolyBezier=y,p.prototype={getUtils:d,valueOf:function(){return this.toString()},toString:function(){return l.pointsToString(this.points)},toSVG:function(t){if(this._3d)return !1;for(var r=this.points,n=r[0].x,i=r[0].y,e=["M",n,i,2===this.order?"Q":"C"],o=1,s=r.length;s>o;o++)e.push(r[o].x),e.push(r[o].y);return e.join(" ")},update:function(){this._lut=[],this.dpoints=l.derive(this.points,this._3d),this.computedirection();},computedirection:function(){var t=this.points,r=l.angle(t[0],t[this.order],t[1]);this.clockwise=r>0;},length:function(){return l.length(this.derivative.bind(this))},_lut:[],getLUT:function(t){if(t=t||100,this._lut.length===t)return this._lut;this._lut=[],t--;for(var r=0;t>=r;r++)this._lut.push(this.compute(r/t));return this._lut},on:function(t,r){r=r||5;for(var n,i=this.getLUT(),e=[],o=0,s=0;s<i.length;s++)n=i[s],l.dist(n,t)<r&&(e.push(n),o+=s/i.length);return e.length?o/=e.length:!1},project:function(t){var r=this.getLUT(),n=r.length-1,i=l.closest(r,t),e=i.mdist,o=i.mpos;if(0===o||o===n){var s=o/n,u=this.compute(s);return u.t=s,u.d=e,u}var a,s,f,c,h=(o-1)/n,x=(o+1)/n,y=.1/n;for(e+=1,s=h,a=s;x+y>s;s+=y)f=this.compute(s),c=l.dist(t,f),e>c&&(e=c,a=s);return f=this.compute(a),f.t=a,f.d=e,f},get:function(t){return this.compute(t)},point:function(t){return this.points[t]},compute:function(t){return l.compute(t,this.points,this._3d)},raise:function(){for(var t,r,n,i=this.points,e=[i[0]],o=i.length,t=1;o>t;t++)r=i[t],n=i[t-1],e[t]={x:(o-t)/o*r.x+t/o*n.x,y:(o-t)/o*r.y+t/o*n.y};return e[o]=i[o-1],new p(e)},derivative:function(t){var r,n,i=1-t,e=0,o=this.dpoints[0];2===this.order&&(o=[o[0],o[1],x],r=i,n=t),3===this.order&&(r=i*i,n=i*t*2,e=t*t);var s={x:r*o[0].x+n*o[1].x+e*o[2].x,y:r*o[0].y+n*o[1].y+e*o[2].y};return this._3d&&(s.z=r*o[0].z+n*o[1].z+e*o[2].z),s},curvature:function(t){return l.curvature(t,this.points,this._3d)},inflections:function(){return l.inflections(this.points)},normal:function(t){return this._3d?this.__normal3(t):this.__normal2(t)},__normal2:function(t){var r=this.derivative(t),n=c(r.x*r.x+r.y*r.y);return {x:-r.y/n,y:r.x/n}},__normal3:function(t){var r=this.derivative(t),n=this.derivative(t+.01),i=c(r.x*r.x+r.y*r.y+r.z*r.z),e=c(n.x*n.x+n.y*n.y+n.z*n.z);r.x/=i,r.y/=i,r.z/=i,n.x/=e,n.y/=e,n.z/=e;var o={x:n.y*r.z-n.z*r.y,y:n.z*r.x-n.x*r.z,z:n.x*r.y-n.y*r.x},s=c(o.x*o.x+o.y*o.y+o.z*o.z);o.x/=s,o.y/=s,o.z/=s;var u=[o.x*o.x,o.x*o.y-o.z,o.x*o.z+o.y,o.x*o.y+o.z,o.y*o.y,o.y*o.z-o.x,o.x*o.z-o.y,o.y*o.z+o.x,o.z*o.z],a={x:u[0]*r.x+u[1]*r.y+u[2]*r.z,y:u[3]*r.x+u[4]*r.y+u[5]*r.z,z:u[6]*r.x+u[7]*r.y+u[8]*r.z};return a},hull:function(t){var r,n=this.points,i=[],e=[],o=0,s=0,u=0;for(e[o++]=n[0],e[o++]=n[1],e[o++]=n[2],3===this.order&&(e[o++]=n[3]);n.length>1;){for(i=[],s=0,u=n.length-1;u>s;s++)r=l.lerp(t,n[s],n[s+1]),e[o++]=r,i.push(r);n=i;}return e},split:function(t,r){if(0===t&&r)return this.split(r).left;if(1===r)return this.split(t).right;var n=this.hull(t),i={left:new p(2===this.order?[n[0],n[3],n[5]]:[n[0],n[4],n[7],n[9]]),right:new p(2===this.order?[n[5],n[4],n[2]]:[n[9],n[8],n[6],n[3]]),span:n};if(i.left._t1=l.map(0,0,1,this._t1,this._t2),i.left._t2=l.map(t,0,1,this._t1,this._t2),i.right._t1=l.map(t,0,1,this._t1,this._t2),i.right._t2=l.map(1,0,1,this._t1,this._t2),!r)return i;r=l.map(r,t,1,0,1);var e=i.right.split(r);return e.left},extrema:function(){var t,r,n=this.dims,i={},e=[];return n.forEach(function(n){r=function(t){return t[n]},t=this.dpoints[0].map(r),i[n]=l.droots(t),3===this.order&&(t=this.dpoints[1].map(r),i[n]=i[n].concat(l.droots(t))),i[n]=i[n].filter(function(t){return t>=0&&1>=t}),e=e.concat(i[n].sort(l.numberSort));}.bind(this)),e=e.sort(l.numberSort).filter(function(t,r){return e.indexOf(t)===r}),i.values=e,i},bbox:function(){var t=this.extrema(),r={};return this.dims.forEach(function(n){r[n]=l.getminmax(this,n,t[n]);}.bind(this)),r},overlaps:function(t){var r=this.bbox(),n=t.bbox();return l.bboxoverlap(r,n)},offset:function(t,r){if("undefined"!=typeof r){var n=this.get(t),i=this.normal(t),e={c:n,n:i,x:n.x+i.x*r,y:n.y+i.y*r};return this._3d&&(e.z=n.z+i.z*r),e}if(this._linear){var o=this.normal(0),s=this.points.map(function(r){var n={x:r.x+t*o.x,y:r.y+t*o.y};return r.z&&i.z&&(n.z=r.z+t*o.z),n});return [new p(s)]}var u=this.reduce();return u.map(function(r){return r.scale(t)})},simple:function(){if(3===this.order){var t=l.angle(this.points[0],this.points[3],this.points[1]),r=l.angle(this.points[0],this.points[3],this.points[2]);if(t>0&&0>r||0>t&&r>0)return !1}var n=this.normal(0),i=this.normal(1),o=n.x*i.x+n.y*i.y;this._3d&&(o+=n.z*i.z);var s=e(f(o));return h/3>s},reduce:function(){var t,r,n=0,i=0,o=.01,s=[],u=[],a=this.extrema().values;for(-1===a.indexOf(0)&&(a=[0].concat(a)),-1===a.indexOf(1)&&a.push(1),n=a[0],t=1;t<a.length;t++)i=a[t],r=this.split(n,i),r._t1=n,r._t2=i,s.push(r),n=i;return s.forEach(function(t){for(n=0,i=0;1>=i;)for(i=n+o;1+o>=i;i+=o)if(r=t.split(n,i),!r.simple()){if(i-=o,e(n-i)<o)return [];r=t.split(n,i),r._t1=l.map(n,0,1,t._t1,t._t2),r._t2=l.map(i,0,1,t._t1,t._t2),u.push(r),n=i;break}1>n&&(r=t.split(n,1),r._t1=l.map(n,0,1,t._t1,t._t2),r._t2=t._t2,u.push(r));}),u},scale:function(t){var r=this.order,n=!1;if("function"==typeof t&&(n=t),n&&2===r)return this.raise().scale(n);var i=this.clockwise,e=n?n(0):t,o=n?n(1):t,s=[this.offset(0,10),this.offset(1,10)],u=l.lli4(s[0],s[0].c,s[1],s[1].c);if(!u)throw new Error("cannot scale this curve. Try reducing it first.");var a=this.points,f=[];return [0,1].forEach(function(t){var n=f[t*r]=l.copy(a[t*r]);n.x+=(t?o:e)*s[t].n.x,n.y+=(t?o:e)*s[t].n.y;}.bind(this)),n?([0,1].forEach(function(e){if(2!==this.order||!e){var o=a[e+1],s={x:o.x-u.x,y:o.y-u.y},h=n?n((e+1)/r):t;n&&!i&&(h=-h);var x=c(s.x*s.x+s.y*s.y);s.x/=x,s.y/=x,f[e+1]={x:o.x+h*s.x,y:o.y+h*s.y};}}.bind(this)),new p(f)):([0,1].forEach(function(t){if(2!==this.order||!t){var n=f[t*r],i=this.derivative(t),e={x:n.x+i.x,y:n.y+i.y};f[t+1]=l.lli4(n,e,u,a[t+1]);}}.bind(this)),new p(f))},outline:function(t,r,n,i){function e(t,r,n,i,e){return function(o){var s=i/n,u=(i+e)/n,a=r-t;return l.map(o,0,1,t+s*a,t+u*a)}}r="undefined"==typeof r?t:r;var o,s=this.reduce(),u=s.length,a=[],f=[],c=0,h=this.length(),x="undefined"!=typeof n&&"undefined"!=typeof i;s.forEach(function(o){_=o.length(),x?(a.push(o.scale(e(t,n,h,c,_))),f.push(o.scale(e(-r,-i,h,c,_)))):(a.push(o.scale(t)),f.push(o.scale(-r))),c+=_;}),f=f.map(function(t){return o=t.points,o[3]?t.points=[o[3],o[2],o[1],o[0]]:t.points=[o[2],o[1],o[0]],t}).reverse();var p=a[0].points[0],v=a[u-1].points[a[u-1].points.length-1],d=f[u-1].points[f[u-1].points.length-1],m=f[0].points[0],g=l.makeline(d,p),z=l.makeline(v,m),b=[g].concat(a).concat([z]).concat(f),_=b.length;return new y(b)},outlineshapes:function(t,r,n){r=r||t;for(var i=this.outline(t,r).curves,e=[],o=1,s=i.length;s/2>o;o++){var u=l.makeshape(i[o],i[s-o],n);u.startcap.virtual=o>1,u.endcap.virtual=s/2-1>o,e.push(u);}return e},intersects:function(t,r){return t?t.p1&&t.p2?this.lineIntersects(t):(t instanceof p&&(t=t.reduce()),this.curveintersects(this.reduce(),t,r)):this.selfintersects(r)},lineIntersects:function(t){var r=o(t.p1.x,t.p2.x),n=o(t.p1.y,t.p2.y),i=s(t.p1.x,t.p2.x),e=s(t.p1.y,t.p2.y),u=this;return l.roots(this.points,t).filter(function(t){var o=u.get(t);return l.between(o.x,r,i)&&l.between(o.y,n,e)})},selfintersects:function(t){var r,n,i,e,o=this.reduce(),s=o.length-2,u=[];for(r=0;s>r;r++)i=o.slice(r,r+1),e=o.slice(r+2),n=this.curveintersects(i,e,t),u=u.concat(n);return u},curveintersects:function(t,r,n){var i=[];t.forEach(function(t){r.forEach(function(r){t.overlaps(r)&&i.push({left:t,right:r});});});var e=[];return i.forEach(function(t){var r=l.pairiteration(t.left,t.right,n);r.length>0&&(e=e.concat(r));}),e},arcs:function(t){t=t||.5;var r=[];return this._iterate(t,r)},_error:function(t,r,n,i){var o=(i-n)/4,s=this.get(n+o),u=this.get(i-o),a=l.dist(t,r),f=l.dist(t,s),c=l.dist(t,u);return e(f-a)+e(c-a)},_iterate:function(t,r){var n,i=0,e=1;do{n=0,e=1;var o,s,f,c,h,x=this.get(i),y=!1,p=!1,v=e,d=1;do{p=y,c=f,v=(i+e)/2,o=this.get(v),s=this.get(e),f=l.getccenter(x,o,s),f.interval={start:i,end:e};var g=this._error(f,x,i,e);if(y=t>=g,h=p&&!y,h||(d=e),y){if(e>=1){if(f.interval.end=d=1,c=f,e>1){var z={x:f.x+f.r*u(f.e),y:f.y+f.r*a(f.e)};f.e+=l.angle({x:f.x,y:f.y},z,this.get(1));}break}e+=(e-i)/2;}else e=v;}while(!h&&n++<100);if(n>=100)break;c=c?c:f,r.push(c),i=d;}while(1>e);return r}},t.exports=p;}();},function(t,r,n){!function(){var r=Math.abs,i=Math.cos,e=Math.sin,o=Math.acos,s=Math.atan2,u=Math.sqrt,a=Math.pow,f=function(t){return 0>t?-a(-t,1/3):a(t,1/3)},c=Math.PI,h=2*c,x=c/2,l=1e-6,y=Number.MAX_SAFE_INTEGER||9007199254740991,p=Number.MIN_SAFE_INTEGER||-9007199254740991,v={x:0,y:0,z:0},d={Tvalues:[-.06405689286260563,.06405689286260563,-.1911188674736163,.1911188674736163,-.3150426796961634,.3150426796961634,-.4337935076260451,.4337935076260451,-.5454214713888396,.5454214713888396,-.6480936519369755,.6480936519369755,-.7401241915785544,.7401241915785544,-.820001985973903,.820001985973903,-.8864155270044011,.8864155270044011,-.9382745520027328,.9382745520027328,-.9747285559713095,.9747285559713095,-.9951872199970213,.9951872199970213],Cvalues:[.12793819534675216,.12793819534675216,.1258374563468283,.1258374563468283,.12167047292780339,.12167047292780339,.1155056680537256,.1155056680537256,.10744427011596563,.10744427011596563,.09761865210411388,.09761865210411388,.08619016153195327,.08619016153195327,.0733464814110803,.0733464814110803,.05929858491543678,.05929858491543678,.04427743881741981,.04427743881741981,.028531388628933663,.028531388628933663,.0123412297999872,.0123412297999872],arcfn:function(t,r){var n=r(t),i=n.x*n.x+n.y*n.y;return "undefined"!=typeof n.z&&(i+=n.z*n.z),u(i)},compute:function(t,r,n){if(0===t)return r[0];var i=r.length-1;if(1===t)return r[i];var e=r,o=1-t;if(0===i)return r[0];if(1===i)return x={x:o*e[0].x+t*e[1].x,y:o*e[0].y+t*e[1].y},n&&(x.z=o*e[0].z+t*e[1].z),x;if(4>i){var s,u,a,f=o*o,c=t*t,h=0;2===i?(e=[e[0],e[1],e[2],v],s=f,u=o*t*2,a=c):3===i&&(s=f*o,u=f*t*3,a=o*c*3,h=t*c);var x={x:s*e[0].x+u*e[1].x+a*e[2].x+h*e[3].x,y:s*e[0].y+u*e[1].y+a*e[2].y+h*e[3].y};return n&&(x.z=s*e[0].z+u*e[1].z+a*e[2].z+h*e[3].z),x}for(var l=JSON.parse(JSON.stringify(r));l.length>1;){for(var y=0;y<l.length-1;y++)l[y]={x:l[y].x+(l[y+1].x-l[y].x)*t,y:l[y].y+(l[y+1].y-l[y].y)*t},"undefined"!=typeof l[y].z&&(l[y]=l[y].z+(l[y+1].z-l[y].z)*t);l.splice(l.length-1,1);}return l[0]},derive:function(t,r){for(var n=[],i=t,e=i.length,o=e-1;e>1;e--,o--){for(var s,u=[],a=0;o>a;a++)s={x:o*(i[a+1].x-i[a].x),y:o*(i[a+1].y-i[a].y)},r&&(s.z=o*(i[a+1].z-i[a].z)),u.push(s);n.push(u),i=u;}return n},between:function(t,r,n){return t>=r&&n>=t||d.approximately(t,r)||d.approximately(t,n)},approximately:function(t,n,i){return r(t-n)<=(i||l)},length:function(t){var r,n,i=.5,e=0,o=d.Tvalues.length;for(r=0;o>r;r++)n=i*d.Tvalues[r]+i,e+=d.Cvalues[r]*d.arcfn(n,t);return i*e},map:function(t,r,n,i,e){var o=n-r,s=e-i,u=t-r,a=u/o;return i+s*a},lerp:function(t,r,n){var i={x:r.x+t*(n.x-r.x),y:r.y+t*(n.y-r.y)};return r.z&&n.z&&(i.z=r.z+t*(n.z-r.z)),i},pointToString:function(t){var r=t.x+"/"+t.y;return "undefined"!=typeof t.z&&(r+="/"+t.z),r},pointsToString:function(t){return "["+t.map(d.pointToString).join(", ")+"]"},copy:function(t){return JSON.parse(JSON.stringify(t))},angle:function(t,r,n){var i=r.x-t.x,e=r.y-t.y,o=n.x-t.x,u=n.y-t.y,a=i*u-e*o,f=i*o+e*u;return s(a,f)},round:function(t,r){var n=""+t,i=n.indexOf(".");return parseFloat(n.substring(0,i+1+r))},dist:function(t,r){var n=t.x-r.x,i=t.y-r.y;return u(n*n+i*i)},closest:function(t,r){var n,i,e=a(2,63);return t.forEach(function(t,o){i=d.dist(r,t),e>i&&(e=i,n=o);}),{mdist:e,mpos:n}},abcratio:function(t,n){if(2!==n&&3!==n)return !1;if("undefined"==typeof t)t=.5;else if(0===t||1===t)return t;var i=a(t,n)+a(1-t,n),e=i-1;return r(e/i)},projectionratio:function(t,r){if(2!==r&&3!==r)return !1;if("undefined"==typeof t)t=.5;else if(0===t||1===t)return t;var n=a(1-t,r),i=a(t,r)+n;return n/i},lli8:function(t,r,n,i,e,o,s,u){var a=(t*i-r*n)*(e-s)-(t-n)*(e*u-o*s),f=(t*i-r*n)*(o-u)-(r-i)*(e*u-o*s),c=(t-n)*(o-u)-(r-i)*(e-s);return 0==c?!1:{x:a/c,y:f/c}},lli4:function(t,r,n,i){var e=t.x,o=t.y,s=r.x,u=r.y,a=n.x,f=n.y,c=i.x,h=i.y;return d.lli8(e,o,s,u,a,f,c,h)},lli:function(t,r){return d.lli4(t,t.c,r,r.c)},makeline:function(t,r){var i=n(1),e=t.x,o=t.y,s=r.x,u=r.y,a=(s-e)/3,f=(u-o)/3;return new i(e,o,e+a,o+f,e+2*a,o+2*f,s,u)},findbbox:function(t){var r=y,n=y,i=p,e=p;return t.forEach(function(t){var o=t.bbox();r>o.x.min&&(r=o.x.min),n>o.y.min&&(n=o.y.min),i<o.x.max&&(i=o.x.max),e<o.y.max&&(e=o.y.max);}),{x:{min:r,mid:(r+i)/2,max:i,size:i-r},y:{min:n,mid:(n+e)/2,max:e,size:e-n}}},shapeintersections:function(t,r,n,i,e){if(!d.bboxoverlap(r,i))return [];var o=[],s=[t.startcap,t.forward,t.back,t.endcap],u=[n.startcap,n.forward,n.back,n.endcap];return s.forEach(function(r){r.virtual||u.forEach(function(i){if(!i.virtual){var s=r.intersects(i,e);s.length>0&&(s.c1=r,s.c2=i,s.s1=t,s.s2=n,o.push(s));}});}),o},makeshape:function(t,r,n){var i=r.points.length,e=t.points.length,o=d.makeline(r.points[i-1],t.points[0]),s=d.makeline(t.points[e-1],r.points[0]),u={startcap:o,forward:t,back:r,endcap:s,bbox:d.findbbox([o,t,r,s])},a=d;return u.intersections=function(t){return a.shapeintersections(u,u.bbox,t,t.bbox,n)},u},getminmax:function(t,r,n){if(!n)return {min:0,max:0};var i,e,o=y,s=p;-1===n.indexOf(0)&&(n=[0].concat(n)),-1===n.indexOf(1)&&n.push(1);for(var u=0,a=n.length;a>u;u++)i=n[u],e=t.get(i),e[r]<o&&(o=e[r]),e[r]>s&&(s=e[r]);return {min:o,mid:(o+s)/2,max:s,size:s-o}},align:function(t,r){var n=r.p1.x,o=r.p1.y,u=-s(r.p2.y-o,r.p2.x-n),a=function(t){return {x:(t.x-n)*i(u)-(t.y-o)*e(u),y:(t.x-n)*e(u)+(t.y-o)*i(u)}};return t.map(a)},roots:function(t,r){r=r||{p1:{x:0,y:0},p2:{x:1,y:0}};var n=t.length-1,e=d.align(t,r),s=function(t){return t>=0&&1>=t};if(2===n){var a=e[0].y,c=e[1].y,x=e[2].y,l=a-2*c+x;if(0!==l){var y=-u(c*c-a*x),p=-a+c,v=-(y+p)/l,m=-(-y+p)/l;return [v,m].filter(s)}return c!==x&&0===l?[(2*c-x)/(2*c-2*x)].filter(s):[]}var g=e[0].y,z=e[1].y,b=e[2].y,_=e[3].y,l=-g+3*z-3*b+_,a=3*g-6*z+3*b,c=-3*g+3*z,x=g;if(d.approximately(l,0)){if(d.approximately(a,0))return d.approximately(c,0)?[]:[-x/c].filter(s);var w=u(c*c-4*a*x),E=2*a;return [(w-c)/E,(-c-w)/E].filter(s)}a/=l,c/=l,x/=l;var M,v,S,k,j,e=(3*c-a*a)/3,O=e/3,w=(2*a*a*a-9*a*c+27*x)/27,T=w/2,C=T*T+O*O*O;if(0>C){var L=-e/3,N=L*L*L,A=u(N),B=-w/(2*A),F=-1>B?-1:B>1?1:B,I=o(F),q=f(A),P=2*q;return S=P*i(I/3)-a/3,k=P*i((I+h)/3)-a/3,j=P*i((I+2*h)/3)-a/3,[S,k,j].filter(s)}if(0===C)return M=0>T?f(-T):-f(T),S=2*M-a/3,k=-M-a/3,[S,k].filter(s);var Q=u(C);return M=f(-T+Q),v=f(T+Q),[M-v-a/3].filter(s)},droots:function(t){if(3===t.length){var r=t[0],n=t[1],i=t[2],e=r-2*n+i;if(0!==e){var o=-u(n*n-r*i),s=-r+n,a=-(o+s)/e,f=-(-o+s)/e;return [a,f]}return n!==i&&0===e?[(2*n-i)/(2*(n-i))]:[]}if(2===t.length){var r=t[0],n=t[1];return r!==n?[r/(r-n)]:[]}},curvature:function(t,r,n){var i,e,o=d.derive(r),s=o[0],f=o[1],c=d.compute(t,s),h=d.compute(t,f);return n?(i=u(a(c.y*h.z-h.y*c.z,2)+a(c.z*h.x-h.z*c.x,2)+a(c.x*h.y-h.x*c.y,2)),e=a(c.x*c.x+c.y*c.y+c.z*c.z,2/3)):(i=c.x*h.y-c.y*h.x,e=a(c.x*c.x+c.y*c.y,2/3)),0===i||0===e?{k:0,r:0}:{k:i/e,r:e/i}},inflections:function(t){if(t.length<4)return [];var r=d.align(t,{p1:t[0],p2:t.slice(-1)[0]}),n=r[2].x*r[1].y,i=r[3].x*r[1].y,e=r[1].x*r[2].y,o=r[3].x*r[2].y,s=18*(-3*n+2*i+3*e-o),u=18*(3*n-i-3*e),a=18*(e-n);if(d.approximately(s,0)){if(!d.approximately(u,0)){var f=-a/u;if(f>=0&&1>=f)return [f]}return []}var c=u*u-4*s*a,h=Math.sqrt(c),o=2*s;return d.approximately(o,0)?[]:[(h-u)/o,-(u+h)/o].filter(function(t){return t>=0&&1>=t})},bboxoverlap:function(t,n){var i,e,o,s,u,a=["x","y"],f=a.length;for(i=0;f>i;i++)if(e=a[i],o=t[e].mid,s=n[e].mid,u=(t[e].size+n[e].size)/2,r(o-s)>=u)return !1;return !0},expandbox:function(t,r){r.x.min<t.x.min&&(t.x.min=r.x.min),r.y.min<t.y.min&&(t.y.min=r.y.min),r.z&&r.z.min<t.z.min&&(t.z.min=r.z.min),r.x.max>t.x.max&&(t.x.max=r.x.max),r.y.max>t.y.max&&(t.y.max=r.y.max),r.z&&r.z.max>t.z.max&&(t.z.max=r.z.max),t.x.mid=(t.x.min+t.x.max)/2,t.y.mid=(t.y.min+t.y.max)/2,t.z&&(t.z.mid=(t.z.min+t.z.max)/2),t.x.size=t.x.max-t.x.min,t.y.size=t.y.max-t.y.min,t.z&&(t.z.size=t.z.max-t.z.min);},pairiteration:function(t,r,n){var i=t.bbox(),e=r.bbox(),o=1e5,s=n||.5;if(i.x.size+i.y.size<s&&e.x.size+e.y.size<s)return [(o*(t._t1+t._t2)/2|0)/o+"/"+(o*(r._t1+r._t2)/2|0)/o];var u=t.split(.5),a=r.split(.5),f=[{left:u.left,right:a.left},{left:u.left,right:a.right},{left:u.right,right:a.right},{left:u.right,right:a.left}];f=f.filter(function(t){return d.bboxoverlap(t.left.bbox(),t.right.bbox())});var c=[];return 0===f.length?c:(f.forEach(function(t){c=c.concat(d.pairiteration(t.left,t.right,s));}),c=c.filter(function(t,r){return c.indexOf(t)===r}))},getccenter:function(t,r,n){var o,u=r.x-t.x,a=r.y-t.y,f=n.x-r.x,c=n.y-r.y,l=u*i(x)-a*e(x),y=u*e(x)+a*i(x),p=f*i(x)-c*e(x),v=f*e(x)+c*i(x),m=(t.x+r.x)/2,g=(t.y+r.y)/2,z=(r.x+n.x)/2,b=(r.y+n.y)/2,_=m+l,w=g+y,E=z+p,M=b+v,S=d.lli8(m,g,_,w,z,b,E,M),k=d.dist(S,t),j=s(t.y-S.y,t.x-S.x),O=s(r.y-S.y,r.x-S.x),T=s(n.y-S.y,n.x-S.x);return T>j?((j>O||O>T)&&(j+=h),j>T&&(o=T,T=j,j=o)):O>T&&j>O?(o=T,T=j,j=o):T+=h,S.s=j,S.e=T,S.r=k,S},numberSort:function(t,r){return t-r}};t.exports=d;}();},function(t,r,n){!function(){var r=n(2),i=function(t){this.curves=[],this._3d=!1,t&&(this.curves=t,this._3d=this.curves[0]._3d);};i.prototype={valueOf:function(){return this.toString()},toString:function(){return "["+this.curves.map(function(t){return r.pointsToString(t.points)}).join(", ")+"]"},addCurve:function(t){this.curves.push(t),this._3d=this._3d||t._3d;},length:function(){return this.curves.map(function(t){return t.length()}).reduce(function(t,r){return t+r})},curve:function(t){return this.curves[t]},bbox:function e(){for(var t=this.curves,e=t[0].bbox(),n=1;n<t.length;n++)r.expandbox(e,t[n].bbox());return e},offset:function o(t){var o=[];return this.curves.forEach(function(r){o=o.concat(r.offset(t));}),new i(o)}},t.exports=i;}();},function(t,r,n){function i(t,r,n){if("Z"!==r){if("M"===r)return void(s={x:n[0],y:n[1]});var i=[!1,s.x,s.y].concat(n),e=t.bind.apply(t,i),o=new e,u=n.slice(-2);return s={x:u[0],y:u[1]},o}}function e(t,r){for(var n,e,s,u=o(r).split(" "),a=new RegExp("[MLCQZ]",""),f=[],c={C:6,Q:4,L:2,M:2};u.length;)n=u.splice(0,1)[0],a.test(n)&&(s=u.splice(0,c[n]).map(parseFloat),e=i(t,n,s),e&&f.push(e));return new t.PolyBezier(f)}var o=n(5),s={x:!1,y:!1};t.exports=e;},function(t,r){function n(t){t=t.replace(/,/g," ").replace(/-/g," - ").replace(/-\s+/g,"-").replace(/([a-zA-Z])/g," $1 ");var r,n,i,e,o,s,u=t.replace(/([a-zA-Z])\s?/g,"|$1").split("|"),a=u.length,f=[],c=0,h=0,x=0,l=0,y=0,p=0,v=0,d=0,m="";for(r=1;a>r;r++)if(n=u[r],i=n.substring(0,1),e=i.toLowerCase(),f=n.replace(i,"").trim().split(" "),f=f.filter(function(t){return ""!==t}).map(parseFloat),o=f.length,"m"===e){if(m+="M ","m"===i?(x+=f[0],l+=f[1]):(x=f[0],l=f[1]),c=x,h=l,m+=x+" "+l+" ",o>2)for(s=0;o>s;s+=2)"m"===i?(x+=f[s],l+=f[s+1]):(x=f[s],l=f[s+1]),m+=["L",x,l,""].join(" ");}else if("l"===e)for(s=0;o>s;s+=2)"l"===i?(x+=f[s],l+=f[s+1]):(x=f[s],l=f[s+1]),m+=["L",x,l,""].join(" ");else if("h"===e)for(s=0;o>s;s++)"h"===i?x+=f[s]:x=f[s],m+=["L",x,l,""].join(" ");else if("v"===e)for(s=0;o>s;s++)"v"===i?l+=f[s]:l=f[s],m+=["L",x,l,""].join(" ");else if("q"===e)for(s=0;o>s;s+=4)"q"===i?(y=x+f[s],p=l+f[s+1],x+=f[s+2],l+=f[s+3]):(y=f[s],p=f[s+1],x=f[s+2],l=f[s+3]),m+=["Q",y,p,x,l,""].join(" ");else if("t"===e)for(s=0;o>s;s+=2)y=x+(x-y),p=l+(l-p),"t"===i?(x+=f[s],l+=f[s+1]):(x=f[s],l=f[s+1]),m+=["Q",y,p,x,l,""].join(" ");else if("c"===e)for(s=0;o>s;s+=6)"c"===i?(y=x+f[s],p=l+f[s+1],v=x+f[s+2],d=l+f[s+3],x+=f[s+4],l+=f[s+5]):(y=f[s],p=f[s+1],v=f[s+2],d=f[s+3],x=f[s+4],l=f[s+5]),m+=["C",y,p,v,d,x,l,""].join(" ");else if("s"===e)for(s=0;o>s;s+=4)y=x+(x-v),p=l+(l-d),"s"===i?(v=x+f[s],d=l+f[s+1],x+=f[s+2],l+=f[s+3]):(v=f[s],d=f[s+1],x=f[s+2],l=f[s+3]),m+=["C",y,p,v,d,x,l,""].join(" ");else"z"===e&&(m+="Z ",x=c,l=h);return m.trim()}t.exports=n;}]);

  const Curve = {
    create(anchor1, anchor2, handle1, handle2) {
      return Object.create(Curve).init(anchor1, anchor2, handle1, handle2);
    },

    createFromSegments(segment1, segment2) {
      return Curve.create(
        segment1.anchor,
        segment2.anchor,
        segment1.handleOut,
        segment2.handleIn
      );
    },

    init(anchor1, anchor2, handle1, handle2) {
      this.anchor1 = anchor1;
      this.anchor2 = anchor2;
      this.handle1 = handle1;
      this.handle2 = handle2;

      return this;
    },

    points() {
      return [this.anchor1, this.anchor2, this.handle1, this.handle2]
        .filter((point) => {
          return (point !== undefined);
        });
    },

    coords() {
      return this.points().map(point => point.coords());
    },

    isLine() {
      return (this.handle1 === undefined) && (this.handle2 === undefined);
    },

    isQuadratic() {
      return (this.handle1 !== undefined) && (this.handle2 === undefined);
    },

    isCubic() {
      return (this.handle1 !== undefined) && (this.handle2 !== undefined);
    },

    bBox() {
      if (this.isLine()) {
        const minX = Math.min(this.anchor1.x, this.anchor2.x);
        const minY = Math.min(this.anchor1.y, this.anchor2.y);
        const maxX = Math.max(this.anchor1.x, this.anchor2.x);
        const maxY = Math.max(this.anchor1.y, this.anchor2.y);
        const min  = Vector.create(minX, minY);
        const max  = Vector.create(maxX, maxY);

        console.log(Rectangle.createFromMinMax(min, max));

        return Rectangle.createFromMinMax(min, max);
      }

      const box = new Bezier(...this.coords()).bbox();
      const min = Vector.create(box.x.min, box.y.min);
      const max = Vector.create(box.x.max, box.y.max);

      return Rectangle.createFromMinMax(min, max);
    },
  };

  const Spline = {
    create(segments = []) {
      return Object.create(Spline).init(segments);
    },

    init(segments) {
      this.segments = segments;

      return this;
    },

    createFromCommands(commands) {
      const segments = this.parseCommands(commands);
      return Spline.create(segments);
    },

    parseCommands(commands) {
      const segments = [];

      // the first command is ALWAYS an `M` command (no handles)
      segments[0] = Segment.create({
        anchor: Vector.create(commands[0].x, commands[0].y)
      });

      for (let i = 1; i < commands.length; i += 1) {
        const command  = commands[i];
        const prevSeg  = segments[i - 1];
        const currSeg  = Segment.create();
        currSeg.anchor = Vector.create(command.x, command.y);

        if (command.x1 && command.x2) {
          prevSeg.handleOut = Vector.create(command.x1, command.y1);
          currSeg.handleIn  = Vector.create(command.x2, command.y2);
        } else if (command.x1) {
          currSeg.handleIn  = Vector.create(command.x1, command.y1);
        }

        segments[i] = currSeg;
      }

      return segments;
    },

    curves() {
      const theCurves = [];

      for (let i = 0; i < this.segments.length - 1; i += 1) {
        const start = this.segments[i];
        const end = this.segments[i + 1];

        theCurves.push(Curve.createFromSegments(start, end));
      }

      return theCurves;
    },

    bBox() {
      const curves  = this.curves();
      let splineBox = curves[0].bBox();

      for (let i = 1; i < curves.length; i += 1) {
        const curveBox = curves[i].bBox();
        splineBox = Rectangle.getBoundingRect(splineBox, curveBox);
      }

      console.log(splineBox);
      return splineBox;
    },

    toJSON() {
      return this.segments; // array
    },
  };

  const MOVE = 2; // constant used by svg-pathdata module

  const Path = {
    createFromRect(x, y, width, height) {
      const commands = this.commands(`
      M ${x} ${y}
      H ${x + width}
      V ${y + height}
      H ${x}
      Z
    `);

      return this.create(commands);
    },

    createFromSVGpath(d) {
      return this.create(this.commands(d));
    },

    // TODO: we should not only construct paths from svg path data, but also from
    //       splines

    create(commands) {
      return Object.create(Path).init(commands);
    },

    init(commands) {
      this.splines = [];
      const sequences = [];

      for (let command of commands) {
        if (command.type === MOVE) {
          sequences.push([command]);
        } else {
          sequences[sequences.length - 1].push(command);
        }
      }

      for (let sequence of sequences) {
        this.splines.push(Spline.createFromCommands(sequence));
      }

      return this;
    },

    commands(svgPath) {
      return new SVGPathData$1(svgPath)
        .transform(SVGPathDataTransformer.NORMALIZE_HVZ()) // no H, V or Z shortcuts
        .transform(SVGPathDataTransformer.NORMALIZE_ST())  // no S (smooth multi-Bezier)
        .transform(SVGPathDataTransformer.A_TO_C())        // no A (arcs)
        .toAbs()                                           // no relative commands
        .commands;
    },

    bBox() {
      const splines = this.splines;
      let pathBox   = splines[0].bBox();

      for (let i = 1; i < this.splines.length; i += 1) {
        const splineBox = this.splines[i].bBox();
        pathBox = Rectangle.getBoundingRect(pathBox, splineBox);
      }
      return pathBox;
    },

    toJSON() {
      return this.splines; // array
    },
  };

  // TODO: put in a utility module somewhere?
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

  const builder = {
    importSVG(markup) {
      const $svg = new DOMParser()
        .parseFromString(markup, "application/xml")
        .documentElement;

      return this.buildScene($svg);
    },

    buildScene($svg) {
      const scene = Node.create();

      this.copyStyles($svg, scene);
      this.copyDefs($svg, scene);
      this.buildTree($svg, scene);
      scene.computeBBox();
      scene.setFrontier();

      return scene;
    },

    copyStyles($node, node) {
      node.styles = Array.from($node.querySelectorAll('style'));
    },

    copyDefs($node, node) {
      node.defs = Array.from($node.querySelectorAll('style'));
    },

    buildTree($node, node) {
      // TODO: the logic here is that we $node may be the svg root, a group
      // or a shape. If it's a shape, we tag our internal node as path because
      // we want to store pathData derived from the svg.
      if ($node.tagName === 'svg' || $node.tagName === 'g') {
        this.copyTagName($node, node);
      } else {
        node.tag = 'path';
      }

      this.processAttributes($node, node);
      // this.copyBBox($node, node);

      const $graphicsChildren = Array.from($node.children).filter((child) => {
        return child instanceof SVGGElement || child instanceof SVGGeometryElement
      });

      for (let $child of $graphicsChildren) {
        const child = Node.create();
        node.append(child);
        this.buildTree($child, child);
      }
    },

    copyTagName($node, node) {
      node.tag = $node.tagName;
    },

    // copyBBox($node, node) {
    //   const box    = $node.getBBox();
    //   const origin = Vector.create(box.x, box.y);
    //   const size   = Vector.create(box.width, box.height);
    //   node.box     = Rectangle.create(origin, size);
    // },

    processAttributes($node, node) {
      const $attributes = Array.from($node.attributes);
      for (let $attribute of $attributes) {
        node.props[$attribute.name] = $attribute.value;
      }
      delete node.props.xmlns;

      // TODO: hard to read?
      // idea: $node might already have a transform applied.
      // in this case, we override our default Matrix.identity():
      if (
        $node.transform &&
        $node.transform.baseVal &&
        $node.transform.baseVal.consolidate()
      ) {
        const $matrix = $node.transform.baseVal.consolidate().matrix;
        node.transform = Matrix.createFromDOMMatrix($matrix);
      }

      node.classList = ClassList.create(
        Array.from($node.classList)
      );

      // TODO: hard to read
      // what it means is that we have tagged our internal node as 'path'
      // because we want to create a path from whatever svg shape $node is
      if (node.tag === 'path') {
        this.storePath($node, node);
      }
    },

    // store whatever shape $node is as a path
    storePath($node, node) {
      const tag = $node.tagName;

      switch (tag) {
        case 'rect':
          node.path = Path.createFromRect(
            Number($node.getSVGAttr('x')),
            Number($node.getSVGAttr('y')),
            Number($node.getSVGAttr('width')),
            Number($node.getSVGAttr('height'))
          );

          for (let prop of ['x', 'y', 'width', 'height']) {
            delete node.props[prop];
          }
          break;

        case 'path':
          node.path = Path.createFromSVGpath($node.getSVGAttr('d'));
          delete node.props.d;
          break;
      }
    },
  };

  const core = {
    get stateData() {
      return JSON.parse(JSON.stringify(this.state));
    },

    sync() {
      const keys = Object.keys(this.periphery);
      for (let key of keys) {
        this.periphery[key](JSON.parse(JSON.stringify(this.state)));
      }
    },

    // TODO: not functional right now (this method is injected into "log")
    // (API has also changed quite a bit)
    setState(stateData) {
      this.state = stateData;
      this.state.doc = doc.init(stateData.doc);
      this.state.clock = clock.init(stateData.clock.time);
      this.periphery['ui'] &&
        this.periphery['ui'](JSON.parse(JSON.stringify(this.state)));
      // ^ only UI is synced
      // ^ TODO: call sync here, and make that method more flexible
    },

    compute(input) {
      const transition = config.get(this.state, input);
      // console.log('from: ', this.state.id, input, transition); // DEBUG
      if (transition) {
        this.makeTransition(input, transition);
        this.sync();
      }
    },

    makeTransition(input, transition) {
      this.state.clock.tick();
      this.state.currentInput = input.type;
      this.state.id = transition.to;

      const action = actions[transition.do];
      action && action.bind(actions)(this.state, input);
    },

    // note that `markup` is currently hard-coded
    init() {
      this.state = {
        clock: clock.init(),
        id: 'start',
        scene: builder.importSVG(markup),
        docs: { ids: [], selectedID: null },
      };

      this.periphery = [];
      return this;
    },

    kickoff() {
      this.sync();
      this.compute({ type: 'kickoff' });
    },
  };


  const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260.73 100.17"><defs><style>.cls-1{fill:#2a2a2a;}</style></defs><title>Logo_48_Web_160601</title>

    <path class="cls-1" d="M69.74,14H35.82S37,54.54,10.37,76.65v7.27H51.27V97.55s-1.51,7.27-12.42,7.27v6.06H87.31v-6.66S74.59,106,74.59,98.46V83.91h13v-7h-13V34.4L51.21,55.31V77H17.34S65.5,32.43,69.74,14" transform="translate(-10.37 -12.38)"/>

    <path class="cls-1" d="M142,39.59q0-14.42-3.23-20.89a6.56,6.56,0,0,0-6.32-3.82q-9.71,0-9.71,21.77t10.74,21.62a6.73,6.73,0,0,0,6.62-4.12Q142,50,142,39.59m3.83,49.13q0-15.59-2.87-21.92t-10.08-6.32a10.21,10.21,0,0,0-9.78,5.88q-3,5.88-3,19.12,0,12.94,3.46,18.75T134.63,110q6,0,8.61-4.93t2.58-16.4m24-4.41q0,10.59-8.53,18.39-10.74,9.86-27.51,9.86-16.19,0-26.77-7.65T96.38,85.49q0-13.83,10.88-20.45,5.15-3.09,14.56-5.59l-0.15-.74q-20.89-5.3-20.89-21.77a21.6,21.6,0,0,1,8.68-17.65q8.68-6.91,22.21-6.91,14.56,0,23.39,6.77a21.35,21.35,0,0,1,8.83,17.8q0,15-19,21.92v0.59q24.86,5.44,24.86,24.86" transform="translate(-10.37 -12.38)"/>

    <g>
      <path class="cls-1" d="M185.85,53.73V34.82c0-4.55-1.88-6.9-9.41-8.47V20.7L203.67,14h5.49V53.73H185.85Z" transform="translate(-10.37 -12.38)"/>

      <path class="cls-1" d="M232,55.82c0-1.73-.63-2.2-8-2v-6.9h38v6.9c-11.26.45-11.9,1.84-20.68,9.37L236,67.73l18,22.91c8.63,10.83,11,13.71,17.1,14.34v5.9H227.57a37.69,37.69,0,0,1,0-5.9,5,5,0,0,0,5-3.78L218.23,83.54s-8.77,6.94-9.18,12.28c-0.57,7.27,5.19,9.16,11,9.16v5.9H176.69V105S232,56.76,232,55.82Z" transform="translate(-10.37 -12.38)"/>
    </g>
  </svg>
`;

  // const markup = `
  //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  //
  //     <g>
  //       <rect x="260" y="250" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
  //
  //       <g>
  //         <rect x="400" y="260" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
  //         <rect x="550" y="260" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
  //       </g>
  //     </g>
  //
  //     <rect x="600" y="600" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
  //   </svg>
  // `;

  // const markup = `
  //   <svg id="a3dbc277-3d4c-49ea-bad0-b2ae645587b1" data-name="Ebene 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  //     <defs>
  //       <style>
  //         .b6f794bd-c28e-4c2b-862b-87d53a963a38 {
  //           fill: #1d1d1b;
  //           stroke: #1d1d1b;
  //           stroke-miterlimit: 3.86;
  //           stroke-width: 1.35px;
  //         }
  //       </style>
  //     </defs>
  //     <title>Little Bus</title>
  //     <path class="b6f794bd-c28e-4c2b-862b-87d53a963a38" d="M355.24,70.65l-77.31.66L93.69,179l-3.32,40.31L49.4,249l-4.64,62.08s.39,8.81,10.6,3.3C64,309.78,60,302.49,60,302.49l54.13,11.92s11.82,29.72,27.06,5.31l138.06-88.48s4.64,15.8,17.23,9.18,7.95-27.73,7.95-27.73l46.17-36.34ZM65.32,288.3A7.62,7.62,0,1,1,73,280.68,7.62,7.62,0,0,1,65.32,288.3Zm63.05,11.64a7.62,7.62,0,1,1,7.61-7.62A7.62,7.62,0,0,1,128.37,299.94Zm49.81-65.48L102.29,220l1.33-33.69,78.54,8Zm21.87,37-2-78.55L215.85,181l3.31,79.3Zm29.71-52.8-2-39.66,27.06-16.46,2.65,40.22Zm36.34-25.75-2.65-36.33,22.42-15.9,3.32,35Zm29.71-21.86-2-37.66,21.11-15.8,1.32,37.66Zm47.6-33.68L323.54,150l-.66-37L344.07,99.7Z"/>
  //   </svg>
  // `;

  // const markup = `
  //   <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 405"><g fill="#ff0000" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M50.5869,148.3516c-0.2308,-43.67734 -0.2308,-43.67734 -24.7598,-54.57743c-24.529,-10.90009 -24.529,-10.90009 -24.529,55.34c0,66.2401 0,66.2401 24.7598,54.57743c24.7598,-11.66267 24.7598,-11.66267 24.529,-55.34z"/><path d="M21.62818,330.71352c-20.56368,-15.09293 -20.56368,-15.09293 -20.56368,28.5276c0,43.62053 0,43.62053 19.55435,43.62053c19.55435,0 19.55435,0 20.56368,-28.5276c1.00933,-28.5276 1.00933,-28.5276 -19.55435,-43.62053z"/><path d="M107.96977,0.50937c0.73005,-0.48695 0.73005,-0.48695 -1.01175,-0.48695c-1.7418,0 -1.7418,0 -0.73005,0.48695c1.01175,0.48695 1.01175,0.48695 1.7418,0z"/><path d="M74.97452,87.43121c23.24606,-12.27663 23.24606,-12.27663 26.41619,-48.12571c3.17013,-35.84908 1.14663,-36.82298 -48.78682,-36.82298c-49.93345,0 -49.93345,0 -49.93345,37.71256c0,37.71256 0,37.71256 24.529,48.61266c24.529,10.90009 24.529,10.90009 47.77507,-1.37653z"/><path d="M79.76578,203.77243c24.86172,11.77861 24.86172,11.77861 49.61865,3.24961c24.75693,-8.529 24.75693,-8.529 29.23518,-52.52805c4.47825,-43.99905 4.47825,-43.99905 -26.60339,-59.20358c-31.08164,-15.20453 -31.08164,-15.20453 -54.3277,-2.9279c-23.24606,12.27663 -23.24606,12.27663 -23.01526,55.95397c0.2308,43.67734 0.2308,43.67734 25.09252,55.45595z"/><path d="M70.59973,326.80235c26.89466,-14.35367 26.89466,-14.35367 29.05785,-59.7788c2.16319,-45.42513 2.16319,-45.42513 -22.69853,-57.20374c-24.86172,-11.77861 -24.86172,-11.77861 -49.62152,-0.11595c-24.7598,11.66267 -24.7598,11.66267 -24.7598,56.46448c0,44.80181 0,44.80181 20.56368,59.89474c20.56368,15.09293 20.56368,15.09293 47.45834,0.73926z"/><path d="M129.84987,328.44011c-29.97881,-11.37576 -29.97881,-11.37576 -56.87347,2.97791c-26.89466,14.35367 -26.89466,14.35367 -27.90399,42.88126c-1.00933,28.5276 -1.00933,28.5276 34.40359,28.5276c35.41292,0 35.41292,0 57.88279,-31.5055c22.46988,-31.5055 22.46988,-31.5055 -7.50893,-42.88126z"/><path d="M187.06059,96.11957c21.47119,-9.59579 21.47119,-9.59579 22.49175,-51.54056c1.02056,-41.94477 1.02056,-41.94477 -48.65265,-41.94477c-49.67321,0 -51.13331,0.9739 -54.30344,36.82298c-3.17013,35.84908 -3.17013,35.84908 27.91151,51.05361c31.08164,15.20453 31.08164,15.20453 52.55283,5.60874z"/><path d="M245.34605,206.18022c33.14602,-20.86668 33.14602,-20.86668 30.2472,-54.58075c-2.89882,-33.71407 -2.89882,-33.71407 -33.43397,-46.74428c-30.53515,-13.03021 -30.53515,-13.03021 -52.00634,-3.43443c-21.47119,9.59579 -21.47119,9.59579 -25.94945,53.59483c-4.47825,43.99905 -4.47825,43.99905 21.75914,58.01517c26.23739,14.01613 26.23739,14.01613 59.38342,-6.85056z"/><path d="M195.80525,326.19818c21.96942,-10.19253 21.96942,-10.19253 17.69765,-51.84721c-4.27177,-41.65468 -4.27177,-41.65468 -30.50916,-55.67081c-26.23739,-14.01613 -26.23739,-14.01613 -50.99432,-5.48713c-24.75693,8.529 -24.75693,8.529 -26.92012,53.95413c-2.16319,45.42513 -2.16319,45.42513 27.81562,56.80089c29.97881,11.37576 40.9409,12.44265 62.91033,2.25012z"/><path d="M227.51873,402.9056c49.30296,0 49.30296,0 45.96844,-29.33069c-3.33452,-29.33069 -3.33452,-29.33069 -27.86991,-41.16459c-24.53539,-11.83389 -24.53539,-11.83389 -46.50481,-1.64137c-21.96942,10.19253 -21.96942,10.19253 -21.43305,41.16459c0.53637,30.97206 0.53637,30.97206 49.83933,30.97206z"/><path d="M339.22874,3.60137c9.5027,-3.44282 9.5027,-3.44282 -4.69103,-3.44282c-14.19373,0 -14.19373,0 -9.5027,3.44282c4.69103,3.44282 4.69103,3.44282 14.19373,0z"/><path d="M297.32885,95.81776c22.09241,-16.92833 22.09241,-16.92833 25.64882,-51.53216c3.5564,-34.60384 -5.82566,-41.48947 -56.29804,-41.48947c-50.47238,0 -50.47238,0 -51.49294,41.94477c-1.02056,41.94477 -1.02056,41.94477 29.51459,54.97498c30.53515,13.03021 30.53515,13.03021 52.62756,-3.89812z"/><path d="M315.52969,202.76801c31.17916,17.74268 31.17916,17.74268 49.30204,10.55348c18.12288,-7.18921 18.12288,-7.18921 24.75761,-50.72443c6.63474,-43.53522 6.63474,-43.53522 -30.10845,-61.19587c-36.74318,-17.66065 -36.74318,-17.66065 -58.8356,-0.73232c-22.09241,16.92833 -22.09241,16.92833 -19.19359,50.64239c2.89882,33.71407 2.89882,33.71407 34.07798,51.45675z"/><path d="M248.25403,327.5441c24.53539,11.83389 24.53539,11.83389 51.87383,-2.72394c27.33844,-14.55783 27.33844,-14.55783 35.51803,-56.61257c8.17959,-42.05474 8.17959,-42.05474 -22.99957,-59.79743c-31.17916,-17.74268 -31.17916,-17.74268 -64.32519,3.124c-33.14602,20.86668 -33.14602,20.86668 -28.87425,62.52137c4.27177,41.65468 4.27177,41.65468 28.80716,53.48857z"/><path d="M334.71096,402.7916c52.47028,0 52.47028,0 55.59477,-27.50337c3.1245,-27.50337 3.1245,-27.50337 -28.46636,-43.88853c-31.59085,-16.38516 -31.59085,-16.38516 -58.9293,-1.82732c-27.33844,14.55783 -27.33844,14.55783 -24.00392,43.88853c3.33452,29.33069 3.33452,29.33069 55.8048,29.33069z"/><path d="M437.28803,1.64447c2.69179,-1.57207 2.69179,-1.57207 -3.64826,-1.57207c-6.34004,0 -6.34004,0 -2.69179,1.57207c3.64826,1.57207 3.64826,1.57207 6.34004,0z"/><path d="M423.47215,101.0203c24.76808,-13.22625 24.76808,-13.22625 16.75607,-54.13524c-8.01201,-40.90899 -15.30852,-44.05313 -52.10041,-44.05313c-36.79189,0 -36.79189,0 -46.29459,3.44282c-9.5027,3.44282 -9.5027,3.44282 -13.05911,38.04665c-3.5564,34.60384 -3.5564,34.60384 33.18678,52.26449c36.74318,17.66065 36.74318,17.66065 61.51126,4.43441z"/><path d="M473.2864,212.58868c30.39492,-14.89085 30.39492,-14.89085 33.55771,-54.98674c3.16279,-40.09589 3.16279,-40.09589 -26.12633,-52.36114c-29.28911,-12.26525 -29.28911,-12.26525 -54.05719,0.961c-24.76808,13.22625 -24.76808,13.22625 -31.40281,56.76146c-6.63474,43.53522 -6.63474,43.53522 20.49948,54.02574c27.13422,10.49052 27.13422,10.49052 57.52914,-4.40033z"/><path d="M423.24411,333.73001c26.92878,-9.8882 26.92878,-9.8882 21.84583,-55.13858c-5.08295,-45.25039 -5.08295,-45.25039 -32.21717,-55.74091c-27.13422,-10.49052 -27.13422,-10.49052 -45.25709,-3.30131c-18.12288,7.18921 -18.12288,7.18921 -26.30247,49.24395c-8.17959,42.05474 -8.17959,42.05474 23.41126,58.4399c31.59085,16.38516 31.59085,16.38516 58.51964,6.49696z"/><path d="M475.05699,339.05927c-22.21507,-10.7426 -22.21507,-10.7426 -49.14385,-0.85441c-26.92878,9.8882 -26.92878,9.8882 -30.05328,37.39157c-3.1245,27.50337 -3.1245,27.50337 47.87861,27.50337c51.00311,0 51.00311,0 52.26835,-26.64896c1.26524,-26.64896 1.26524,-26.64896 -20.94983,-37.39157z"/><path d="M482.61699,100.04921c29.28911,12.26525 29.28911,12.26525 42.03328,5.31362c12.74416,-6.95163 12.74416,-6.95163 12.74416,-54.74631c0,-47.79468 0,-47.79468 -47.3535,-47.79468c-47.3535,0 -52.73707,3.14414 -44.72506,44.05313c8.01201,40.90899 8.01201,40.90899 37.30112,53.17424z"/><path d="M539.2026,162.82026c0,-59.13683 0,-59.13683 -12.74416,-52.18521c-12.74416,6.95163 -12.74416,6.95163 -15.90695,47.04752c-3.16279,40.09589 -3.16279,40.09589 12.74416,52.18521c15.90695,12.08932 15.90695,12.08932 15.90695,-47.04752z"/><path d="M477.40768,334.44837c22.21507,10.7426 22.21507,10.7426 41.21892,2.089c19.00385,-8.6536 19.00385,-8.6536 19.00385,-58.79452c0,-50.14092 0,-50.14092 -15.90695,-62.23023c-15.90695,-12.08932 -15.90695,-12.08932 -46.30187,2.80153c-30.39492,14.89085 -30.39492,14.89085 -25.31197,60.14123c5.08295,45.25039 5.08295,45.25039 27.29802,55.99299z"/><path d="M499.68158,376.59488c-1.26524,26.64896 -1.26524,26.64896 19.00385,26.64896c20.26909,0 20.26909,0 20.26909,-35.30257c0,-35.30257 0,-35.30257 -19.00385,-26.64896c-19.00385,8.6536 -19.00385,8.6536 -20.26909,35.30257z"/><path d="M167.79565,340.87524c-5.48105,-0.53344 -5.48105,-0.53344 -27.95093,30.97206c-22.46988,31.5055 -22.46988,31.5055 6.01742,31.5055c28.4873,0 28.4873,0 27.95093,-30.97206c-0.53637,-30.97206 -0.53637,-30.97206 -6.01742,-31.5055z"/></g></svg>
  // `;


  // import { Curve }   from './domain/curve.js';
  // import { Vector }  from './domain/vector.js';
  //
  // const anchor1 = Vector.create(10, 20);
  // const anchor2 = Vector.create(50, 30);
  // const handle1 = Vector.create(7, 30);
  // const points = [anchor1, anchor2, handle1];
  //
  // const curve = Curve.create(...points);
  // console.log(curve.bBox()); // fine

  // log is more like a 'history', so the name 'log' is quite confusing

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

  const nodeFactory = {
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

  const svgns = 'http://www.w3.org/2000/svg';
  const xmlns = 'http://www.w3.org/2000/xmlns/';

  const LENGTHS_IN_PX = {
    cornerSideLength: 8,
    dotDiameter:      9,
    controlDiameter:  6,
  };

  const scale = (node, length) => {
    return length / (node.globalScale * sceneRenderer.documentScale);
  };

  const sceneRenderer = {
    render(scene, $canvas) {
      canvas.innerHTML = '';
      this.build(scene, $canvas);
    },

    build(node, $parent) {
      const $node = document.createElementNS(svgns, node.tag);

      if (node.path) {
        node.props.d = encodeSVGPath(node.path);
      }

      $node.setSVGAttrs(node.props);
      $node.setSVGAttr('data-id', node._id);

      if (node.tag === 'svg') {
        $node.setAttributeNS(xmlns, 'xmlns', svgns);
        $node.setAttributeNS(svgns, 'data-type', 'root');
        $parent.appendChild($node);
        const viewBoxWidth = Number(node.props.viewBox.split(' ')[2]);
        this.documentScale = this.canvasWidth / viewBoxWidth;
      } else {
        const $wrapper = wrap($node, node);
        $parent.appendChild($wrapper);
      }

      for (let child of node.children) {
        sceneRenderer.build(child, $node);
      }
    },

    get canvasWidth() {
      const canvasNode = document.querySelector('#canvas');
      return canvasNode.clientWidth;
    },
  };

  const encodeSVGPath = (path) => {
    let d = '';

    for (let spline of path) {
      const moveto = spline[0];
      d += `M ${moveto.anchor.x} ${moveto.anchor.y}`;

      for (let i = 1; i < spline.length; i += 1) {
        const curr = spline[i];
        const prev = spline[i - 1];

        if (prev.handleOut && curr.handleIn) {
          d += ' C';
        } else if (curr.handleIn) { // TODO: correct?
          d += ' Q';
        } else {
          d += ' L';
        }

        if (prev.handleOut) {
          d += ` ${prev.handleOut.x} ${prev.handleOut.y}`;
        }

        if (curr.handleIn) {
          d += ` ${curr.handleIn.x} ${curr.handleIn.y}`;
        }

        d += ` ${curr.anchor.x} ${curr.anchor.y}`;
      }
    }

    return d;
  };

  const wrap = ($node, node) => {
    $node.setSVGAttrs({
      'data-type': 'content',
    });

    const $wrapper = wrapper(node);
    const $outerUI = outerUI(node);

    $wrapper.appendChild($node);

    if (node.path) {
      const $innerUI = innerUI(node);
      $wrapper.appendChild($innerUI);
    }

    $wrapper.appendChild($outerUI);

    return $wrapper;
  };

  const wrapper = (node) => {
    const $wrapper = document.createElementNS(svgns, 'g');

    $wrapper.setSVGAttrs({
      'data-type': 'wrapper',
      'data-id':   node._id,
    });

    return $wrapper;
  };

  const outerUI = (node) => {
    const $outerUI = document.createElementNS(svgns, 'g');

    $outerUI.setSVGAttrs({
      'data-type': 'outerUI',
      'data-id': node._id,
    });

    const $frame   = frame(node);
    const $corners = corners(node);
    const $dots    = dots(node);

    $outerUI.appendChild($frame);
    for (let corner of $corners) {
      $outerUI.appendChild(corner);
    }
    for (let dot of $dots) {
      $outerUI.appendChild(dot);
    }

    return $outerUI;
  };

  const corners = (node) => {
    const $topLCorner = document.createElementNS(svgns, 'rect');
    const $botLCorner = document.createElementNS(svgns, 'rect');
    const $topRCorner = document.createElementNS(svgns, 'rect');
    const $botRCorner = document.createElementNS(svgns, 'rect');
    const $corners    = [$topLCorner, $botLCorner, $topRCorner, $botRCorner];
    const length      = scale(node, LENGTHS_IN_PX.cornerSideLength);

    for (let corner of $corners) {
      corner.setSVGAttrs({
        'data-type': 'corner',
        'data-id':   node._id,
        transform:   node.props.transform,
        width:       length,
        height:      length,
      });
    }

    $topLCorner.setSVGAttrs({
      x: node.box.x - length / 2,
      y: node.box.y - length / 2,
    });

    $botLCorner.setSVGAttrs({
      x: node.box.x - length / 2,
      y: node.box.y + node.box.height - length / 2,
    });

    $topRCorner.setSVGAttrs({
      x: node.box.x + node.box.width - length / 2,
      y: node.box.y - length / 2,
    });

    $botRCorner.setSVGAttrs({
      x: node.box.x + node.box.width - length / 2,
      y: node.box.y + node.box.height - length / 2,
    });

    return $corners;
  };

  const dots = (node) => {
    const $topLDot  = document.createElementNS(svgns, 'circle');
    const $botLDot  = document.createElementNS(svgns, 'circle');
    const $topRDot  = document.createElementNS(svgns, 'circle');
    const $botRDot  = document.createElementNS(svgns, 'circle');
    const $dots     = [$topLDot, $botLDot, $topRDot, $botRDot];
    const diameter  = scale(node, LENGTHS_IN_PX.dotDiameter);

    for (let $dot of $dots) {
      $dot.setSVGAttrs({
        'data-type':      'dot',
        'data-id':        node._id,
        transform:        node.props.transform,
        r:                diameter / 2,
      });
    }

    $topLDot.setSVGAttrs({
      cx: node.box.x - diameter,
      cy: node.box.y - diameter,
    });

    $botLDot.setSVGAttrs({
      cx: node.box.x - diameter,
      cy: node.box.y + node.box.height + diameter,
    });

    $topRDot.setSVGAttrs({
      cx: node.box.x + node.box.width + diameter,
      cy: node.box.y - diameter,
    });

    $botRDot.setSVGAttrs({
      cx: node.box.x + node.box.width + diameter,
      cy: node.box.y + node.box.height + diameter,
    });

    return $dots;
  };

  const frame = (node) => {
    const $frame = document.createElementNS(svgns, 'rect');

    $frame.setSVGAttrs({
      'data-type':  'frame',
      x:            node.box.x,
      y:            node.box.y,
      width:        node.box.width,
      height:       node.box.height,
      transform:    node.props.transform,
      'data-id':    node._id,
    });

    return $frame;
  };

  const innerUI = (node) => {
    const $innerUI = document.createElementNS(svgns, 'g');

    $innerUI.setSVGAttrs({
      'data-type': 'innerUI',
      'data-id':   node._id,
    });

    const $controls = controls(node);

    for (let $control of $controls) {
      $innerUI.appendChild($control);
    }

    return $innerUI;
  };

  const controls = (node) => {
    const $controls = [];
    const diameter  = scale(node, LENGTHS_IN_PX.controlDiameter);

    for (let spline of node.path) {
      for (let segment of spline) {

        $controls.push(control(node, diameter, segment.anchor.x, segment.anchor.y));

        if (segment.handleIn) {
          $controls.push(control(node, diameter, segment.handleIn.x, segment.handleIn.y));
        }

        if (segment.handleOut) {
          $controls.push(control(node, diameter, segment.handleOut.x, segment.handleOut.y));
        }
      }
    }

    return $controls;
  };

  const control = (node, diameter, x, y) => {
    const $control = document.createElementNS(svgns, 'circle');

    $control.setSVGAttrs({
      'data-type': 'control',
      'data-id':   control._id,
      transform:   node.props.transform,
      r:           diameter / 2,
      cx:          x,
      cy:          y,
    });

    return $control;
  };

  const getSVGCoords = (x, y) => {
    const svg = document.querySelector('svg');
    let point = svg.createSVGPoint();
    point.x   = x;
    point.y   = y;
    point     = point.matrixTransform(svg.getScreenCTM().inverse());

    return [point.x, point.y];
  };

  const ui = {
    bindEvents(compute) {
      this.canvasNode = document.querySelector('#canvas');

      const pointerData = (event) => {
        const [x, y] = getSVGCoords(event.clientX, event.clientY);

        return {
          x:        x,
          y:        y,
          targetID: event.target.dataset.id,
        };
      };

      const eventTypes = [
        'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick'
      ];

      // TODO: improve presentation
      const suppressedRepetition = [
        'mousedown', 'mouseup', 'click'
      ];

      for (let eventType of eventTypes) {
        ui.canvasNode.addEventListener(eventType, (event) => {
          event.preventDefault();

          console.log(event.target.dataset.type);

          if (suppressedRepetition.includes(event.type) && event.detail > 1) {
            return;
          }

          compute({
            type:    event.type,
            target:  event.target.dataset.type,
            pointer: pointerData(event),
          });
        });
      }
    },

    // check what has changed (TODO: this is cumbersome!)
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

      this.previousState = state; // logs the state - we can use that when making an input
    },

    // map changed state keys to method calls
    render: {
      scene(state) {
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

    // methods performing sync actions in the ui
    renderScene(state) {
      sceneRenderer.render(state.scene, ui.canvasNode);
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
    bindEvents(compute) {
      window.addEventListener('upsert', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          compute({
            type: 'docSaved',
            data: {},
          });
        });

        request.open('POST', "/docs/" + event.detail._id);
        request.send(JSON.stringify(event.detail));
      });

      window.addEventListener('read', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          compute({
            type: 'setDoc',
            data: {
              doc: request.response
            },
          });
        });

        request.open('GET', "/docs/" + event.detail);
        request.responseType = 'json';
        request.send(JSON.stringify(event.detail));
      });

      window.addEventListener('loadDocIDs', function(event) {
        const request = new XMLHttpRequest;

        request.addEventListener('load', function() {
          compute({
            type: 'updateDocList',
            data: {
              docIDs: request.response
            },
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
        component.bindEvents(core.compute.bind(core));
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
