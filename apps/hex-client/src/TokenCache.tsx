import React from 'react';
import * as HexBoardUtils from './HexBoardUtils';
import * as HexUtils from 'hex-game/HexUtils';
import { BoardStateManager } from 'hex-game/BoardStateManager';
import { EmptyHex } from './EmptyHex';
import { TokenHex } from './TokenHex';

/*
 * Token cache components
 */

interface TokenCacheContainerProps {
  /** The hex inside this field. */
  children: React.ReactElement;
  /** Whether the cache is vertical. */
  vertical: boolean;
}

/**
 * Wraps one hex in player's token cache.
 */
class TokenCacheContainer extends React.Component<TokenCacheContainerProps, {}> {
  render() {
    const containerStyle: React.CSSProperties = {
      display: 'inline-block',
      height: '100px',
      position: 'relative',
      width: '118px',
    };
    const outerContainerStyle: React.CSSProperties = {
      display: 'inline-block',
      textAlign: 'center',
      width: this.props.vertical ? '100%' : undefined,
    };
    return (
      <div style={outerContainerStyle}>
        <div style={containerStyle}>
          {this.props.children}
        </div>
      </div>
    );
  }
};

interface TokenCacheProps {
  /** Position of the currently selected hex. */
  activeHex: number | null;
  /** Board state. */
  board: BoardStateManager;
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
  /* Index of the player this cache belongs to. */
  player: number;
  /** Whether the cache is vertical. */
  vertical: boolean;
}

/**
 * Renders player's token cache.
 * <pre>
 * /------------------------------\
 * | TokenCache                   |
 * | /--------------------------\ |
 * | | TokenCacheContainer (x3) | |
 * | | /----------------------\ | |
 * | | | {Empty,Full}Hex      | | |
 * | | \----------------------/ | |
 * | \--------------------------/ |
 * \------------------------------/
 * </pre>
 */
export class TokenCache extends React.Component<TokenCacheProps, {}> {
  render() {
    let items = [];
    for (let i = 0; i < HexUtils.CACHE_SIZE; ++i) {
      const pos = this.props.player * HexUtils.CACHE_SIZE + i;
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
        const background=require('hex-resources/resources/gfx/disabled_background.png');
        contents = <EmptyHex pos={pos}
                             backgroundImage={background}
                             onClick={this.props.onClick}/>;
      }
      items.push(
        <TokenCacheContainer key={pos} vertical={this.props.vertical}>
          {contents}
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
