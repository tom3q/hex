import * as HexGameUtils from './HexGameUtils';
import * as HexUtils from './HexUtils';
import { HexGameState } from './HexGameState';

/**
 * Produces handlers for instant tokens.
 */
class InstantHandlerFactoryClass {
  /**
   * @private Handle airstrike instant action.
   *
   * Inflicts 1 damage on given hex and surrounding ones. Cannot be cast on
   * an edge hex.
   */
  handleAirstike_ = (G: HexGameState, ctx: any, on: number): boolean => {
    const offsets = [
                        { x: 0, y: -2 },
      { x: -1, y: -1 },                  { x: 1, y: -1 },
                        { x: 0, y:  0 },
      { x: -1, y:  1 },                  { x: 1, y:  1 },
                        { x: 0, y:  2 },
    ];

    let target = HexUtils.posToXy(on);
    let offset;
    for (offset of offsets) {
      const x = target.x + offset.x;
      const y = target.y + offset.y;
      if (!HexUtils.XyIsValid(x, y)) {
        return false;
      }
    }

    for (offset of offsets) {
      const x = target.x + offset.x;
      const y = target.y + offset.y;
      const pos = HexUtils.XyToPos(x, y);
      const hex = G.cells[pos];
      if (hex && !hex.token.hq && ++hex.damage >= hex.health) {
        G.cells[pos] = null;
      }
    }
    return true;
  }

  /**
   * @private Handle battle instant action.
   *
   * Validates current turn and starts a battle if valid.
   */
  handleBattle_ = (G: HexGameState, ctx: any, on: number) => {
    if (!HexGameUtils.isTurnValid(G, ctx))
      return false;

    ctx.events.endPhase( { next: 'battle' } );
    G.players[ctx.currentPlayer].turnEnded = true;
    return true;
  }

  /**
   * Returns handler for given instant token type.
   * @param Instant token type identifier.
   * @return Handler function,
   *     or null if the type is invalid.
   */
  getHandler = (type: string) => {
    switch(type) {
      case 'airstrike':
        return this.handleAirstike_;

      case 'battle':
        return this.handleBattle_;

      default:
        return null;
    }
  }
}
export const InstantHandlerFactory = new InstantHandlerFactoryClass();
