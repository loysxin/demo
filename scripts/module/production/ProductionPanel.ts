import { Color, ColorKey, Input, Label, Node, Slider, Sprite, SpriteFrame, Toggle, Tween, UITransform, Vec3, easing, game, instantiate, path, random, sp, tween, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { BaseNavPage } from "../home/panel/BaseNavPage";
import { CardQuality, CfgMgr, StdProduction, ThingItemId } from "../../manager/CfgMgr";
import { ResMgr, folder_icon, folder_item, folder_quality, quality_color } from "../../manager/ResMgr";
import { Convert, CycleTween, TowardDeg, formatNumber, formatTime, maxx, minn, randomI, randomf, towardRad } from "../../utils/Utils";
import PlayerData, { BoostType, SPlayerDataItemProduction, SThing } from "../roleModule/PlayerData";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { Tips } from "../login/Tips";
import { Evt_Building_Upgrade_Complete, EventMgr, Evt_Item_Change, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import Logger from "../../utils/Logger";
import { BoostPanel } from "../home/panel/BoostPanel";
import { ItemTips } from "../common/ItemTips";
import { AudioMgr } from "../../manager/AudioMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import { MsgPanel } from "../common/MsgPanel";
import { AdaptBgTop, SetNodeGray } from "../common/BaseUI";

export class ProductionPanel extends Panel {
    protected prefab: string = "prefabs/panel/ProductionPanel";

    private buildingId: number;
    private page1: Node;
    private page2: Node;
    private page3: Node;
    private scroller: AutoScroller;
    private slider: Slider;
    private selectId: number;
    private selectCount = 0;
    private selectStd: StdProduction;
    private selector: Node;
    private progress: Node;
    private top:Node;
    private rewardIcon:Node;
    private odd:Node;
    private even:Node;
    private effectNode:Node;
    private item_eff:Node;
    private bomb_eff:sp.Skeleton;
    private light_eff:sp.Skeleton;
    private floor_eff:sp.Skeleton;
    private stdlst: StdProduction[] = [];

    private max_count:number;
    private is_can_click:boolean = true;
    private is_change_item:boolean = true;
    private select_index:number;

    protected onLoad(): void {
        this.CloseBy("closeBtn");
        this.top = this.find("top");
        this.rewardIcon = this.find("top/rewardIcon");
        this.odd = this.find("top/odd");
        this.even = this.find("top/even");

        this.scroller = this.find("common/itemLay", AutoScroller);
        this.scroller.SetHandle(this.updateItem.bind(this));
        this.scroller.node.on("select", this.onSelect, this);
        this.find("common/left").on(Input.EventType.TOUCH_END, this.onLeft, this);
        this.find("common/right").on(Input.EventType.TOUCH_END, this.onRight, this);
        this.page1 = this.find("page1");
        this.page2 = this.find("page2");
        this.page3 = this.find("page3");
        this.progress = this.find("page1/Slider/progress");
        this.slider = this.find("page1/Slider", Slider);
        this.slider.node.on('slide', this.onSlide, this);

        this.find("page1/right").on(Input.EventType.TOUCH_START, this.onAddStart, this);
        this.find("page1/left").on(Input.EventType.TOUCH_START, this.onDelStart, this);
        this.find("page1/right").on(Input.EventType.TOUCH_END, this.onAdd, this);
        this.find("page1/left").on(Input.EventType.TOUCH_END, this.onDel, this);
        this.find("page1/right").on(Input.EventType.TOUCH_CANCEL, this.onAdd, this);
        this.find("page1/left").on(Input.EventType.TOUCH_CANCEL, this.onDel, this);
        this.find("page1/btn").on(Input.EventType.TOUCH_END, this.onProduct, this);
        this.find("page2/btn").on(Input.EventType.TOUCH_END, this.onFinish, this);
        this.find("page3/btn").on(Input.EventType.TOUCH_END, this.onFast, this);
        this.effectNode = this.find("top/effectNode");
        this.item_eff = this.find("top/effectNode/item_eff");
        this.bomb_eff = this.find("top/bomb_eff",sp.Skeleton);
        this.light_eff = this.find("top/light_eff",sp.Skeleton);
        this.floor_eff = this.find("common/floor_eff",sp.Skeleton);
        EventMgr.on(Evt_Building_Upgrade_Complete, this.updateLv, this);
        EventMgr.on(Evt_Item_Change, this.onItemChange, this);
    }

    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    public flush(buildingId?: number): void {
        if (buildingId != undefined) this.buildingId = buildingId;
        if (this.buildingId == undefined) return;
        AdaptBgTop(this.node.getChildByPath("bg"));
        this.is_can_click = true;
        this.updateLv();
        if (buildingId != undefined) {
            this.selectId = undefined;
            this.scroller.SelectFirst();
        } else {
            for (let i = 0; i < this.stdlst.length; i++) {
                if (this.stdlst[i].ID == this.selectId) {
                    this.selectId = undefined;
                    this.onSelect(i, this.selector, false);
                    break;
                }
            }
        }
    }

    private updateLv() {
        this.stdlst = [];
        let stdlst = CfgMgr.GetProductions(this.buildingId);
        for (let std of stdlst) {
            let homeId = CfgMgr.Get("homeland_building")[std.BuildingId].HomeId;
            if (PlayerData.CheckCondition(homeId, std.ConditionID, std.ConditionValue)) {
                this.stdlst.push(std);
            }
        }
        this.scroller.UpdateDatas(this.stdlst);
    }

    private async updateItem(item: Node, data: StdProduction, index:number) {
        // Logger.log("updateitem", item, data);
        item.getChildByName("select").active = index == this.select_index;
        let quality = item.getChildByName("quality").getComponent(Sprite);
        let icon = item.getChildByName("icon").getComponent(Sprite);
        let std = CfgMgr.Getitem(data.ItemID)
        quality.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, CardQuality[std.Quality] + "_bag_bg", "spriteFrame"), SpriteFrame);
        icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_item, std.Icon, "spriteFrame"), SpriteFrame);
        let item_name = item.getChildByName("item_name").getComponent(Label);
        item_name.string = (std.ItemName);
        item_name.color = new Color().fromHEX(quality_color[std.Quality]);
    }

    private async onSelect(index: number, item: Node, updateSlider: boolean = true) {
        if(!this.is_change_item) return;
        for (let i = 0; i < this.scroller.children.length; i++) {
            const element = this.scroller.children[i];
            if(index == element["$$index"]){
                element.getChildByName("select").active = true;
                this.select_index = element["$$index"];
            }else{
                element.getChildByName("select").active = false;
            }
       }
        this.startAdd = Number.MAX_SAFE_INTEGER;
        this.startDel = Number.MAX_SAFE_INTEGER;
        this.selectStd = this.stdlst[this.select_index];
        if (this.selectId == this.selectStd.ID) return;
        let state = PlayerData.GetProductionState(this.selectStd.ID);
        this.selectId = this.selectStd.ID;
        if (state) {
            this.selectCount = state.count;
        } else {
            this.selectCount = 1;
        }
        // if (this.selector) {
        //     this.selector.getChildByName("select").active = false;
        // }
        this.selector = item;
        // if (this.selector) {
        //     this.selector.getChildByName("select").active = true;
        // }

        this.updateNeedItem();
        let stditem2 = CfgMgr.Getitem(this.selectStd.ItemID);
        let rewardIcon = this.find("top/rewardIcon", Sprite);
        rewardIcon.node.off(Input.EventType.TOUCH_START);
        rewardIcon.node.on(Input.EventType.TOUCH_START, () => { ItemTips.Show(stditem2) }, this)
        rewardIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join("sheets/items", stditem2.Icon, "spriteFrame"), SpriteFrame);

      
        this.updateCount();
        this.updateProgress();
        this.flushPage();
    }

    private updateNeedItem(){
         // let costList = this.selectStd.CostItemID;
         let consumeList:SThing[] = ItemUtil.GetSThingList(this.selectStd.CostType, this.selectStd.CostItemID, this.selectStd.Num);
        
         //判断消耗道具的数量是奇数还是偶数
         let is_odd = (consumeList.length % 2) != 0
         this.odd.active = is_odd;
         this.even.active = !is_odd
         this.max_count = Number.MAX_SAFE_INTEGER
         let set_data = (node, index)=>{
             let sThing:SThing = consumeList[index];
             if(sThing){
                 let has = ItemUtil.GetHaveThingNum(sThing.type, sThing.item.id); 
                 let count = Math.floor(has / sThing.item.count);
                 //能合成的最大数量
                 this.max_count =  (count > this.max_count) ? this.max_count : count
             }
         }
 
         let set_item = async (node, index)=>{
             let sThing:SThing = consumeList[index];
             let itemNode:Node = node.children[index];
             if(sThing){
                 itemNode.active = true;
                 let cost_item = CfgMgr.Getitem(sThing.item.id);
                 let icon = itemNode.getChildByName("costIcon").getComponent(Sprite);
                 icon.node.off(Input.EventType.TOUCH_START);
                 icon.node.on(Input.EventType.TOUCH_START, () => { ItemTips.Show(cost_item) }, this)
                 icon.spriteFrame = await ResMgr.LoadResAbSub(sThing.resData.iconUrl, SpriteFrame);
             }else{
                 itemNode.active = false;
             }
         }
 
         let set_eff = async(node, index, height)=>{    
             let p = node.children[index].position;
             let [x, y] = Convert(p.x, p.y, node.parent, this.top);
             let sThing:SThing = consumeList[index];
             if(sThing){
                 let item = instantiate(this.item_eff)
                 item.active = false;
                 this.effectNode.addChild(item)
                 let cost_item = CfgMgr.Getitem(sThing.item.id);
                 let icon = item.getChildByName("costIcon").getComponent(Sprite);
                 icon.spriteFrame = await ResMgr.LoadResAbSub(sThing.resData.iconUrl, SpriteFrame);
                 let posx = x;
                 let posy = y - height - 20;
                 item.setPosition(posx, posy);   
                 let b = Math.atan2( posx - this.rewardIcon.position.x, posy - this.rewardIcon.position.y) * (180 / Math.PI)     
                 item.angle = b ;
             }
 
         }
         this.effectNode.removeAllChildren()
         if(is_odd){
             let height = this.odd.getComponent(UITransform).height / 2
             let count = this.odd.children
             for (let index = 0; index < count.length; index++) {
                 set_data(this.odd, index);
                 set_item(this.odd, index);
                 set_eff(this.odd, index, height);
                 
             }
         }else{
             let height = this.even.getComponent(UITransform).height / 2
             let count = this.even.children
             for (let index = 0; index < count.length; index++) {
                 set_data(this.even, index);
                 set_item(this.even, index);
                 set_eff(this.even, index, height);
             }
         }
 
         this.slider.enabled = this.max_count > 0;
         this.updateCount();
    }
    private onLeft() {
        this.scroller.ScrollPrev();
    }
    private onRight() {
        this.scroller.ScrollNext();
    }

    private startAdd = Number.MAX_SAFE_INTEGER;
    private onAddStart() {
        this.startAdd = game.totalTime;
        this.startDel = Number.MAX_SAFE_INTEGER;
    }
    private onAdd(e?: any) {
        if (this.selectId == undefined || this.max_count == 0) return;
        if (e) this.startAdd = Number.MAX_SAFE_INTEGER;
        let std = CfgMgr.GetProduction(this.selectId);   
        let Limit = minn(this.max_count, std.Limit);
        this.selectCount = minn(this.selectCount + 1, Limit);
        this.slider.progress = this.selectCount / Limit;
        this.updateCount();
        this.updateProgress();
    }

    private startDel = Number.MAX_SAFE_INTEGER;
    private onDelStart() {
        this.startDel = game.totalTime;
        this.startAdd = Number.MAX_SAFE_INTEGER;
    }
    private onDel(e?: any) {
        if (this.selectId == undefined || this.max_count == 0) return;
        if (e) this.startDel = Number.MAX_SAFE_INTEGER;
        let std = CfgMgr.GetProduction(this.selectId);  
        let Limit = minn(this.max_count, std.Limit);
        this.selectCount = maxx(this.selectCount - 1, 1);
       
        this.slider.progress = this.selectCount / Limit;
        this.updateCount();
        this.updateProgress();
    }

    private onSlide(e?: Slider) {
        if (this.selectId == undefined || this.max_count == 0) return;
        let std = CfgMgr.GetProduction(this.selectId);
        let Limit = minn(this.max_count, std.Limit);
        this.selectCount = minn(Limit, Math.ceil(Limit * this.slider.progress));
        if (this.selectCount < 1) {
            this.selectCount = 1;
        }
        this.slider.progress = this.selectCount / Limit;
        this.updateCount();
        this.updateProgress();
    }

    private updateCount() { 
        let duration = this.selectStd.Time * this.selectCount;
        let getNum = 0;
        let state = PlayerData.GetProductionState(this.selectId);
        if (state) {
            let lesstime = maxx(state.finish_time - PlayerData.GetServerTime(), 0);
            getNum = Math.round(this.selectCount * Math.max(0, 1 - lesstime / duration));
        }

        this.find("top/numbg/count", Label).string = getNum + "/" + this.selectCount;
        this.find("page1/needTime", Label).string = formatTime(duration);
        let consumeList:SThing[] = ItemUtil.GetSThingList(this.selectStd.CostType, this.selectStd.CostItemID, this.selectStd.Num);
        let is_odd = (consumeList.length % 2) != 0
        let set_cost_lbl = (node,index)=>{
            let sThing:SThing = consumeList[index];
            let hasLab = node.children[index].getChildByPath("cost/has").getComponent(Label);
            let needlab = node.children[index].getChildByPath("cost/need").getComponent(Label);
            let need = sThing.item.count * this.selectCount;
            let has = ItemUtil.GetHaveThingNum(sThing.type, sThing.item.id); 
            if (has < need) {     
                hasLab.color = new Color().fromHEX('#FF0000');
            } else {
                hasLab.color = new Color().fromHEX("#A4FF77");
            }
            //console.log("6costList.length", has, need)
            hasLab.string = `${ThingItemId[sThing.item.id] ? formatNumber(has, 2) : has}`;
            needlab.string = `${ThingItemId[sThing.item.id] ? formatNumber(need, 2) : need}`;
        }
        if(is_odd){
            //console.log("1costList.length", costList.length)
            for (let index = 0; index < consumeList.length; index++) {
                //console.log("2costList.length", costList[index],index)
                set_cost_lbl(this.odd, index);     
            }
        }else{
            //console.log("3costList.length", costList.length)
            for (let index = 0; index < consumeList.length; index++) {
                //console.log("4costList.length", costList[index],index)
                set_cost_lbl(this.even, index);
            }
        }

        let btn = this.find("page1/btn");
        if ( this.max_count == 0) {
            btn.off(Input.EventType.TOUCH_END);
            SetNodeGray(btn,true);
            // btn.getChildByName("unabled").active = true;
            // btn.getChildByName("label").getComponent(Label).color = new Color().fromHEX('#114D64')
        } else {
            btn.on(Input.EventType.TOUCH_END, this.onProduct, this);
            SetNodeGray(btn,false);
            // btn.getChildByName("unabled").active = false;
            // btn.getChildByName("label").getComponent(Label).color = new Color().fromHEX('#1880A8')
        }
    }

    private updateProgress(){
        let Limit = minn(this.max_count, this.selectStd.Limit);
        if(Limit != 0 ){
            this.slider.progress = this.selectCount / Limit;
        }else{
            this.slider.progress = 0;
        }
    }

    private flushPage() {
        if (this.selectId == undefined) return;
        let state = PlayerData.GetProductionState(this.selectId);
        this.page1.active = false;
        this.page2.active = false;
        this.page3.active = false;
        this.light_eff.node.active = false;
        this.floor_eff.node.active = false;
        if (state) {
            if (state.finish_time <= PlayerData.GetServerTime()) {
                this.bomb_eff.node.active = false;
                this.light_eff.node.active = false;
                this.floor_eff.node.active = false;
                this.page2.active = true;
                this.is_can_click = true;
            } else {
                this.light_eff.node.active = true;
                this.floor_eff.node.active = true;
                this.page3.active = true;
            }
        } else {
            this.page1.active = true;
        }

            
    }
    private onProduct() {     
        let callback1 = ()=>{ 
            this.is_can_click = false;
            this.is_change_item = false;
            AudioMgr.playSound("production", false);
            for (let index = 0; index < this.effectNode.children.length; index++) {
                const element = this.effectNode.children[index];
                element.active = true;
                element.getComponent(sp.Skeleton).setAnimation(0, "animation", true)
                tween(element)
                .to(1,{position:new Vec3(0, -60, 0)},{easing:easing.circIn})
                .call(callback2)
                .start()
            }
        }

        let callback2 = (item)=>{
            item.active = false;     
        }

        let callback3 = ()=>{
            this.bomb_eff.node.active = true;
            this.light_eff.node.active = true;
            this.floor_eff.node.active = true;
            this.bomb_eff.setAnimation(0,"animation",false);
            this.light_eff.setAnimation(0,"animation",true);
            this.floor_eff.setAnimation(0,"animation",true);
        }

        let callback4 = ()=>{
            let data = {
                type: MsgTypeSend.ItemProduction,
                data: {
                    building_id: this.buildingId,
                    id: this.selectId,
                    count: this.selectCount
                }
            }
            Session.Send(data);
            this.is_change_item = true;
        }
       
        let t1 = tween(this.node)
                .call(callback1)

        let t2 = tween(this.node)
                .delay(1)
                .call(callback3)
                .call(callback4)

        if(this.is_can_click){
            let btn = this.find("page1/btn");
            tween(btn)
            .sequence(t1,t2)
            .start()
        }
    }
    private onFast() {
        let state = PlayerData.GetProductionState(this.selectId);
        if (!state) {
            return;
        }
        //item.getChildByName("countBg").active = true;
        //let lesstime = maxx(state.finish_time - PlayerData.GetServerTime(), 0);
        let startTime: number = state.finish_time - this.selectStd.Time * this.selectCount;
        if(!PlayerData.CheckAddTimeItem()){
            MsgPanel.Show(CfgMgr.GetText("tips_1"));
            return;
         }
        BoostPanel.Show(this.selectId, BoostType.BoostTypeItemProduction, startTime, state.finish_time);
    }
    private onFinish() {
        if (this.selectId != undefined) {
            let data = {
                type: MsgTypeSend.ItemProductionFinish,
                data: {
                    ids: [this.selectId]
                }
            }
            Session.Send(data);
        } else {
            Tips.Show("请选择已完成的生产");
        }
    } 
    private onItemChange() {
        this.startAdd = Number.MAX_SAFE_INTEGER;
        this.startDel = Number.MAX_SAFE_INTEGER;
        if(this.is_change_item){
            this.updateNeedItem();
        }
    }

    protected update(dt: number): void {

        let size = this.slider.node.getComponent(UITransform).contentSize;
        this.progress.getComponent(UITransform).setContentSize(this.slider.progress * size.width, 28);

        let state = PlayerData.GetProductionState(this.selectId);
        if (state) {
            let lesstime = maxx(state.finish_time - PlayerData.GetServerTime(), 0);
            let label = this.page3.getChildByName("countDown").getComponent(Label);
            label.string = formatTime(lesstime);
            if (lesstime <= 0) {
                this.flushPage();
            }
            this.updateCount();
            this.updateProgress();
        }
        if (this.stdlst) {
            let children = this.scroller.children;
            for (let i = 0; i < children.length; i++) {
                let item = children[i];
                let index = item['$$index'];
                let std = this.stdlst[index];
                if (!std) continue;
                let timeLaber = item.getChildByPath("countBg/countDown").getComponent(Label);
                let canGet = item.getChildByPath("countBg/canGet");
                let state = PlayerData.GetProductionState(std.ID);
                if (!state) {
                    item.getChildByName("countBg").active = false;
                    continue;
                }
                item.getChildByName("countBg").active = true;
                let lesstime = maxx(state.finish_time - PlayerData.GetServerTime(), 0);
                if (lesstime <= 0) {
                    canGet.active = true;
                    timeLaber.node.active = false;
                } else {
                    canGet.active = false;
                    timeLaber.node.active = true;
                    timeLaber.string = formatTime(lesstime);
                }
            }
        }

        let t = game.totalTime;
        if (t - this.startAdd > 200) this.onAdd();
        if (t - this.startDel > 200) this.onDel();
    }

    protected onClose(): void {
        // if (this.selector) {
        //     this.selector.getChildByName("select").active = false;
        // }
        this.selector = undefined;
        // let target = this.find("common/qipao/rewardIcon");
        // if (target) {
        //     Tween.stopAllByTarget(target);
        // }
        this.Hide();
    }

    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }
}

