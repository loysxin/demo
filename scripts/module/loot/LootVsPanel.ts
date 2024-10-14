import { Node, Button, Label, find, Sprite, path, SpriteFrame, UITransform, UI } from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_BuyPlunderTimes, Evt_LootGetPlayerBattleData, Evt_LootPlayerData, Evt_Matching, Evt_Matching2, Evt_PvpSerchFinsh } from "../../manager/EventMgr";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { Tips } from "../login/Tips";
import { LootVsBuyNumPanel } from "./LootVsBuyNumPanel";
import { LootRoleInfoPanel } from "./LootRoleInfoPanel";
import PlayerData from "../roleModule/PlayerData";
import { CfgMgr } from "../../manager/CfgMgr";
import { ChangeScenePanel } from "../home/ChangeScenePanel";
import { randomI, ToFixed, formatNumber } from '../../utils/Utils';
import { ResMgr, folder_loot } from "../../manager/ResMgr";


export class LootVsPanel extends Panel {
    protected prefab: string = "prefabs/panel/loot/LootVsPanel";
    private seekBtn: Button;
    private challengeNumLab: Label;
    private addBtn: Button;
    private matchData;
    private cdTime = 0;
    private serch: Node;

    protected onLoad() {
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
        // this.vsCont = this.find(`vsCont`);
        this.seekBtn = this.find(`seekBtn`, Button);
        this.challengeNumLab = this.find(`challengeNumLab`, Label);
        this.addBtn = this.find(`addBtn`, Button);
        this.serch = this.find(`serch`);
        this.onBtnEvent();
    }

    private onBtnEvent() {
        this.addBtn.node.on(Button.EventType.CLICK, this.onAddBtn, this);
        this.seekBtn.node.on(Button.EventType.CLICK, this.onSeekBtn, this);
    }

    protected onShow(): void {
        EventMgr.on(Evt_LootPlayerData, this.onPlayerData, this);
        EventMgr.on(Evt_LootGetPlayerBattleData, this.onGetPlayerData, this);
        EventMgr.on(Evt_BuyPlunderTimes, this.onChangeTime, this);
        EventMgr.on(Evt_Matching2, this.onCD, this);
    }
    public flush(...args: any[]): void {
        if (!args[0]) return;
        this.matchData = args[0];
        this.refershCount();
        EventMgr.emit(Evt_PvpSerchFinsh);
        this.onCD();
    }
    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_LootPlayerData, this.onPlayerData, this);
        EventMgr.off(Evt_LootGetPlayerBattleData, this.onGetPlayerData, this);
        EventMgr.off(Evt_BuyPlunderTimes, this.onChangeTime, this);
        EventMgr.off(Evt_Matching2, this.onCD, this);
    }

    private onChangeTime() {
        this.challengeNumLab.string = `${PlayerData.LootPlayerData.match_count}次`;
    }

    private async onSeekBtn() {
        let data = {
            type: MsgTypeSend.Matchmaking,
            data: {
            }
        }
        Session.Send(data);
        // await ChangeScenePanel.PlayEffect(Evt_PvpSerchFinsh);
        this.serch.active = true;
    }
    private onAddBtn() {
        LootVsBuyNumPanel.ShowTop();
    }
    private onPlayerData(data) {
        this.challengeNumLab.string = `${data.match_player_data.match_count}次`;
    }
    private refershCount() {
        let Num = randomI(3, 1);
        let vsCont = this.find(`vsCont${Num}`)
        let bg = this.find(`map`, Sprite);
        ResMgr.LoadResAbSub(path.join(folder_loot, `0${Num}`, `spriteFrame`), SpriteFrame, res => {
            bg.spriteFrame = res;
        });

        this.find(`vsCont${1}`).active = false
        this.find(`vsCont${2}`).active = false
        this.find(`vsCont${3}`).active = false
        vsCont.active = true;
        vsCont.children.forEach((node, index) => {
            if (this.matchData[index]) {
                let data = this.matchData[index];
                let powerLab = find(`resCont/powerLab`, node).getComponent(Label);
                let moneyLab = find(`resCont/moneyLab`, node).getComponent(Label);
                let roleLvLab = find(`infoCont/roleLvLab`, node).getComponent(Label);
                let roleNameLab = find(`infoCont/roleNameLab`, node).getComponent(Label);
                let revengeIcon = find(`revengeIcon`, node);
                let shieldEffect = find(`ui_shield`, node);
                //let roleNameBg = node.getChildByPath(`infoCont/roleNameBg`).getComponent(UITransform);
                roleLvLab.string = data.level;
                powerLab.string = data.battle_power;
                moneyLab.string = formatNumber(data.currency1, 2);
                roleNameLab.string = data.player_name;
                // roleNameLab.updateRenderData();
                //roleNameBg.width = roleNameLab.node.getComponent(UITransform).width + 70;
                shieldEffect.active = data.has_shield;
                revengeIcon.active = data.are_enemies;
                node.off(Node.EventType.TOUCH_END);
                node.on(Node.EventType.TOUCH_END, () => {

                    if(data.has_shield)
                    {
                        Tips.Show(CfgMgr.GetText("pvp_2"));
                        return;
                    }


                    let sendData = {
                        type: MsgTypeSend.GetPlayerBattleData,
                        data: {
                            player_id: data.player_id,
                        }
                    };
                    Session.Send(sendData);
                }, this);
            }
        })
        this.challengeNumLab.string = `${PlayerData.LootPlayerData.match_count}次`;
        this.serch.active = false;
    }
    private onGetPlayerData(data) {
        LootRoleInfoPanel.ShowTop(data.battle_data);
    }

    private onCD() {
        let seasonData = CfgMgr.getPVPById(PlayerData.LootSeasonInfo.season_id);
        this.cdTime = seasonData.MateCDAdd;
        this.seekBtn.node.getComponent(Sprite).grayscale = true;
        this.seekBtn.interactable = false;
        this.seekBtn.node.children.forEach((node) => {
            node.active = node.name == `CDLab`;
        })
        this.seekBtn.node.getChildByName(`CDLab`).getComponent(Label).string = `搜索冷却(${this.cdTime}S)`
        this.seekBtn.unscheduleAllCallbacks();
        this.seekBtn.schedule(() => {
            this.cdTime--;
            this.seekBtn.node.getChildByName(`CDLab`).getComponent(Label).string = `搜索冷却(${this.cdTime}S)`
            if (this.cdTime <= 0) {
                this.seekBtn.node.getComponent(Sprite).grayscale = false;
                this.seekBtn.interactable = true;
                this.seekBtn.node.children.forEach((node) => {
                    node.active = node.name != `CDLab`;
                })
            }
        }, 1, this.cdTime)
        this.serch.active = false;
    }
}