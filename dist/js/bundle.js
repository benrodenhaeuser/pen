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

  // TODO: put in a utility module somewhere
  const createID = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);
    return randomString + timestamp;
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

  const Vector = {
    create(x, y) {
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

    transform(matrix) {
      const column      = Matrix.create([[this.x], [this.y], [1]]);
      const transformed = matrix.multiply(column).toArray();

      return Vector.create(transformed[0][0], transformed[1][0]);
    },

    add(other) {
      return Vector.create(this.x + other.x, this.y + other.y);
    },

    subtract(other) {
      return Vector.create(this.x - other.x, this.y - other.y);
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

  const createID$1 = () => {
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
        _id:         createID$1(),
        children:    [],
        parent:      null,
        tag:         null,
        box:         { x: 0, y: 0, width: 0, height: 0 },
        path:        null,
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

    get corners() {
      return [
        Vector.create(this.box.x, this.box.y),
        Vector.create(this.box.x + this.box.width, this.box.y),
        Vector.create(this.box.x, this.box.y + this.box.height),
        Vector.create(this.box.x + this.box.width, this.box.y + this.box.height)
      ]
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

    updateBox() {
      const childrenCorners = [];

      for (let child of this.children) {
        for (let corner of child.corners) {
          childrenCorners.push(corner.transform(child.transform));
        }
      }

      if (childrenCorners.length === 0) {
        return;
      }

      const xValue  = vector => vector.x;
      const xValues = childrenCorners.map(xValue);
      const minX    = Math.min(...xValues);
      const maxX    = Math.max(...xValues);

      const yValue  = vector => vector.y;
      const yValues = childrenCorners.map(yValue);
      const minY    = Math.min(...yValues);
      const maxY    = Math.max(...yValues);

      this.box = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
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
    create(type, controls) {
      return Object.create(Segment).init(type, controls);
    },

    init(type, controls) {
      this.type = type;
      this.controls = controls;

      return this;
    },
  };

  const MOVE = 2;

  const Path = {
    create(pathData) {
      return Object.create(Path).init(pathData);
    },

    init(pathData) {
      const cleanCommands = this.getCleanCommands(pathData);

      this.data = [];
      let segment;

      for (let command of cleanCommands) {
        if (command.type === MOVE) {
          segment = Segment.create(
            'move',
            [Vector.createWithID(command.x, command.y)]
          );
        } else {
          const controls = [];

          if (command.x1) {
            controls.push(Vector.createWithID(command.x1, command.y1));
          }
          if (command.x2) {
            controls.push(Vector.createWithID(command.x2, command.y2));
          }
          controls.push(Vector.createWithID(command.x, command.y));

          segment = Segment.create(
            'draw',
            controls
          );
        }

        this.data.push(segment);
      }

      return this;
    },

    getCleanCommands(pathData) {
      let pathDataObject;
      if (typeof pathData === 'string') {
        pathDataObject = new SVGPathData$1(pathData);
      } else {
        pathDataObject = new SVGPathData$1(encodeSVGPath$$1(pathData));
      }

      pathDataObject
        .transform(SVGPathDataTransformer.NORMALIZE_HVZ()) // no H, V or Z
        .transform(SVGPathDataTransformer.NORMALIZE_ST())  // no S
        .transform(SVGPathDataTransformer.A_TO_C())        // no A
        .toAbs()                                           // no relative commands
        .transform(SVGPathDataTransformer.ROUND(10));      // TODO: just for debugging

      return pathDataObject.commands;
    },

    toJSON() {
      return this.data;
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

  const sceneBuilder = {
    createScene(markup) {
      const $svg = new DOMParser()
        .parseFromString(markup, "application/xml")
        .documentElement;
      const svg = Node.create();

      document.body.appendChild($svg);
      this.build($svg, svg);
      $svg.remove();

      return svg;
    },

    build($svg, svg) {
      this.copyStyles($svg, svg);
      this.copyDefs($svg, svg);
      this.buildTree($svg, svg);
      svg.setFrontier();
    },

    copyStyles($node, node) {
      node.styles = Array.from($node.querySelectorAll('style'));
    },

    copyDefs($node, node) {
      node.defs = Array.from($node.querySelectorAll('style'));
    },

    buildTree($node, node) {
      // TODO: we take into account nodes of type `svg`, `g` and `path` here
      // But there may be others! (e.g., clip paths)
      if ($node.tagName === 'svg' || $node.tagName === 'g') {
        this.copyTagName($node, node);
      } else {
        node.tag = 'path';
      }

      this.processAttributes($node, node);
      this.copyBBox($node, node);

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

    copyBBox($node, node) {
      const box = $node.getBBox();
      node.box = {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
    },

    processAttributes($node, node) {
      const $attributes = Array.from($node.attributes);
      for (let $attribute of $attributes) {
        node.props[$attribute.name] = $attribute.value;
      }
      delete node.props.xmlns;

      // $node might already have a transform applied.
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

      // if we have tagged the node as a path, we need to convert the shape to a path (might be a rect):
      if (node.tag === 'path') {
        this.setDAttribute($node, node);
      }
    },

    // TODO: assuming $node is a rectangle or a path for now
    // add and process 'circle' and other basic shapes here
    setDAttribute($node, node) {
      const tag = $node.tagName;
      let   pathData;

      if (tag === 'rect') {
        const x      = Number($node.getSVGAttr('x'));
        const y      = Number($node.getSVGAttr('y'));
        const width  = Number($node.getSVGAttr('width'));
        const height = Number($node.getSVGAttr('height'));

        delete node.props.x;
        delete node.props.y;
        delete node.props.width;
        delete node.props.height;

        const CLOSE  = 1;
        const MOVE   = 2;
        const HLINE  = 4;
        const VLINE  = 8;

        pathData = [
          { type: MOVE,  relative: false, x: x, y: y },
          { type: HLINE, relative: false, x: x + width },
          { type: VLINE, relative: false, y: y + height },
          { type: HLINE, relative: false, x: x },
          { type: CLOSE }
        ];
      } else if (tag === 'path') {
        pathData = $node.getSVGAttr('d');
      }

      node.path = Path.create(pathData);
    },
  };

  const createID$2 = () => {
    const randomString = Math.random().toString(36).substring(2);
    const timestamp    = (new Date()).getTime().toString(36);
    return randomString + timestamp;
  };

  const doc = {
    init(markup) {
      this._id   = createID$2();
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

  const actions = {
    select(state, input) {
      const toSelect = state.doc.scene
        .findDescendant((node) => {
          return node._id === input.pointer.targetID;
        })
        .findAncestor((node) => {
          return node.props.class.includes('frontier');
        });

      if (toSelect) {
        toSelect.select();
        this.initShift(state, input);
      } else {
        state.doc.scene.deselectAll();
      }
    },

    initShift(state, input) {
      aux.source = Vector.create(input.pointer.x, input.pointer.y);
    },

    shift(state, input) {
      const selected = state.doc.scene.selected;

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
      const selected = state.doc.scene.selected;
      aux.source     = Vector.create(input.pointer.x, input.pointer.y);
      const box      = selected.box;
      const center   = Vector.create(box.x + box.width/2, box.y + box.height/2);
      aux.center     = center.transform(selected.globalTransform());
    },

    rotate(state, input) {
      const selected          = state.doc.scene.selected;
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
      const selected = state.doc.scene.selected;
      aux.source     = Vector.create(input.pointer.x, input.pointer.y);
      const box      = selected.box;
      const center   = Vector.create(box.x + box.width/2, box.y + box.height/2);
      aux.center     = center.transform(selected.globalTransform());
    },

    scale(state, input) {
      const selected          = state.doc.scene.selected;
      const target            = Vector.create(input.pointer.x, input.pointer.y);
      const sourceMinusCenter = aux.source.subtract(aux.center);
      const targetMinusCenter = target.subtract(aux.center);

      const sourceDist = Math.sqrt(
        Math.pow(sourceMinusCenter.x, 2) +
        Math.pow(sourceMinusCenter.y, 2)
      );
      const targetDist = Math.sqrt(
        Math.pow(targetMinusCenter.x, 2) +
        Math.pow(targetMinusCenter.y, 2)
      );
      const factor     = targetDist / sourceDist;
      const scaling    = Matrix.scale(factor, aux.center);

      selected.transform = selected
        .ancestorTransform().invert()
        .multiply(scaling)
        .multiply(selected.globalTransform());

      aux.source = target;
    },

    release(state, input) {
      const selected = state.doc.scene.selected;

      for (let ancestor of selected.ancestors) {
        ancestor.updateBox();
      }

      aux = {};
    },

    selectThrough(state, input) {
      console.log('selecting through');

      const target = state.doc.scene.findDescendant((node) => {
        return node._id === input.pointer.targetID;
      });

      const selection = target.findAncestor((node) => {
        return node.parent && node.parent.props.class.includes('frontier');
      });

      if (selection) {
        selection.select();
        state.doc.scene.setFrontier();
        state.doc.scene.unfocusAll();
      }
    },

    focus(state, input) {
      state.doc.scene.unfocusAll(); // expensive but effective

      const target = state.doc.scene.findDescendant((node) => {
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
      state.doc.scene.deselectAll();
    },

    // OLD (partially useless?):

    createDoc(state, input) {
      state.doc.init();
      state.docs.ids.push(state.doc._id);
      state.docs.selectedID = state.doc._id;
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
    { from: 'idle', type: 'dblclick', target: 'wrapper', do: 'selectThrough' },
    { from: 'idle', type: 'mousedown', target: 'wrapper', do: 'select', to: 'shifting' },
    { from: 'idle', type: 'mousedown', target: 'root', do: 'deselect' },
    { from: 'shifting', type: 'mousemove', do: 'shift' },
    { from: 'shifting', type: 'mouseup', do: 'release', to: 'idle' },
    { from: 'idle', type: 'mousedown', target: 'dot', do: 'initRotate', to: 'rotating' },
    { from: 'rotating', type: 'mousemove', do: 'rotate' },
    { from: 'rotating', type: 'mouseup', do: 'release', to: 'idle' },
    { from: 'idle', type: 'mousedown', target: 'corner', do: 'initScale', to: 'scaling' },
    { from: 'scaling', type: 'mousemove', do: 'scale' },
    { from: 'scaling', type: 'mouseup', do: 'release', to: 'idle' },
    { from: 'idle', type: 'click', target: 'usePen', do: 'deselect', to: 'pen' },
    { from: 'pen', type: 'mousedown', do: 'initPen' },
    { type: 'click', target: 'doc-list-entry', do: 'requestDoc' },
    { type: 'docSaved' },
    { type: 'updateDocList', do: 'updateDocList' },
    { type: 'requestDoc', do: 'requestDoc', to: 'busy' },
    { from: 'busy', type: 'setDoc', do: 'setDoc', to: 'idle' },
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
      return {
        do: match.do,
        to: match.to || state.id,
      };
    }
  };

  const core = {
    get stateData() {
      return JSON.parse(JSON.stringify(this.state));
    },

    // TODO: This name is GOOD
    sync() {
      const keys = Object.keys(this.periphery);
      for (let key of keys) {
        this.periphery[key](JSON.parse(JSON.stringify(this.state)));
      }
    },

    // TODO: not functional right now
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
      console.log('from: ', this.state.id, input, transition);
      if (transition) {
        this.makeTransition(input, transition);
        this.sync();
      }
    },

    makeTransition(input, transition) {
      const action = actions[transition.do];
      action && action.bind(actions)(this.state, input);
      // ^ means it's fine if we don't find an action

      this.state.clock.tick();
      this.state.currentInput = input.type;
      this.state.id = transition.to;
    },

    init() {
      this.state = {
        clock: clock.init(),
        id: 'start',
        doc: doc.init(markup),
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

  // hard-coded svg:

  // const markup = `
  //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260.73 100.17"><defs><style>.cls-1{fill:#2a2a2a;}</style></defs><title>Logo_48_Web_160601</title>
  //
  //     <g id="four">
  //       <path class="cls-1" d="M69.74,14H35.82S37,54.54,10.37,76.65v7.27H51.27V97.55s-1.51,7.27-12.42,7.27v6.06H87.31v-6.66S74.59,106,74.59,98.46V83.91h13v-7h-13V34.4L51.21,55.31V77H17.34S65.5,32.43,69.74,14" transform="translate(-10.37 -12.38)"/>
  //       </g>
  //
  //     <g id="eight">
  //       <path class="cls-1" d="M142,39.59q0-14.42-3.23-20.89a6.56,6.56,0,0,0-6.32-3.82q-9.71,0-9.71,21.77t10.74,21.62a6.73,6.73,0,0,0,6.62-4.12Q142,50,142,39.59m3.83,49.13q0-15.59-2.87-21.92t-10.08-6.32a10.21,10.21,0,0,0-9.78,5.88q-3,5.88-3,19.12,0,12.94,3.46,18.75T134.63,110q6,0,8.61-4.93t2.58-16.4m24-4.41q0,10.59-8.53,18.39-10.74,9.86-27.51,9.86-16.19,0-26.77-7.65T96.38,85.49q0-13.83,10.88-20.45,5.15-3.09,14.56-5.59l-0.15-.74q-20.89-5.3-20.89-21.77a21.6,21.6,0,0,1,8.68-17.65q8.68-6.91,22.21-6.91,14.56,0,23.39,6.77a21.35,21.35,0,0,1,8.83,17.8q0,15-19,21.92v0.59q24.86,5.44,24.86,24.86" transform="translate(-10.37 -12.38)"/>
  //     </g>
  //
  //     <g id="k">
  //       <path class="cls-1" d="M185.85,53.73V34.82c0-4.55-1.88-6.9-9.41-8.47V20.7L203.67,14h5.49V53.73H185.85Z" transform="translate(-10.37 -12.38)"/>
  //
  //       <path class="cls-1" d="M232,55.82c0-1.73-.63-2.2-8-2v-6.9h38v6.9c-11.26.45-11.9,1.84-20.68,9.37L236,67.73l18,22.91c8.63,10.83,11,13.71,17.1,14.34v5.9H227.57a37.69,37.69,0,0,1,0-5.9,5,5,0,0,0,5-3.78L218.23,83.54s-8.77,6.94-9.18,12.28c-0.57,7.27,5.19,9.16,11,9.16v5.9H176.69V105S232,56.76,232,55.82Z" transform="translate(-10.37 -12.38)"/>
  //     </g>
  //   </svg>
  // `;


  // const markup = `
  //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  //     <path d="M400 400H500V500H400z"></path>
  //   </svg>
  // `;

  const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">

    <g>
      <g>
        <rect x="260" y="250" width="100" height="100"></rect>

        <g>
          <rect x="400" y="260" width="100" height="100"></rect>
          <rect x="550" y="260" width="100" height="100"></rect>
        </g>
      </g>
    </g>

    <rect x="600" y="600" width="100" height="100"></rect>
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

  // OLD

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

  const svgns = 'http://www.w3.org/2000/svg';
  const xmlns = 'http://www.w3.org/2000/xmlns/';

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

  // TODO: need to take care of style and defs
  const sceneRenderer = {
    render(scene, $canvas) {
      canvas.innerHTML = '';
      this.build(scene, $canvas);
    },

    build(node, $parent) {
      const $node = document.createElementNS(svgns, node.tag);

      if (node.path) {
        node.props.d = encodeAsSVGPath(node.path);
      }

      // TODO: we will also need node.path elsewhere

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

  const encodeAsSVGPath = (path) => {
    let d = '';

    for (let segment of path) {
      if (segment.type === 'move') {
        d += 'M ';
      } else if (segment.controls.length === 1) {
        d += 'L ';
      } else if (segment.controls.length === 2) {
        d += 'Q ';
      } else if (segment.controls.length === 3) {
        d += 'C ';
      }

      for (let control of segment.controls) {
        d += String(control.x) + ' ' + String(control.y) + ' ';
      }
    }

    return d;
  };

  const antiScale = (node, length) => {
    return length / (node.globalScale * sceneRenderer.documentScale);
  };

  const wrap = ($node, node) => {
    const $wrapper       = document.createElementNS(svgns, 'g');
    const $chrome        = document.createElementNS(svgns, 'g');
    const $frame         = document.createElementNS(svgns, 'rect');
    const topLCorner     = document.createElementNS(svgns, 'rect');
    const botLCorner     = document.createElementNS(svgns, 'rect');
    const topRCorner     = document.createElementNS(svgns, 'rect');
    const botRCorner     = document.createElementNS(svgns, 'rect');
    const topLDot        = document.createElementNS(svgns, 'circle');
    const botLDot        = document.createElementNS(svgns, 'circle');
    const topRDot        = document.createElementNS(svgns, 'circle');
    const botRDot        = document.createElementNS(svgns, 'circle');
    const corners        = [topLCorner, botLCorner, topRCorner, botRCorner];
    const dots           = [topLDot,    botLDot,    topRDot,    botRDot];
    const width          = node.box.width;
    const height         = node.box.height;
    const x              = node.box.x;
    const y              = node.box.y;
    const transform      = node.props.transform;
    const id             = node._id;
    const baseSideLength = 8;
    const baseDiameter   = 9;
    const sideLength     = antiScale(node, baseSideLength);
    const diameter       = antiScale(node, baseDiameter);
    const radius         = diameter / 2;

    $node.setSVGAttrs({
      'data-type': 'content',
    });

    $wrapper.setSVGAttrs({
      'data-type':      'wrapper',
      'data-id':        id,
    });

    $chrome.setSVGAttrs({
      'data-type': 'chrome',
      'data-id': id,
    });

    $frame.setSVGAttrs({
      'data-type':      'frame',
      x:                x,
      y:                y,
      width:            width,
      height:           height,
      transform:        transform,
      'data-id':        id,
    });

    for (let corner of corners) {
      corner.setSVGAttrs({
        'data-type':     'corner',
        'data-id':       id,
        transform:       transform,
        width:           sideLength,
        height:          sideLength,
      });
    }

    topLCorner.setSVGAttrs({
      x: x - sideLength / 2,
      y: y - sideLength / 2,
    });

    botLCorner.setSVGAttrs({
      x: x - sideLength / 2,
      y: y + height - sideLength / 2,
    });

    topRCorner.setSVGAttrs({
      x: x + width - sideLength / 2,
      y: y - sideLength / 2,
    });

    botRCorner.setSVGAttrs({
      x: x + width - sideLength / 2,
      y: y + height - sideLength / 2,
    });

    for (let dot of dots) {
      dot.setSVGAttrs({
        'data-type':      'dot',
        'data-id':        id,
        transform:        transform,
        r:                radius,
      });
    }

    topLDot.setSVGAttrs({
      cx: x - diameter,
      cy: y - diameter,
    });

    botLDot.setSVGAttrs({
      cx: x - diameter,
      cy: y + height + diameter,
    });

    topRDot.setSVGAttrs({
      cx: x + width + diameter,
      cy: y - diameter,
    });

    botRDot.setSVGAttrs({
      cx: x + width + diameter,
      cy: y + height + diameter,
    });

    $chrome.appendChild($frame);
    for (let corner of corners) {
      $chrome.appendChild(corner);
    }
    for (let dot of dots) {
      $chrome.appendChild(dot);
    }

    $wrapper.appendChild($node);
    $wrapper.appendChild($chrome);

    return $wrapper;
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

      for (let eventType of ['mousedown', 'mousemove', 'mouseup']) {
        this.canvasNode.addEventListener(eventType, (event) => {
          event.preventDefault();
          if (event.type === 'mousedown' && event.detail > 1) {
            return;
          }

          compute({
            type:    event.type,
            target:  event.target.dataset.type,
            pointer: pointerData(event),
          });
        });
      }

      document.addEventListener('click', (event) => {

        event.preventDefault();
        if (event.detail > 1) {
          return;
        }

        compute({
          type:    event.type,
          target:  event.target.dataset.type,
          pointer: pointerData(event),
        });
      });

      document.addEventListener('dblclick', (event) => {
        event.preventDefault();

        compute({
          type:    event.type,
          target:  event.target.dataset.type,
          pointer: pointerData(event),
        });
      });
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

    // methods doing changes
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
