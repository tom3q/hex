import { immerable } from 'immer';
import * as HexUtils from './HexUtils';
import { HexGameState } from './HexGameState';

class BattleAction {
  coords: HexUtils.Coordinates;

  constructor(coords: HexUtils.Coordinates) {
    this.coords = coords;
  }
}

/*
 * Contains state of a battle.
 */
export class Battle {
  [immerable] = true

  /** Current initiative segment. */
  initiative: number;
  /** The next player to give turn to after the battle. */
  initiator: number;
  postActions: Array<BattleAction>;
  preActions: Array<BattleAction>;
  /** The order of token actions in the current initiative. */
  actions: Array<BattleAction>;

  /**
   * Constructs a battle object.
   */
  constructor(initiator: number) {
    this.initiative = -1;
    this.initiator = initiator;
    this.postActions = [];
    this.preActions = [];
    this.actions = [];
  }

  start(G: HexGameState): void {
    let maxInitiative = -1;
    G.board.forEachHex((hex, coords) => {
      maxInitiative = Math.max(maxInitiative, ...hex.initiative);
    });
    this.initiative = maxInitiative;
  }

  prepareSegment(G: HexGameState): boolean {
    if (this.initiative < 0)
      return false;

    this.actions = [];
    this.preActions = [];
    G.board.forEachHex((hex, coords) => {
      if (hex.initiative.includes(this.initiative)) {
        if (hex.token.abilities && hex.token.abilities.length) {
          this.preActions.push(new BattleAction(coords));
        } else {
          this.actions.push(new BattleAction(coords));
        }
      }
    });

    return true;
  }

  runPreActions(G: HexGameState, player: number): boolean {
    let actionsPending = false;

    G.board.forEachHex((hex, coords) => {
      if ((!hex.initiative.length ||
            hex.initiative.includes(this.initiative))
          && hex.player === player) {
        hex.pendingActions = hex.token.getBattlePreActions();
        if (hex.pendingActions.length) {
          actionsPending = true;
        }
      }
    });

    return actionsPending;
  }

  runPostActions(G: HexGameState, player: number): boolean {
    let actionsPending = false;

    G.board.forEachHex((hex, coords) => {
      if ((!hex.initiative.length ||
            hex.initiative.includes(this.initiative))
          && hex.player === player) {
        hex.pendingActions = hex.token.getBattlePostActions();
        if (hex.pendingActions.length) {
          actionsPending = true;
        }
      }
    });

    return actionsPending;
  }

  runSegment(G: HexGameState): void {
    G.board.forEachHex((hex, coords) => {
      if (!hex.initiative.length || hex.initiative.includes(this.initiative)) {
        let actions = hex.token.getBattleActions();
        if (!actions.length) return;

        console.log(coords + ' attacking');

        for (let action of actions) {
          action.handler(G, coords.toPos());
        }
      }
    });
  }

  finishSegment(G: HexGameState): void {
    G.board.forEachHex((hex, coords) => {
      if (hex.damage >= hex.health) {
        G.board.remove(coords.toPos());
      }
    });
    --this.initiative;
  }
}
