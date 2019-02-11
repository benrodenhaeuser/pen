const transitionTable = [
  // kickoff
  [{ from: 'start',     input: 'kickoff'        }, { to: 'idle'              }],

  // NEW
  [{ from: 'idle',      input: 'select'         }, { to: 'idle'              }],
  [{ from: 'idle',      input: 'deselect'       }, { to: 'idle'              }],
  [{ from: 'idle',      input: 'selectThrough'  }, { to: 'idle'              }],
  [{ from: 'idle',      input: 'movePointer'    }, { to: 'idle', do: 'focus' }],

  // OLD

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

export { transitionTable };
