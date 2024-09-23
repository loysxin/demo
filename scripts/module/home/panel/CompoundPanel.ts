import { _decorator, color, Color, Component, EditBox, EventTouch, Input, Label, math, Node, path, ProgressBar, sp, Sprite, SpriteFrame, tween, UITransform, v3 } from 'cc';
import { Panel } from '../../../GameRoot';
import { GameSet } from '../../GameSet';
import { MsgTypeRet, MsgTypeSend } from '../../../MsgType';
import { Session } from '../../../net/Session';
import PlayerData, { SPlayerDataItem, SThing } from '../../roleModule/PlayerData';
import { CfgMgr, ThingType } from '../../../manager/CfgMgr';
import { HomeUI } from './HomeUI';
import { Tips } from '../../login/Tips';
import { ToFixed, formatNumber, SetLabelColor } from '../../../utils/Utils';
import Logger from '../../../utils/Logger';
import { folder_item, ResMgr } from '../../../manager/ResMgr';
import { RewardTips } from '../../common/RewardTips';
import { CLICKLOCK } from '../../common/Drcorator';
import { RewardPanel } from '../../common/RewardPanel';
import { EventMgr, Evt_Hide_Scene, Evt_Show_Scene } from '../../../manager/EventMgr';
import { AudioMgr } from '../../../manager/AudioMgr';
import { AdaptBgTop } from '../../common/BaseUI';

export class CompoundPanel extends Panel {
    protected prefab: string = 'prefabs/panel/CompoundPanel';
    compoundBtn: Node;
    close: Node;
    count: Label;
    compoundCount: number = 0;
    config: any;
    resItem: Node[] = [];
    allCostLab: number[] = [];
    needCostLab: Label[] = [];
    hasCostLab: Label[] = [];
    maxCount: number;
    private item_icon:Sprite
    private item_need: Label;
    private item_has: Label;
    private qiao_spine:sp.Skeleton
    private item_spine:sp.Skeleton
    private ckickNode:Node;
   
    rock: Label = null;  
    wood: Label = null;   
    water: Label = null;   
    seed: Label = null;
    currency: Label = null;
    // closeCallBack: Function;
    private isClick:boolean = true;

    protected onLoad(): void {
        this.CloseBy('panel/return');
        this.ckickNode = this.find("panel/ckickNode");
        this.rock = this.find('panel/MeansLayout/stone/Label', Label);
        this.wood = this.find('panel/MeansLayout/tree/Label', Label);
        this.water = this.find('panel/MeansLayout/water/Label', Label);
        this.seed = this.find('panel/MeansLayout/seed/Label', Label);
        this.currency = this.find('panel/MeansLayout/currency/Label', Label);
        this.item_icon = this.find('panel/bg/cost/Node/icon', Sprite);
        this.item_need = this.find('panel/bg/cost/Node/count/item_need', Label);
        this.item_has = this.find('panel/bg/cost/Node/count/item_has', Label);
        this.qiao_spine = this.find("panel/bg/ring/qiao_spine",sp.Skeleton);
        this.item_spine = this.find("panel/bg/item_spine",sp.Skeleton);
    }

    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
        this.showMeans();
        this.compoundBtn = this.find('panel/bg/compoundBtn');
        this.compoundBtn.on(Input.EventType.TOUCH_END, this.onCompoundClick, this);
        // this.close = this.find('panel/return');
        // this.close.on(Input.EventType.TOUCH_END, this.Hide, this);
        this.count = this.find('panel/bg/ring/count/Label').getComponent(Label);
        Session.on(MsgTypeRet.ResourceExchangeRet, this.onResourceExchangeRet, this);

