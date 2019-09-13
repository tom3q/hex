import React from 'react';
import * as HexUtils from './HexUtils';
import { Button } from './Button';
import { HexGameState } from './HexGameState';
import { PlayBoard } from './PlayBoard';
import { TokenCache } from './TokenCache';

interface HexBoardProps {
  /** The game metadata */
  ctx: any;
  /** The game state */
  G: HexGameState;
  /** Contains functions to dispatch game moves. */
  moves: any;
  /** The player ID associated with the client. */
  playerID: string;
  /** The function to undo a game move. */
  undo: () => void;
}

interface HexBoardState {
  /** Position of the currently selected hex. */
  activeHex: number | null;
}

/**
 * Composites all the parts of the complete board.
 * <pre>
 * /---------------------------------------------\
 * | HexBoard                                    |
 * | /-----------------------------------------\ |
 * | | TokenCache                              | |
 * | \-----------------------------------------/ |
 * | /------------\ /-----------\ /------------\ |
 * | | TokenCache | | PlayBoard | | TokenCache | |
 * | \------------/ \-----------/ \------------/ |
 * | /-----------------------------------------\ |
 * | | TokenCache                              | |
 * | \-----------------------------------------/ |
 * \---------------------------------------------/
 * </pre>
 */
export class HexBoard extends React.Component<HexBoardProps, HexBoardState> {
 /**
  * Current position of the mouse wheel in the units same as
  * SyntheticEvent.deltaY.
  */
  private wheelPos: number;

  constructor(props: HexBoardProps) {
    super(props);
    /** State of the component used for rendering. */
    this.state = {
      activeHex: null
    }
    this.wheelPos = 0;
  }

  /**
   * Handler for hex click events.
   * @param Mouse click event.
   * @param Position of the hex.
   */
  private onClick = (e: React.SyntheticEvent, pos: number): void => {
    if (this.props.ctx.currentPlayer !== this.props.playerID)
      return;

    /* Do not handle clicks on other player's caches. */
    if (HexUtils.PosIsCache(pos) &&
        HexUtils.CachePosToPlayer(pos) !== Number(this.props.playerID))
      return;

    /* Clicking the active token deactivates it. */
    if (pos === this.state.activeHex) {
      this.setState({ activeHex: null });
      return;
    }

    /* Use an intant hex if active and clicked on a board hex. */
    const activeHex = this.state.activeHex !== null ?
      this.props.G.cells[this.state.activeHex] : null;
    if (activeHex && activeHex.token.instant) {
      if (!HexUtils.PosIsCache(pos)) {
        this.props.moves.useInstantToken(this.state.activeHex, pos);
        this.setState({ activeHex: null });
      }
      return;
    }

    /* Change the active selection if clicked on another owned token. */
    const targetHex = this.props.G.cells[pos];
    if (targetHex) {
      // Clicked a TokenHex
      if (targetHex.player === Number(this.props.playerID)) {
        this.setState({ activeHex: pos });
      }
      return;
    }

    /* Move the active token if clicked on an empty field. */
    if (this.state.activeHex !== null) {
      this.props.moves.moveToken(this.state.activeHex, pos);
      this.setState({ activeHex: null });
    }
  }

  /**
   * Handler for hex wheel events.
   * @param Mouse wheel event.
   * @param Position of the hex.
   */
  private onWheel = (e: React.WheelEvent, pos: number): void => {
    if (this.state.activeHex !== pos)
      return;

    const activeHex = this.props.G.cells[pos];
    if (activeHex === null || activeHex.token.instant)
      return;

    this.wheelPos += e.deltaY;
    const steps = Math.floor(this.wheelPos / 128);
    this.wheelPos -= steps * 128;

    if (Math.abs(steps) >= 1)
      this.props.moves.rotateToken(pos, steps);
  };

  render() {
    const boardBackground=require('./resources/board.jpg');
    const boardStyle: React.CSSProperties = {
      backgroundImage: `url(${boardBackground})`,
      backgroundPosition: '0px 50px',
      backgroundRepeat: 'no-repeat',
      width: '1024px',
      zIndex: 0,
    };
    const horizontalCacheStyle: React.CSSProperties = {
      height: '130px',
      marginTop: '30px',
      textAlign: 'center',
      width: '100%',
    };
    const verticalCacheStyle: React.CSSProperties = {
      display: 'inline-block',
      lineHeight: 'normal',
      textAlign: 'center',
      verticalAlign: 'middle',
      width: '270px',
    };
    const middleContainerStyle: React.CSSProperties = {
      lineHeight: '523px',
      verticalAlign: 'middle',
    };
    const tableContainerStyle: React.CSSProperties = {
      display: 'inline-block',
      height: '523px',
      lineHeight: 'normal',
      verticalAlign: 'middle',
    };
    const bottomSpacerStyle: React.CSSProperties = {
      display: 'inline-block',
      width: '100px',
    };

    let caches = [];
    for (let i = 0; i < HexUtils.MAX_PLAYERS; ++i) {
      const player = (Number(this.props.playerID) + i)
                     % HexUtils.MAX_PLAYERS;
      caches.push(
        <TokenCache vertical={i % 2 !== 0}
                    player={player}
                    cells={this.props.G.cells}
                    activeHex={this.state.activeHex}
                    onClick={this.onClick}
                    onWheel={this.onWheel}/>
      );
    }

    const playerActive =
      this.props.ctx.currentPlayer === this.props.playerID;
    return (
      <div style={boardStyle}>
        <div style={horizontalCacheStyle}>
          {caches[2]}
        </div>
        <div style={middleContainerStyle}>
          <div style={verticalCacheStyle}>
            {caches[1]}
          </div>
          <div style={tableContainerStyle}>
            <PlayBoard cells={this.props.G.cells}
                       activeHex={this.state.activeHex}
                       onClick={this.onClick}
                       onWheel={this.onWheel}/>
          </div>
          <div style={verticalCacheStyle}>
            {caches[3]}
          </div>
        </div>
        <div style={horizontalCacheStyle}>
            <div style={bottomSpacerStyle}></div>
            <Button width='100px' height='100px' disabled={!playerActive}
                    image='toolbox_undo_x4.png'
                    imageDown='toolbox_undo_pressed_x4.png'
                    onClick={(e) => this.props.undo()}/>
            <div style={bottomSpacerStyle}></div>
            {caches[0]}
            <div style={bottomSpacerStyle}></div>
            <Button width='100px' height='80px' rotation={180}
                    disabled={!playerActive}
                    image='hand_view_button_cancel_x4.png'
                    imageDown='hand_view_button_cancel_pressed_x4.png'
                    onClick={(e) => {
                      this.props.moves.discardCache(this.state.activeHex);
                      this.setState( { activeHex: null } );
                    }}/>
            <Button width='100px' height='80px' disabled={!playerActive}
                    image='hand_view_button_end_turn_x4.png'
                    imageDown='hand_view_button_end_turn_pressed_x4.png'
                    onClick={(e) => this.props.moves.endTurn()}/>
        </div>
      </div>
    );
  }
}

