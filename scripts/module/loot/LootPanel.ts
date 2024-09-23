import { Node, Button, Label, TweenSystem, Tween, tween, Toggle, Sprite, Vec3, UITransform, EventTouch, Camera, instantiate, utils } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { MsgTypeSend } from "../../MsgType";
import PlayerData, { SCurrentSeasonInfo, SMatchPlayerData, SThing, Tips2ID } from "../roleModule/PlayerData";
import { Session } from "../../net/Session";
import { EventMgr, Evt_BuyPlunderTimes, Evt_Change_Scene_Bgm, Evt_Hide_Scene, Evt_LootPlayerData, Evt_LootSeasonData, Evt_Matching, Evt_PvpSerchFinsh, Evt_Show_Scene } from "../../manager/EventMgr";
import { randomI } from "../../utils/Utils";
import { CfgMgr } from "../../manager/CfgMgr";
import { LootVsBuyNumPanel } from "./LootVsBuyNumPanel";
import { LootLogPanel } from "./LootLogPanel";
import { BagItem } from "../bag/BagItem";
import { LootRankPanel } from "./LootRankPanel";
import { LootAwardPanel } from "./LootAwardPanel";
import { ResourcesPanel } from "../home/panel/ResourcesPanel";
import { HomeUI } from "../home/panel/HomeUI";
import { DateUtils } from "../../utils/DateUtils";
import { MsgPanel } from "../common/MsgPanel";
import { Tips2 } from "../home/panel/Tips2";
import { AudioMgr, Audio_CommonClick, LootSoundId, LootSoundInfo, SceneBgmId } from "../../manager/AudioMgr";


export class LootPanel extends Panel {
    protected prefab: string = "prefabs/panel/loot/LootPanel";
    private timeLab: Label;
    private awardList: AutoScroller;
    private rankBtn: Button;
    private awardPoolBtn: Button;
    private awardBtn: Button;
    private heleBtn: Button;
    private homeLvLab: Label;
    private homeNameLab: Label;
    private homeNameBg: UITransform;
    private powerLab: Label;
    private rankLab: Label;
    private unionNameLab: Label;
    private pointLab: Label;
    private nextPointLab: Label;
    private roleNameLab: Label;
    private roleHomeNameLab: Label;
    private seekBtn: Button;
    private challengeNumLab: Label;
    private addBtn: Button;
    private battleInfoBtn: Button;
    private buZhenBtn: Button;
    private bg: Node;
    private ortherHome: Node;
    private serch: Node;
    private shield: Node;
    private shieldTime: Label;

