import { Runtime } from "./BattleLogic/Runtime";
import { GameLocal } from "./BattleLogic/game/GameLocal";
import { GameSet } from "../module/GameSet";
import { Plunder } from "./BattleLogic/logic/Plunder"
import { ConfigManager } from "./manager/ConfigManager"
import { AbstractGame } from "./BattleLogic/game/Game";
import { GameReplay } from "./BattleLogic/game/GameReplay";

export class BattleLogic {

    private static $ins: BattleLogic;
    static get ins() { return this.$ins; }

    // 版本号 战斗内功能改动改第一个 战斗内逻辑/机制改动改第二个 小改动改第三个
    static version = "1.1.0";
    game: AbstractGame
    BattleStartPushData: any;

    private battleStart: boolean = false;
    get isBattleStart() { return this.battleStart; }

    constructor() {
        if (BattleLogic.$ins)
            throw "error";
        BattleLogic.$ins = this;
    }

    init() {
        this.battleStart = true;
        const battle_type = this.BattleStartPushData.battle_type
        const homeland_id = this.BattleStartPushData.homeland_id
        let configManager = new ConfigManager
        configManager.init(battle_type, homeland_id)

        this.game = this.BattleStartPushData.isReplay ? new GameReplay() : new GameLocal()
        this.game["createContext"] = {
            configManager: configManager,
            type: battle_type,
            homeland_id: homeland_id,
            battleInitData: this.BattleStartPushData
        }

        this.game.Init()
    }

    start() {
        GameSet.RegisterUpdate(this.update, this);

        this.game.Start()
    }

    update() {
        this.game.Loop()
    }

    end() {
        this.game.End()
        GameSet.UpRegisterUpdate(this.update, this);
        this.battleStart = false;
    }
}
