import { Client } from 'boardgame.io/react';
import { Game } from 'boardgame.io/core';
import React from 'react';

const BOARD_WIDTH = 5;
const BOARD_HEIGHT = 9;

function XyIsValid(x, y) {
  // 2
  // 1 3
  // 0 2 4
  // 1 3
  // 0 2 4
  // 1 3
  // 0 2 4
  // 1 3
  // 2
  if (y % 2) {
    if (!(x % 2))
      return false;
    return true;
  } else if (y === 0 || y === BOARD_HEIGHT - 1) {
    if (x !== 2)
      return false;
    return true;
  } else {
    if (x % 2)
      return false;
    return true;
  }
}
function XyToKey(x, y) {
  return y * BOARD_WIDTH + x;
}

class HexBoardItem extends React.Component {
  render(children) {
    return children;
  }
}

class InvisibleHex extends HexBoardItem {
  render(children) {
    const invisibleCellStyle = {
      display: 'table-cell',
      border: 'none',
      width: '92px',
      height: '52px',
      visibility: 'hidden',
    };
    return super.render((
      <div style={invisibleCellStyle}>
        {children}
      </div>
    ));
  }
}

class VisibleHex extends HexBoardItem {
  onClick = () => {
  }

  onDrag = () => {
  }

  onMouseOver() {
  }

  onMouseOut() {
  }

  render(children) {
    const cellStyle = {
      display: 'table-cell',
      border: 'none',
      width: '92px',
      height: '52px',
    };
    const hexContainerStyle = {
      overflow: 'visible',
      height: '1px',
      width: '1px',
    };
    return super.render((
      <div style={cellStyle}
           onClick={this.onClick}
           onDrag={this.onDrag}
           onMouseOver={this.onMouseOver}
           onMouseOut={this.onMouseOut}>
        <div style={hexContainerStyle}>
          {children}
        </div>
      </div>
    ));
  }
}

class EmptyHex extends VisibleHex {
  render(children) {
    const emptyHexStyle = {
      width: '114px',
      height: '96px',
      clipPath: 'polygon(0% 50%, 25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%)',
    };
    return super.render((
      <div style={emptyHexStyle}>
        {children}
      </div>
    ));
  }
}

class FullHex extends VisibleHex {
  constructor(props) {
    super(props);
    this.state = {
      floating: false,
      rotation: 0,
      active: false,
    };
  }

  onDrag = () => {
    this.setState(state => ({
      rotation: (state.rotation + state.active * 60) % 360,
    }));
  }

  onClick = () => {
    this.setState(state => ({
      active: !state.active,
    }));
  }

  render(children) {
    const fullHex=require('resources/' + this.props.token + '.png');
    let fullHexStyle = {
      backgroundImage: `url(${fullHex})`,
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% 100%',
      width: '118px',
      height: '100px',
      clipPath: 'polygon(0% 50%, 25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%)',
      transform: 'rotate(' + this.state.rotation + 'deg)',
    };
    if (this.state.floating) {
      fullHexStyle.position = 'fixed';
    }
    const overlayImg=require('resources/glow.png');
    let overlayStyle = {
      backgroundImage: `url(${overlayImg})`,
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% 100%',
      width: '100%',
      height: '100%',
      clipPath: 'polygon(0% 50%, 25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%)',
      visibility: 'hidden',
    };
    if (this.state.active) {
      overlayStyle.visibility = 'visible';
    }
    return super.render((
      <div style={fullHexStyle}>
        <div style={overlayStyle}>
          {children}
        </div>
      </div>
    ));
  }
}

class HexBoard extends React.Component {
  componentDidUpdate(prevProps, prevState, snapshot) {
  }

  render() {
    const boardBackground=require('resources/board.jpg');

    const rowStyle = {
      display: 'table-row',
    };

    const boardStyle = {
      backgroundImage: `url(${boardBackground})`,
      width: '1024px',
      height: '683px',
    };

    const tableStyle = {
      display: 'table',
      paddingLeft: '270px',
      paddingTop: '80px',
    };

    const tbodyStyle = {
      display: 'table-row-group',
    };

    let tbody = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      let cells = [];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (XyIsValid(x, y))
          cells.push(<FullHex token="borgo_net_fighter"/>);
        else
          cells.push(<InvisibleHex/>);
      }
      tbody.push(<div style={rowStyle} key={y}>{cells}</div>);
    }

    return (
      <div style={boardStyle}>
        <div style={tableStyle} id="board">
          <div style={tbodyStyle}>{tbody}</div>
        </div>
      </div>
    );
  }
}

// Return true if `cells` is in a winning configuration.
function IsVictory(cells) {
  return false
}

// Return true if all `cells` are occupied.
function IsDraw(cells) {
  return cells.filter(c => c === null).length === 0;
}

const Hex = Game({
  setup: () => {
    return { cells: Array(BOARD_HEIGHT * BOARD_WIDTH).fill(null) };
  },

  moves: {
    clickCell(G, ctx, id) {
      // Ensure that we can't overwrite cells.
      if (G.cells[id] === null) {
        G.cells[id] = ctx.currentPlayer;
      }
    },
  },

  flow: {
    endGameIf: (G, ctx) => {
      if (IsVictory(G.cells)) {
        return { winner: ctx.currentPlayer };
      }
      if (IsDraw(G.cells)) {
        return { draw: true };
      }
    },
  },
});

const App = Client({
  game: Hex,
  board: HexBoard,
});

export default App;