    private playerData;
    private cdTime = 0;
    private StartPos: Vec3;
    private TouchStartPos: Vec3;
    private bgScale = 0.75;
    private nowUpdateTime = 0;
    protected onLoad() {
        this.timeLab = this.find("seasonCont/timeLab", Label);
        this.awardList = this.find("seasonCont/awardList", AutoScroller);
        this.rankBtn = this.find("seasonCont/rankBtn", Button);
        this.awardPoolBtn = this.find("seasonCont/awardPoolBtn", Button);
        this.awardBtn = this.find("seasonCont/awardBtn", Button);
        this.heleBtn = this.find("seasonCont/heleBtn", Button);
        this.homeLvLab = this.find("bg/myHome/homeLvLab", Label);
        this.homeNameLab = this.find("bg/myHome/homeNameLab", Label);
        this.homeNameBg = this.find("bg/myHome/homeBg", UITransform);
        this.powerLab = this.find("myInfoCont/powerLab", Label);
        this.rankLab = this.find("myInfoCont/rankLab", Label);
        this.unionNameLab = this.find("myInfoCont/unionNameLab", Label);
        this.pointLab = this.find("myInfoCont/pointLab", Label);
        this.nextPointLab = this.find("myInfoCont/nextPointLab", Label);
        this.roleNameLab = this.find("myInfoCont/roleNameLab", Label);
        this.challengeNumLab = this.find("myInfoCont/challengeNumLab", Label);
        this.seekBtn = this.find("myInfoCont/seekBtn", Button);
        this.addBtn = this.find("myInfoCont/addBtn", Button);
        this.battleInfoBtn = this.find("myInfoCont/battleInfoBtn", Button);
        this.buZhenBtn = this.find("myInfoCont/buZhenBtn", Button);
        this.roleHomeNameLab = this.find("myInfoCont/roleHomeNameLab", Label);
        this.bg = this.find(`bg`);
        this.ortherHome = this.find(`bg/ortherGroup`);
        this.serch = this.find(`serch`);
        this.shield = this.find(`bg/myHome/ui_shield`);
        this.shieldTime = this.find(`bg/myHome/shieldTime`, Label);
        this.onBtnEvent();
    }
    private onBtnEvent() {
        this.awardList.SetHandle(this.updateAwardItemLits.bind(this));
        this.rankBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.awardPoolBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.awardBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.seekBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.battleInfoBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.buZhenBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.addBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.heleBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.find(`backBtn`).on(Node.EventType.TOUCH_END, () => {
            AudioMgr.PlayOnce(Audio_CommonClick);
            this.Hide();
            HomeUI.Show();
        }, this);
        this.bg.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
        this.bg.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
        this.bg.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)
        this.bg.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)

    }
    protected onShow(): void {
        EventMgr.on(Evt_LootPlayerData, this.onPlayerData, this);
        EventMgr.on(Evt_LootSeasonData, this.onSeasonData, this);
        EventMgr.on(Evt_BuyPlunderTimes, this.onChangeTime, this);
        EventMgr.on(Evt_Matching, this.onCD, this);
        EventMgr.on(Evt_PvpSerchFinsh, () => { this.serch.active = false }, this);
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
        EventMgr.emit(Evt_Change_Scene_Bgm, SceneBgmId.SceneBgm_7);
    }
    public flush(...args: any[]): void {
        let data = {
            type: MsgTypeSend.GetMatchPlayerData,
            data: {
                player_id: PlayerData.roleInfo.player_id
            }
        }
        Session.Send(data);
        data = {
            type: MsgTypeSend.GetCurrentSeasonInfo,
            data: {
                player_id: PlayerData.roleInfo.player_id
            }
        }
        Session.Send(data);
        this.getRandomPos();
        this.serch.active = false;
    }
    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_LootPlayerData, this.onPlayerData, this);
        EventMgr.off(Evt_LootSeasonData, this.onPlayerData, this);
        EventMgr.off(Evt_BuyPlunderTimes, this.onChangeTime, this);
        EventMgr.off(Evt_Matching, this.onCD, this);
        Tween.stopAllByTarget(this.timeLab.node);
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
        EventMgr.emit(Evt_Change_Scene_Bgm);
    }

    private onTouchStart(evt: EventTouch): void {
        this.StartPos = new Vec3(evt.getLocationX(), evt.getLocationY(), 1);
    }

    private onTouchMove(evt): void {
        this.TouchStartPos = new Vec3(evt.getLocationX(), evt.getLocationY(), 1);
        // 获取当前触摸位置
        let currentX = evt.getLocation().x;
        let currentY = evt.getLocation().y;
        // 计算移动距离
        let deltaX = (this.StartPos.x - currentX) * 2;
        let deltaY = (this.StartPos.y - currentY) * 2;
        if (!this.getNodeSpeaceY(this.bg, deltaY)) {
            this.bg.setPosition(this.bg.getPosition().x, this.bg.getPosition().y - deltaY);
        }
        if (!this.getNodeSpeaceX(this.bg, deltaX)) {
            this.bg.setPosition(this.bg.getPosition().x - deltaX, this.bg.getPosition().y);
        }

        // 移动地图
        this.StartPos = new Vec3(evt.getLocationX(), evt.getLocationY(), 1);
    }

    private onTouchEnd(evt): void {
        this.TouchStartPos = null;
    }
    private updateAwardItemLits(item: Node, data: SThing) {
        let awardItem = item.getComponent(BagItem);
        if (!awardItem) awardItem = item.addComponent(BagItem);
        awardItem.SetData(data);
        awardItem.node.getChildByName(`name`).active = false;
        this.scheduleOnce(() => {
            awardItem.node.getComponent(Toggle).enabled = false;
        })
    }

    private async onBtnClick(btn: Button) {
        switch (btn) {
            case this.rankBtn:
                MsgPanel.Show("赛季暂未开始");
                //LootRankPanel.Show();
                break;
            case this.awardPoolBtn:
                MsgPanel.Show("赛季暂未开始");
                break;
            case this.awardBtn:
                MsgPanel.Show("赛季暂未开始");
                //LootAwardPanel.Show();
                break;
            case this.heleBtn:
                Tips2.Show(Tips2ID.HomeLooting);
                break;
            case this.seekBtn:
                if (this.cdTime > 0) return
                if (this.playerData.match_player_data.match_count <= 0) return LootVsBuyNumPanel.ShowTop();
                let data = {
                    type: MsgTypeSend.Matchmaking,
                    data: {}
                }
                Session.Send(data);
                AudioMgr.playSound(LootSoundInfo[LootSoundId.Loot_2], false);
                this.serch.active = true;
                break;
            case this.battleInfoBtn:
                LootLogPanel.Show();
                break;
            case this.buZhenBtn:
                ResourcesPanel.Show(12, 1);
                break;
            case this.addBtn:
                LootVsBuyNumPanel.ShowTop();
                break;
        }
    }

    private onChangeTime() {
        this.challengeNumLab.string = `${PlayerData.LootPlayerData.match_count}次`;
    }

    private onPlayerData(data: { match_player_data: SMatchPlayerData, score: number, rank: number }) {
        this.playerData = data;
        this.roleHomeNameLab.string = PlayerData.roleInfo.name;
        this.powerLab.string = `${PlayerData.roleInfo.battle_power}`;
        this.challengeNumLab.string = `${data.match_player_data.match_count}次`;
        this.homeLvLab.string = `${PlayerData.roleInfo.homelands[0].level}`;
        this.homeNameLab.string = `${PlayerData.roleInfo.name}`;
        this.homeNameLab.updateRenderData();
        this.homeNameBg.width = this.homeNameLab.node.getComponent(UITransform).width + 70;
        let newState:boolean = PlayerData.LootPlayerData.has_shield;
        console.log("掠夺护盾时间---->" + DateUtils.TimestampToDate(PlayerData.LootPlayerData.shield_end_time * 1000, true));
        if(newState != this.shield.active){
            AudioMgr.playSound(LootSoundInfo[LootSoundId.Loot_1], false);
            console.log(`播放抢夺音效---->` + LootSoundInfo[LootSoundId.Loot_1]);
        }
        this.shield.active = PlayerData.LootPlayerData.has_shield;
        this.shieldTime.node.active = PlayerData.LootPlayerData.has_shield;
        this.roleNameLab.string = `Lv.${PlayerData.roleInfo.homelands[0].level}`;
    }

    private onSeasonData(data: SCurrentSeasonInfo) {
        // this.timeLab.string = `剩余时间：${DateUtils.FormatTime(data.end_time - PlayerData.GetServerTime(), "%{d}天%{hh}时%{mm}分%{ss}秒")}`;
        // if (TweenSystem.instance.ActionManager.getNumberOfRunningActionsInTarget(this.timeLab.node) > 0) {
        //     Tween.stopAllByTarget(this.timeLab.node);
        // }
        // tween(this.timeLab.node).repeatForever(tween().delay(1).call(() => {
        //     this.timeLab.string = `剩余时间：${DateUtils.FormatTime(data.end_time - PlayerData.GetServerTime(), "%{d}天%{hh}时%{mm}分%{ss}秒")}`;
        // })).start();

        this.rankLab.string = data.rank == -1 ? `暂无排名` : `${data.rank}`;
        this.pointLab.string = `${data.score}`;

        let datas: SThing[] = PlayerData.GetLootAwardThings(data);
        this.awardList.UpdateDatas(datas);
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
    }

    private getRandomPos() {
        this.bg.setPosition(0, 0)
        this.bg.setScale(new Vec3(this.bgScale, this.bgScale, 1));
        let group = this.ortherHome;
        let listIndex = [];
        group.children.forEach((node, index) => {
            node.active = false;
            listIndex.push(index);
            node.off(Node.EventType.TOUCH_END)
            node.on(Node.EventType.TOUCH_END, async () => {
                if (this.cdTime > 0) return
                if (this.playerData.match_player_data.match_count <= 0) return LootVsBuyNumPanel.Show();
                if (this.TouchStartPos) return;
                let data = {
                    type: MsgTypeSend.Matchmaking,
                    data: {}
                }
                Session.Send(data);
                this.serch.active = true;
            }, this)
        })
        let num = randomI(group.children.length / 2, group.children.length);
        let result = this.getRandomElements(listIndex, num);
        result.forEach((i) => {
            group.children[i].active = true;
        })
    }

    private getRandomElements(arr, num) {
        let result = [];
        let clonedArray = [...arr];
        for (let i = 0; i < num; i++) {
            if (clonedArray.length === 0) break;
            let randomIndex = Math.floor(Math.random() * clonedArray.length);
            result.push(clonedArray[randomIndex]);
            clonedArray.splice(randomIndex, 1);
        }
        return result;
    }

    private getNodeSpeaceY(node: Node, y) {
        // 获取节点在世界空间中的坐标
        let nodePosition = node.position;
        let nodeHeight = node.getComponent(UITransform).height * this.bgScale
        // 获取屏幕大小
        let screenHeight = this.node.getComponent(UITransform).height;

        // 节点顶部和屏幕顶部的位置差值
        let distanceToScreenTop, distanceToScreenBottom;
        distanceToScreenTop = nodeHeight / 2 + nodePosition.y - screenHeight / 2;
        distanceToScreenBottom = nodePosition.y - nodeHeight / 2 + screenHeight / 2;

        // 输出位置差值
        // console.log("节点顶部和屏幕差值Y:", distanceToScreenTop, y);
        let isOut = false;
        if (distanceToScreenTop <= 50 && y > 0) {
            isOut = true;
        }
        if (distanceToScreenBottom >= -50 && y < 0) {
            isOut = true;
        }
        return isOut;
    }

    private getNodeSpeaceX(node: Node, x) {
        // 获取节点在世界空间中的坐标
        let nodePosition = node.position;
        let nodeWidth = node.getComponent(UITransform).width * this.bgScale
        // 获取屏幕大小
        let screenWidth = this.node.getComponent(UITransform).width;

        // 节点顶部和屏幕顶部的位置差值
        let distanceToScreenRight, distanceToScreenLeft;
        distanceToScreenRight = nodeWidth / 2 + nodePosition.x - screenWidth / 2;
        distanceToScreenLeft = nodePosition.x - nodeWidth / 2 + screenWidth / 2;

        // 输出位置差值
        let isOut = false;
        if (distanceToScreenRight <= 50 && x > 0) {
            isOut = true;
        }
        if (distanceToScreenLeft >= -50 && x < 0) {
            isOut = true;
        }
        return isOut;
    }

    protected update(dt: number): void {
        this.nowUpdateTime += dt;
        if (this.nowUpdateTime < 1) return;
        this.nowUpdateTime = 0;
        
        if(Date.now() - PlayerData.LootPlayerData.shield_end_time * 1000 < 0){
            if(!this.shield.active)
            {
                this.shield.active = true;
                this.shieldTime.node.active = true;
            }
            let seconds= PlayerData.LootPlayerData.shield_end_time - Date.now() / 1000;
            this.shieldTime.string = `保护时间：${DateUtils.SecondsToDetailedTime(seconds)}`;
        }
        else
        {
            if(this.shield.active)
            {
                this.shield.active = false;
                this.shieldTime.node.active = false;
            }
        }

    }
}