import { Panel } from '../../GameRoot';
import { CardQuality, CfgMgr, StdLevel } from '../../manager/CfgMgr';
import PlayerData, { FightState } from '../../module/roleModule/PlayerData';
import { BattleReadyLogic } from './BattleReadyLogic';
import { HomeUI } from '../../module/home/panel/HomeUI';
import { Node, Button, Sprite, SpriteFrame, instantiate, Label, Prefab, path, ProgressBar } from 'cc';
import { folder_head_card, folder_icon, folder_item, ResMgr } from '../../manager/ResMgr';
import { AudioMgr, Audio_CommonClick } from '../../manager/AudioMgr';
import { AdaptBgTop } from '../../module/common/BaseUI';

export class BattleReportPanel extends Panel {
    
    protected prefab: string = 'prefabs/battle/BattleReportPanel';

    _item: Node;

    _selfContent: Node;
    _otherContent: Node;
    _battleId;

    _mask: Node;

    protected async onLoad() {

        this._item = this.node.getChildByPath('item/ReportItem');
        this._selfContent = this.node.getChildByPath("self/ScrollView/view/content");
        this._otherContent = this.node.getChildByPath("other/ScrollView/view/content");
        this._mask = this.node.getChildByName("mask");
        AdaptBgTop(this._mask)
        this.node.getChildByName("closeBtn").on(Button.EventType.CLICK, this.onClose, this);
    }

    protected override onShow(...arg: any[]): void {
        const data = arg[0];
        if(this._battleId === data.battleID)
            return;

        this._battleId = data.battleID;
        this._selfContent.removeAllChildren();
        this._otherContent.removeAllChildren();

        const resultReport = data.resultReport;
        if(!resultReport) return;
        if(resultReport.unitBattleStats[1])
           this.LoadingCamp(resultReport.unitBattleStats[1], 1);

        if(resultReport.unitBattleStats[2])
            this.LoadingCamp(resultReport.unitBattleStats[2], 2);
    }

    async LoadingCamp(campData, camp)
    {
        let totalDamage = 0;
        let totalDefense = 0;
        let totalHeal = 0;

        for (let key in campData) {
            if (campData.hasOwnProperty(key)) {
                let value = campData[key]
                totalDamage += Number(value.damage);
                totalDefense += Number(value.defense);
                totalHeal += Number(value.heal);
            }
        }

        let content = camp == 1 ?  this._selfContent : this._otherContent;
 
        for (let key in campData) {
            if (campData.hasOwnProperty(key)) {
                let element = campData[key]
                let item = instantiate(this._item);
                content.addChild(item);
    
                let unitConfig = CfgMgr.GetRole()[element.type];
                let head = item.getChildByName('ReportIcon');
                head.getChildByName('icon').getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(folder_head_card+`${unitConfig.Icon}/spriteFrame`, SpriteFrame);
                head.getChildByName("type").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub(path.join("sheets/common/profession", unitConfig.PositionType + (camp == 1? "_B": "_R"), "spriteFrame"), SpriteFrame);
    
                item.getChildByPath('attack/value').getComponent(Label).string = Math.ceil(element.damage).toString();
                item.getChildByPath('attack/ProgressBar').getComponent(ProgressBar).progress = totalDamage > 0 ? element.damage / totalDamage : 0;
                item.getChildByPath('defense/value').getComponent(Label).string =  Math.ceil(element.defense).toString();
                item.getChildByPath('defense/ProgressBar').getComponent(ProgressBar).progress = totalDefense > 0 ? element.defense / totalDefense : 0;
                item.getChildByPath('heal/value').getComponent(Label).string =  Math.ceil(element.heal).toString();
                item.getChildByPath('heal/ProgressBar').getComponent(ProgressBar).progress = totalHeal > 0 ? element.heal / totalHeal : 0;
            }
        }

    }

    private onClose(){
        AudioMgr.PlayOnce(Audio_CommonClick);
        this.Hide();
    }


    public flush(...args: any[]): void {
    }
    protected onHide(...args: any[]): void {
        // this._selfContent.removeAllChildren();
        // this._otherContent.removeAllChildren();
    }

}