        this.compoundCount = PlayerData.roleInfo.resource_exchange_uses || 0;
        this.config = CfgMgr.GetCompound();
        //@ts-ignore
        this.maxCount = Math.max(...Object.keys(this.config))
        this.allCostLab = [];
        this.needCostLab = [];
        this.hasCostLab = [];
        this.resItem = [];
        let item_node = this.item_spine.node.getChildByName("item_node").children;
        for (let index = 0; index < item_node.length; index++) {
            let child = item_node[index];
            // let count = child.getChildByName('count');
            let need = child.getChildByName("need").getComponent(Label);
            let has = child.getChildByName("has").getComponent(Label);
            this.needCostLab.push(need);
            this.hasCostLab.push(has);      
            this.resItem.push(child);
        }
        this.check();
    }

    showMeans() {
        let res = PlayerData.resources;
        this.rock.string = formatNumber(res.rock, 2);
        this.wood.string = formatNumber(res.wood, 2);
        this.water.string = formatNumber(res.water, 2);
        this.seed.string = formatNumber(res.seed, 2);
        this.currency.string = ToFixed(PlayerData.roleInfo.currency, 2);
    }

    public flush(...args: any[]) {
        // this.closeCallBack = args[0];
        AdaptBgTop(this.node.getChildByPath("panel/bg1"));
    }
    protected onHide(...args: any[]): void {
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
        // this.closeCallBack && this.closeCallBack();
    }

    protected update(dt: number): void {

    }

   async check() {
        this.ckickNode.active = false;
        Logger.log(this.compoundCount + 1 > this.maxCount ? this.maxCount : this.compoundCount + 1)
        let info = this.config[this.compoundCount + 1 > this.maxCount ? this.maxCount : this.compoundCount + 1];

        let wood = info.WoodNum;
        let rock = info.RockNum;
        let seed = info.SeedNum;
        let water = info.WaterNum;

        this.count.string = info.Money;
        let res = PlayerData.resources;
        this.allCostLab = [];
        for (let index = 0; index < this.resItem.length; index++) {
            let resCount = 0;
            switch (index) {
                case 0:
                    resCount = res.rock ;
                    break;
                case 1:
                    resCount = res.water;
                    break;
                case 2:
                    resCount = res.wood;
                    break;
                case 3:
                    resCount = res.seed;
                    break;

                default:
                    break;
            }
            this.allCostLab.push(resCount);
        }

        for (let index = 0; index < this.needCostLab.length; index++) {
            let need = this.needCostLab[index];
            let all = this.allCostLab[index];
            let count = 0;
            switch (index) {
                case 0:
                    count = rock;
                    break;
                case 1:
                    count = water;        
                    break;
                case 2:
                    count = wood;
                    break;
                case 3:    
                    count = seed;
                    break;

                default:
                    break;
            }
            this.needCostLab[index].string = `/${formatNumber(count,2)}`;
            this.hasCostLab[index].string = `${formatNumber(all,2)}`;
            all >= count ? this.hasCostLab[index].color = new Color().fromHEX('7AFF45') : this.hasCostLab[index].color = new Color().fromHEX('FF4A4A');
        }

        let std = CfgMgr.Getitem(info.ItemId)
        this.item_icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_item, std.Icon, "spriteFrame"), SpriteFrame);
        let item_all = PlayerData.GetItemCount(info.ItemId)
        this.item_need.string = "/" + info.Cost;
        this.item_has.string =  item_all + "";
        SetLabelColor(this.item_has, item_all, info.Cost, "7AFF45", "FF4A4A" );
    }

    /**合成 */
    @CLICKLOCK(1)
    onCompoundClick() {  
        if(this.isClick){
            let compoundCount = this.compoundCount + 1 > this.maxCount ? this.maxCount : this.compoundCount + 1;
            let cfg = this.config[compoundCount]
            if(!cfg) return;
            let res = PlayerData.resources;
            let count = PlayerData.GetItemCount(cfg.ItemId);
            if(res.wood >= cfg.WoodNum && res.rock >= cfg.RockNum && res.seed >= cfg.SeedNum && res.water >= cfg.WaterNum &&  count >= cfg.Cost){
                this.isClick = false;
                this.ckickNode.active = true;
                tween(this.item_spine)
                .call(()=>{
                    AudioMgr.playSound("compound_compound", false);
                    this.item_spine.setAnimation(0,"Start",false);
                })
                .delay(1.57)
                .call(()=>{
                    this.qiao_spine.setAnimation(0,"Start",false)
                    this.qiao_spine.setTrackCompleteListener(this.qiao_spine.setAnimation(0,"Start",false), this.showSpineEffect.bind(this))
                })
                .start()  
            }else{
                Tips.Show("道具数量不足")
            }
        }
       
    }

    private showSpineEffect(){
        let callback = ()=>{
            let compoundCount = this.compoundCount + 1;
            let sendData = {
                type: MsgTypeSend.ResourceExchange,
                data: {
                    exchange_count: compoundCount,
                }
            }
            Session.Send(sendData,MsgTypeRet.ResourceExchangeRet);
            this.compoundBtn.off(Input.EventType.TOUCH_END);
        }
        tween(this.compoundBtn)
        .call(callback)
        .delay(0.1)
        .call(()=>{this.compoundBtn.on(Input.EventType.TOUCH_END, this.onCompoundClick, this);})
        .start()
    }

    onResourceExchangeRet(data) {
        Logger.log('data', data);
        this.isClick = true;
        this.qiao_spine.setAnimation(0,"Idle",true)
        this.item_spine.setAnimation(0,"Idle",true);
        let money = Number(this.count.string);
        let info:SThing[] = [{
            type: ThingType.ThingTypeCurrency, 
            currency: {type:0, value:money},
        }]
        let update = ()=>{
            let count = data.updated_count;
            PlayerData.updateCompoundCount(count);
            this.compoundCount = count;
            // PlayerData.roleInfo.currency += money;
            HomeUI.Flush();
            this.check();
            this.showMeans();
        }

        let callBack1 = ()=>{
            update();
        }

        let callBack2 = ()=>{
            update();
            this.onCompoundClick();
        }
        RewardPanel.Show(info, callBack1, callBack2)
    }

}


