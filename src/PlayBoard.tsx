import React from 'react';
import * as HexBoardUtils from './HexBoardUtils';
import * as HexUtils from './HexUtils';
import { BoardState } from './BoardState';
import { EmptyHex } from './EmptyHex';
import { TokenHex } from './TokenHex';

/*
 * Components of the playable part of the board.
 */

/**
 * Renders the spacer that occupies the table layout cells not related
 * to any hex.
 */
class PlayBoardSpacer extends React.Component {
  render() {
    const invisibleCellStyle: React.CSSProperties = {
      border: 'none',
      display: 'table-cell',
      height: '52px',
      visibility: 'hidden',
      width: '92px',
    };
    return (
      <div style={invisibleCellStyle}>
      </div>
    );
  }
}

interface PlayBoardContainerProps {
  /** The hex inside this field. */
  children: React.ReactElement;
}

/**
 * Wraps one hex on playing board.
 */
class PlayBoardContainer extends React.Component<PlayBoardContainerProps, {}> {
  render() {
    const cellStyle: React.CSSProperties = {
      border: 'none',
      display: 'table-cell',
      height: '52px',
      width: '92px',
    };
    const overflowStyle: React.CSSProperties = {
      height: '1px',
      overflow: 'visible',
      width: '1px',
    };
    const containerStyle: React.CSSProperties = {
      height: '100px',
      position: 'relative',
      width: '118px',
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

interface PlayBoardProps {
  /** Position of the currently selected hex. */
  activeHex: number | null;
  /** Board state. */
  board: BoardState;
  /**
   * A function to call when the hex is clicked.
   * @param Mouse click event.
   * @param Position of the hex.
   */
  onClick: HexBoardUtils.HexClickEventCallback;
  /**
   * A function to call when the scroll wheel is scrolled over the hex.
   * @param Mouse wheel event.
   * @param Position of the hex.
   */
  onWheel: HexBoardUtils.HexWheelEventCallback;
}

/**
 * Renders the playable part of the board.
 * <pre>
 * /--------------------------------------------------------\
 * | PlayBoard                                              |
 * | /--------------------------\ /-----------------------\ |
 * | | PlayBoardContainer (x19) | | PlayBoardSpacer (x26) | |
 * | | /----------------------\ | |                       | |
 * | | | {Empty,Full}Hex      | | |                       | |
 * | | \----------------------/ | |                       | |
 * | \--------------------------/ \-----------------------| |
 * \--------------------------------------------------------/
 * </pre>
 */
export class PlayBoard extends React.Component<PlayBoardProps, {}> {
  render() {
    const tableStyle = {
      display: 'table',
    };
    const tbodyStyle = {
      display: 'table-row-group',
    };
    const rowStyle = {
      display: 'table-row',
    };

    let tbody = [];
    for (let y = 0; y < HexUtils.BOARD_HEIGHT; y++) {
      let cells = [];
      for (let x = 0; x < HexUtils.BOARD_WIDTH; x++) {
        const pos = HexUtils.XyToPos(x, y);
        if (!HexUtils.XyIsValid(x, y)) {
          cells.push(<PlayBoardSpacer key={pos}/>);
          continue;
        }

        const hex = this.props.board.get(pos);
        let contents;
        if (hex) {
          const active = pos === this.props.activeHex;
          contents = (
            <TokenHex hex={hex} pos={pos} active={active}
                      onClick={this.props.onClick}
                      onWheel={this.props.onWheel}/>
          );
        } else {
          contents = <EmptyHex pos={pos} onClick={this.props.onClick}/>
        }

        cells.push(
          <PlayBoardContainer key={pos}>
            {contents}
          </PlayBoardContainer>
        );
      }

      tbody.push(
        <div style={rowStyle} key={y}>
          {cells}
        </div>
      );
    }

    return (
      <div style={tableStyle} id="board">
        <div style={tbodyStyle}>
          {tbody}
        </div>
      </div>
    );
  }
}

