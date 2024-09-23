import { Input, Node, Sprite, SpriteFrame, Tween, instantiate, path, tween, v3 } from "cc";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { CfgMgr, MessagId, ThingType } from "../../manager/CfgMgr";
import { EventMgr, Evt_Building_Action, Evt_Building_Complete, Evt_EnterHome, Evt_Item_Change, Evt_Production_JiaSu, Evt_Production_Update } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { GameSet } from "../GameSet";
import { HomeScene } from "../home/HomeScene";
import { BuildingType } from "../home/HomeStruct";
import PlayerData, { FightState, SPlayerDataItemProduction, SThing } from "../roleModule/PlayerData";
import { ProductionPanel } from "./ProductionPanel";
import { PI2, Second } from "../../utils/Utils";
import { ResMgr } from "../../manager/ResMgr";
import TimerMgr from "../../utils/TimerMgr";
import { HomeUI } from "../home/panel/HomeUI";
import { RewardTips } from "../common/RewardTips";
import { ItemUtil } from "../../utils/ItemUtils";

export class ProductionModule {
    constructor() {
        Session.on(MsgTypeRet.ItemProductionRet, this.onProduct, this);
        Session.on(MsgTypeRet.ItemProductionFinishRet, this.onFinish, this);

        // GameSet.RegisterUpdate(this.update, this);
        EventMgr.on(Evt_Building_Complete, this.onFlushProduction, this);
        EventMgr.on(Evt_Production_Update, this.flushStates, this);
        EventMgr.on(Evt_Production_JiaSu, this.onProductionJiaSu, this);
    }

    protected onFlushProduction(buildingId: number, buildingType: number) {
        if (buildingType == BuildingType.sheng_chan) {
            this.flushStates();
        }
    }

    onProduct(data: { player_data_item_production: SPlayerDataItemProduction }) {
        PlayerData.UpdateItemProduction(data.player_data_item_production);
        this.addProductionCompleteTime(data.player_data_item_production);
        ProductionPanel.Flush();
        // EventMgr.emit(Evt_Production_Update);
        this.flushStates();
    }
    
    //ids 选中的id new_ids获得道具id counts获得道具数
    onFinish(data: { ids: number[], new_ids:number[], counts:number[] }) {
       
        let reward_data = [];
        let newIds = data.new_ids||[];
        for (let index = 0; index < newIds.length; index++) {
            let is_has = false
            const element = newIds[index];
            for (let i = 0; i < PlayerData.items.length; i++) {
                let item = PlayerData.items[i];
                if (item.id == element) {
                    item.count += data.counts[index];
                    is_has = true;
                    break;
                }
            }
            // HomeUI.Flush();
            if(!is_has){
                PlayerData.items.push({ id: element, count: data.counts[index], isNew: true });
                EventMgr.emit(Evt_Item_Change);
            }
            let newItem:SThing = ItemUtil.CreateThing(ThingType.ThingTypeItem, element, data.counts[index]);
            reward_data.push(newItem)
        }
        RewardTips.Show(reward_data);
        PlayerData.FinishItemProduction(data.ids);
        ProductionPanel.Flush();
        this.flushStates();
    }
    public updateProdData(prodData: SPlayerDataItemProduction): void {
        this.onProduct({ player_data_item_production: prodData });
    }
    // private tick: number = 0;
    // update(dt: number) {
    //     this.tick += dt;
    //     if (this.tick >= 1) this.tick = 0;
    //     if (!PlayerData.roleInfo || !PlayerData.roleInfo.item_productions) return;
    //     // EventMgr.emit(Evt_Production_Update);
    //     if (this.tick == 0) this.flushStates();
    // }

