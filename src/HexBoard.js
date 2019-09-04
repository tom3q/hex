import React from 'react';
import * as HexUtils from 'HexUtils.js';

class HexBoardSpacer extends React.Component {
  render() {
    const invisibleCellStyle = {
      display: 'table-cell',
      border: 'none',
      width: '92px',
      height: '52px',
      visibility: 'hidden',
    };
    return (
      <div style={invisibleCellStyle}></div>
    );
  }
}

class HexBoardContainer extends React.Component {
  render() {
    const cellStyle = {
      display: 'table-cell',
      border: 'none',
      width: '92px',
      height: '52px',
    };
    const overflowStyle = {
      overflow: 'visible',
      height: '1px',
      width: '1px',
    };
    const containerStyle = {
      width: '118px',
      height: '100px',
      position: 'relative',
    };
    return (
      <div style={cellStyle}>
        <div style={overflowStyle}>
          <div style={containerStyle}>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

class HexBoardEmpty extends React.Component {
  onClick = (e) => {
    this.props.onClick(e, this.props.pos);
    e.stopPropagation();
  }

  render() {
    const emptyHexStyle = {
      width: '100%',
      height: '100%',
      clipPath: 'polygon(0% 50%, 25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%)',
      zIndex: 30,
      position: 'relative',
    };
    return (
      <div style={emptyHexStyle}
           onClick={(e) => this.onClick(e)}>
        {this.props.children}
      </div>
    );
  }
}

class TokenCacheContainer extends React.Component {
  render() {
    let containerStyle = {
      width: '118px',
      height: '100px',
      position: 'relative',
      display: 'inline-block',
    };
    let outerContainerStyle = {
      teouterContainerStyletAlign: 'center',
      display: 'inline-block',
    };

    if (this.props.vertical)
      outerContainerStyle.width = '100%';

    return (
      <div style={outerContainerStyle}>
        <div style={containerStyle}>
          {this.props.children}
        </div>
      </div>
    );
  }
};

class TokenCacheEmpty extends React.Component {
  render() {
    const emptyBackground=require('resources/disabled_background.png');
    const cacheEmptyStyle = {
      backgroundImage: `url(${emptyBackground})`,
      backgroundSize: '118% 118%',
      backgroundPosition: 'center center',
      width: '100%',
      height: '100%',
      clipPath: 'polygon(0% 50%, 25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%)',
      position: 'relative',
      zIndex: 20,
    };
    return (
      <HexBoardEmpty pos={this.props.pos}
                     onClick={this.props.onClick}>
        <div style={cacheEmptyStyle}></div>
      </HexBoardEmpty>
    );
  }
};

class HexBoardToken extends React.Component {
  constructor(props) {
    super(props);
    this.wheelPos = 0;
    this.state = {
      floating: false,
    };
  }

  onWheel = (e) => {
    if (!this.props.onRotate)
      return;
    if (!this.props.active)
      return;
    if (this.props.locked && !this.props.canRotate)
      return;
    this.wheelPos += e.deltaY;
    let steps = Math.floor(this.wheelPos / 128);
    this.wheelPos -= steps * 128;
    this.props.onRotate(this.props.pos, steps);
  }

  onClick = (e) => {
    console.log('Clicked hex ' + this.props.pos);
    this.props.onClick(e, this.props.pos);
    e.stopPropagation();
 }

  render() {
    const fullHex=require('resources/' + this.props.token + '.png');
    let fullHexStyle = {
      backgroundImage: `url(${fullHex})`,
      backgroundSize: '118% 118%',
      backgroundPosition: 'center center',
      width: '100%',
      height: '100%',
      transform: 'rotate(' + this.props.rotation * 60 + 'deg)',
      clipPath: 'polygon(0% 50%, 25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%)',
      position: 'relative',
      zIndex: 20,
    };
    if (this.state.floating) {
      fullHexStyle.position = 'fixed';
    }
    const overlayImg=require('resources/glow.png');
    let overlayStyle = {
      backgroundImage: `url(${overlayImg})`,
      backgroundSize: '110% 110%',
      backgroundPosition: 'center center',
      width: '100%',
      height: '100%',
      position: 'absolute',
      left: '0px',
      top: '0px',
      visibility: 'hidden',
      zIndex: 15,
    };
    if (this.props.active) {
      overlayStyle.visibility = 'visible';
      fullHexStyle.zIndex = 10;
    }
    return (
      <>
      <div style={fullHexStyle}
           onClick={(e) => this.onClick(e)}
           onWheel={(e) => this.onWheel(e)}></div>
      <div style={overlayStyle}
           onClick={(e) => this.onClick(e)}
           onWheel={(e) => this.onWheel(e)}></div>
      </>
    );
  }
}

class TokenCache extends React.Component {
  render() {
    let items = [];
    for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
      let pos = this.props.player * HexUtils.CACHE_SIZE + i;
      let hex = this.props.cells[pos];
      if (hex)
        items.push(
          <TokenCacheContainer key={pos} vertical={this.props.vertical}>
            <HexBoardToken pos={pos}
                           token={hex.token}
                           rotation={hex.rotation}
                           active={this.props.activeHex === pos}
                           onClick={this.props.onClick}/>
          </TokenCacheContainer>
        );
      else
        items.push(
          <TokenCacheContainer key={pos} vertical={this.props.vertical}>
            <TokenCacheEmpty pos={pos} onClick={this.props.onClick}/>
          </TokenCacheContainer>
        );
    }
    return (
      <>
        {items}
      </>
    );
  }
}

export class HexBoard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeHex: null
    }
  }

  onClick = (e, pos) => {
    if (pos === null) {
      this.setState({
        activeHex: null
      });
      return;
    }

    let hex = this.props.G.cells[pos];
    if (hex) {
      this.setState(state => ({
        activeHex: (pos === state.activeHex) ? null : pos,
      }));
      return;
    }

    if (this.state.activeHex !== null)
      this.props.moves.moveToken(this.state.activeHex, pos);
    this.setState({
      activeHex: null
    });
    console.log('Clicked empty hex ' + pos + '!');
  }

  onRotateToken = (pos, rotation) => {
    this.props.moves.rotateToken(pos, rotation);
  };

  render() {
    const boardBackground=require('resources/board.jpg');

    const rowStyle = {
      display: 'table-row',
    };

    const boardStyle = {
      backgroundImage: `url(${boardBackground})`,
      backgroundPosition: '0px 50px',
      backgroundRepeat: 'no-repeat',
      width: '1024px',
      zIndex: 0,
    };

    const horizontalCacheStyle = {
      width: '100%',
      height: '130px',
      textAlign: 'center',
      marginTop: '30px',
    };

    const verticalCacheStyle = {
      display: 'inline-block',
      width: '270px',
      textAlign: 'center',
      verticalAlign: 'middle',
      lineHeight: 'normal',
    };

    const middleContainerStyle = {
      verticalAlign: 'middle',
      lineHeight: '523px',
    };

    const tableContainerStyle = {
      display: 'inline-block',
      verticalAlign: 'middle',
      lineHeight: 'normal',
      height: '523px',
    };

    const tableStyle = {
      display: 'table',
    };

    const tbodyStyle = {
      display: 'table-row-group',
    };

    let tbody = [];
    for (let y = 0; y < HexUtils.BOARD_HEIGHT; y++) {
      let cells = [];
      for (let x = 0; x < HexUtils.BOARD_WIDTH; x++) {
        let pos = HexUtils.XyToPos(x, y);
        if (HexUtils.XyIsValid(x, y)) {
          let hex = this.props.G.cells[pos];
          if (hex) {
            cells.push(
              <HexBoardContainer key={pos}>
                <HexBoardToken pos={pos}
                               token={hex.token}
                               rotation={hex.rotation}
                               active={this.state.activeHex === pos}
                               onClick={this.onClick}
                               onRotate={this.onRotateToken}/>
              </HexBoardContainer>
            );
          } else {
            cells.push(
              <HexBoardContainer key={pos}>
                <HexBoardEmpty pos={pos}
                               onClick={this.onClick}/>
              </HexBoardContainer>
            );
          }
        } else {
          cells.push(<HexBoardSpacer key={pos}/>);
        }
      }
      tbody.push(<div style={rowStyle} key={y}>{cells}</div>);
    }

    return (
      <div style={boardStyle}
           onClick={(e) => this.onClick(e)}>
        <div style={horizontalCacheStyle}>
          <TokenCache player={(this.props.playerID + 2) % 4}
                      cells={this.props.G.cells}
                      activeHex={this.state.activeHex}
                      onClick={this.onClick}/>
        </div>
        <div style={middleContainerStyle}>
          <div style={verticalCacheStyle}>
            <TokenCache player={(this.props.playerID + 1) % 4}
                        cells={this.props.G.cells}
                        activeHex={this.state.activeHex}
                        onClick={this.onClick}
                        vertical='true'/>
          </div>
          <div style={tableContainerStyle}>
            <div style={tableStyle} id="board">
              <div style={tbodyStyle}>{tbody}</div>
            </div>
          </div>
          <div style={verticalCacheStyle}>
            <TokenCache player={(this.props.playerID + 3) % 4}
                        cells={this.props.G.cells}
                        activeHex={this.state.activeHex}
                        onClick={this.onClick}
                        vertical='true'/>
          </div>
        </div>
        <div style={horizontalCacheStyle}>
          <TokenCache player={this.props.playerID}
                      cells={this.props.G.cells}
                      activeHex={this.state.activeHex}
                      onClick={this.onClick}/>
        </div>
      </div>
    );
  }
}

