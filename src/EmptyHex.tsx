import React from 'react';
import * as HexBoardUtils from './HexBoardUtils';

interface EmptyHexProps {
  /** Path to the background image. */
  backgroundImage?: string;
  /**
   * A function to call when the hex is clicked.
   * @param Mouse click event.
   * @param Position of the hex.
   */
  onClick: HexBoardUtils.HexClickEventCallback;
  /** Position of the hex in the game cells array. */
  pos: number;
}

/**
 * Renders an empty hex field.
 */
export class EmptyHex extends React.Component<EmptyHexProps, {}> {
  render() {
    let backgroundImage = undefined;
    if (this.props.backgroundImage) {
      backgroundImage = `url(${this.props.backgroundImage})`;
    }
    const cacheEmptyStyle: React.CSSProperties = {
      backgroundImage: backgroundImage,
      backgroundPosition: 'center center',
      backgroundSize: '118% 118%',
      clipPath: 'polygon(  0% 50%, 25%   0%, 75%   0%, ' +
                        '100% 50%, 75% 100%, 25% 100%)',
      height: '100%',
      position: 'relative',
      width: '100%',
      zIndex: 30,
    };
    return (
      <div style={cacheEmptyStyle}
           onClick={(e) => this.props.onClick(e, this.props.pos)}>
      </div>
    );
  }
};