    /**
     * 更新所有生产状态
     * @returns 
     */
    protected async flushStates() {
        // console.log("flushProduction");
        let homeId = PlayerData.RunHomeId;
        let defs = CfgMgr.GetBuildingDefine(homeId, BuildingType.sheng_chan);
        if (!defs.length || PlayerData.fightState == FightState.PvP) return;
        let tick = Number.MAX_SAFE_INTEGER;
        let producings = {};//生产中
        for (let stdDef of defs) {
            if (!producings[stdDef.BuildingId]) producings[stdDef.BuildingId] = false;
            if (PlayerData.GetBuilding(stdDef.BuildingId, homeId)) {
                let stds = CfgMgr.GetProductions(stdDef.BuildingId);
                for (let std of stds) {
                    if (PlayerData.CheckCondition(homeId, std.ConditionID, std.ConditionValue)) {
                        let info = PlayerData.GetProductionState(std.ID);
                        if (info && info.finish_time > PlayerData.GetServerTime()) {
                            producings[std.BuildingId] = info.finish_time;
                            tick = Math.min(info.finish_time - PlayerData.GetServerTime(), tick);
                        }
                    }
                }
            }
            let building = await HomeScene.ins.GetBuilding(stdDef.BuildingId);
            let seed = building.seed;
            let qipao = building.find("qipao")
            building.HideSub.then(now => {
                if (seed != now || !qipao) return;
                for (let child of qipao.children) {
                    child.active = false;
                }
                qipao.off(Input.EventType.TOUCH_END);
            })
            let ids = PlayerData.GetProductionIds(stdDef.BuildingId);
            ids.sort((a, b) => { return a - b });// 排序
            qipao.off(Input.EventType.TOUCH_END);
            if (ids.length <= 0) {
                Tween.stopAllByTarget(qipao);
                qipao.active = false;
            } else {
                if (!qipao.active) {
                    qipao.active = true;
                }
                
                qipao.on(Input.EventType.TOUCH_END, e => {
                    // for (let id of ids) {
                        let data = {
                            type: MsgTypeSend.ItemProductionFinish,
                            data: {
                                ids: ids
                            }
                        }
                        Session.Send(data);
                    }
                // }
                , this);
                let children = qipao.children;
                children.forEach(value => { value.active = false; });
                for (let i = 0; i < ids.length; i++) {
                    let id = ids[i];
                    let std = CfgMgr.GetProduction(id);
                    let stdItem = CfgMgr.Getitem(std.ItemID);
                    let icon = children[i]
                    if (!icon) {
                        icon = instantiate(children[0]);
                        qipao.addChild(icon);
                    }
                    if (ids.length == 1) {
                        icon.setPosition(0, 0);
                        icon.setScale(1, 1);
                    } else {
                        let scale = Math.max(0.2, 1 - ids.length * 0.1);
                        icon.setScale(scale, scale);
                        let r = 60 * scale;
                        let rad = PI2 / ids.length * i;
                        icon.setPosition(r * Math.cos(rad), r * Math.sin(rad));
                    }
                    icon.active = true;
                    ResMgr.LoadResAbSub(path.join("sheets/items", stdItem.Icon, "spriteFrame"), SpriteFrame, res => {
                        icon.getComponent(Sprite).spriteFrame = res;
                    });
                }
            }
        }
        for (let k in producings) {
            if (producings[k]) {
                EventMgr.emit(Evt_Building_Action, Number(k), "Idle");
            } else {
                EventMgr.emit(Evt_Building_Action, Number(k), "Idle_Empty");
            }
            break;
        }
        if (tick != Number.MAX_SAFE_INTEGER) {
            // console.log("flushProduction", tick * 1000);
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(this.flushStates.bind(this), tick * 1000);
        }
    }
    private timeout: any;
    private onProductionJiaSu(data: SPlayerDataItemProduction): void {
        this.addProductionCompleteTime(data);
    }
    /**
     * 添加生产工厂生产完成系统频道消息
     * @param data 
     */
    private addProductionCompleteTime(data: SPlayerDataItemProduction): void {
        let funName: string = `OnProductionTimeComplete_${data.id}_${data.item_id}`;
        let completeCb: Function = this[funName];
        if (!completeCb) {
            completeCb = () => {
                //console.log(std.remark + "建造完成")
                PlayerData.AddChannelMsg(MessagId.Messag_21);
            };
            this[funName] = completeCb;

        }
        TimerMgr.Register(completeCb, this, data.finish_time);
    }
}