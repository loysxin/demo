import { ConfigManager } from "../manager/ConfigManager"
import { AbstractGame } from "./game/Game"
import { Collector } from "./logic/Collector"
import { GameGrids } from "./logic/GameGrids_grid"
import { GameLogic } from "./logic/GameLogic"
import { GameView } from "./view/GameView"

export class Runtime {

    //==========================================================================================
    static tempPlayerId
    //==========================================================================================

    static battleInitData

    static game : AbstractGame

    static gameLogic: GameLogic
    static map
    static gameGrids: GameGrids
    static collector: Collector

    //==========================================================================================
    static root
    static gameView:GameView
    //==========================================================================================

    static configManager: ConfigManager

    static battleModule
}
