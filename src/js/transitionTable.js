const transitionTable = [
  [{                    input: 'docSaved'       }, {                     }],
  [{                    input: 'updateDocList'  }, {                     }],
  [{ from: 'start',     input: 'kickoff'        }, { to: 'idle'          }],
  [{ from: 'idle',      input: 'createShape'    }, {                     }],
  [{ from: 'idle',      input: 'createDoc'      }, {                     }],
  [{ from: 'idle',      input: 'startAnimation' }, { to: 'animating'     }],
  [{ from: 'idle',      input: 'getFrameOrigin' }, { to: 'dragging'      }],
  [{ from: 'idle',      input: 'resizeFrame'    }, { to: 'resizing'      }],
  [{ from: 'idle',      input: 'setFrameOrigin' }, { to: 'drawing'       }],
  [{ from: 'idle',      input: 'deleteFrame'    }, {                     }],
  [{ from: 'idle',      input: 'requestDoc'     }, { to: 'blocked'       }],
  [{ from: 'drawing',   input: 'changeCoords'   }, { action: 'sizeFrame' }],
  [{ from: 'dragging',  input: 'changeCoords'   }, { action: 'moveFrame' }],
  [{ from: 'resizing',  input: 'changeCoords'   }, { action: 'sizeFrame' }],
  [{ from: 'drawing',   input: 'releaseFrame'   }, { to: 'idle', action: 'cleanup' }],
  [{ from: 'dragging',  input: 'releaseFrame'   }, { to: 'idle'          }],
  [{ from: 'resizing',  input: 'releaseFrame'   }, { to: 'idle'          }],
  [{ from: 'animating', input: 'startAnimation' }, {                     }],
  [{ from: 'animating', input: 'toIdle'         }, { to: 'idle'          }],
  [{ from: 'animating', input: 'createDoc'      }, { to: 'idle'          }],
  [{ from: 'animating', input: 'createShape'    }, { to: 'idle'          }],
  [{ from: 'blocked',   input: 'setDoc'         }, { to: 'idle'          }],
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
