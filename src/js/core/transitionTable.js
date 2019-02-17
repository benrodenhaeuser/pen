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

  // OLD

  // create and delete (part of this might still be relevant)
  [{ from: 'idle',      input: 'createShape'    }, {                         }],
  [{ from: 'idle',      input: 'createDoc'      }, {                         }],
  [{ from: 'idle',      input: 'deleteFrame'    }, {                         }],
  [{                    input: 'docSaved'       }, {                         }],
  [{                    input: 'updateDocList'  }, {                         }],
  [{                    input: 'requestDoc'     }, { to: 'busy'              }],
  [{ from: 'busy',      input: 'setDoc'         }, { to: 'idle'              }],

  // animate (part of this might still be relevant)
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
