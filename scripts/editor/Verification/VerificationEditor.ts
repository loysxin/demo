import { _decorator, assetManager, Component, EditBox, JsonAsset, Label, Node } from 'cc';
import { ResMgr } from '../../manager/ResMgr';
import { BattleLogic } from '../../battle/BattleLogic';
import { Runtime } from '../../battle/BattleLogic/Runtime';
import { CfgMgr } from '../../manager/CfgMgr';
import { map } from '../../module/home/MapData';
import { HomeLayout } from '../../module/home/HomeStruct';
import { Selector } from '../skill/Selector';
import { BattleReportPanel } from '../../battle/Ready/BattleReportPanel';
import { Goto } from '../../manager/EventMgr';
import { GameRoot } from '../../GameRoot';
const { ccclass, property } = _decorator;

@ccclass('VerificationEditor')
export class VerificationEditor extends Component {

    private battle: Selector;
    private fileName: string;
    private result: Label;
    private fileData: any;
    private battleID: string;

    private BattleReportBtn: Node;

    protected onLoad(): void {
        this.battle = this.node.getChildByName("battle").getComponent(Selector);
        this.battle.node.on("select", this.onSelect, this);
        this.node.getChildByName("Button").on("click", this.onVerify, this);
        this.result = this.node.getChildByName("Label").getComponent(Label);
        this.node.getChildByName("report").on("click", this.onReport, this);
        this.BattleReportBtn = this.node.getChildByName("report");
        this.BattleReportBtn.active = false;
    }

    async start() {
        new GameRoot(this.node);
        await VerificationEditor.PrevLoad();
        await CfgMgr.Load();

        await this.LoadData();
       
    }
    update(deltaTime: number) {
        BattleLogic.ins?.update();
    }

    ReplayEnd(data: any) {
        console.error(data);
        this.result.string += `\n战斗验算结果：${data}`;
        this.BattleReportBtn.active = true;
    }

    private async onSelect(data: string) {
        console.log(data);
        this.BattleReportBtn.active = false;
        this.fileName = data;
        let asset = await ResMgr.LoadResAbSub(`config/record/${this.fileName}`, JsonAsset);
        this.fileData = asset.json;
        this.result.string = `战斗结算数据：${this.fileData.plunder_data.process.result? this.fileData.plunder_data.process.result : "无结果" }`;
    }


    private async onVerify() {
        if(!this.fileData) return;
        let data = this.fileData;
        data.isReplay = true;
        data.battle_type = "plunder"
        data.homeland_id = data.plunder_data.defender_battle_data.homeland_id;
        data.isVerification = true;
        this.battleID = data.plunder_data.battle_id;

        let cfg = CfgMgr.GetHomeLandInit(data.homeland_id);
        let jsonAsset = await ResMgr.LoadResAbSub("config/home/" + cfg.Style, JsonAsset);
        let homeLayout: HomeLayout = jsonAsset.json;
        map.SetMapData(homeLayout.nodeWide, homeLayout.nodeHide, homeLayout.gridCol, homeLayout.nodeRow, homeLayout.nodeCol, homeLayout.nodes, homeLayout.buildings, homeLayout.mapBaking);

        if(!BattleLogic.ins) new BattleLogic();
        BattleLogic.ins.BattleStartPushData = data;
        BattleLogic.ins.init();
        if (!Runtime.battleModule.onBattleOver)
            Runtime.battleModule.onBattleOver = this.ReplayEnd.bind(this);

        BattleLogic.ins.start();
        Runtime.game?.SetGameSpeed(1000);
    }

    private onReport(){
        let resultReport = Runtime.collector?.settlement();
        if(!resultReport) return;
        BattleReportPanel.ShowUI({ resultReport: resultReport, stageId: 0, battleID: this.battleID});
    }

    /**
     * 预加载
     */
    static async PrevLoad() {
        let success1: Function;
        let promise1: Promise<any> = new Promise((resolve, reject) => {
            success1 = resolve;
        });
        assetManager.loadBundle("res", (err, ab) => {
            success1(ab);
        });
       
        return Promise.all([promise1]);
    }


    async LoadData() {
        let battles = [];
        let ab = assetManager.getBundle("res");
        let files = ab.getDirWithPath("config/record");
        for (let file of files) {
            let name = file.path.replace("config/record/", "").split("/")[0];
            if (battles.indexOf(name) == -1) battles.push(name);
        }
        this.battle.Init(battles, (item: Node, data: any) => {
            if (item.getComponent(EditBox)) {
                item.getComponent(EditBox).string = String(data);
            } else {
                item.getComponent(Label).string = String(data);
            }
        });
    }
}


