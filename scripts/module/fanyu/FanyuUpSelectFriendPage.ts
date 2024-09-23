import { Color, Input, Label, Node, Slider, Sprite, SpriteFrame, Toggle, Tween, UITransform, game, path, random, tween, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { Tips } from "../login/Tips";
import { AutoScroller } from "../../utils/AutoScroller";
import { Second } from "../../utils/Utils";
import { FanyuUpSelectFriendItem } from "./FanyuUpSelectFriendItem";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { EventMgr, Evt_GetDownLineInfo, Evt_GetRandomDownline } from "../../manager/EventMgr";
import { SDownlineInfo, SFriendSortType, SGetDownlines } from "../roleModule/PlayerData";

export class FanyuUpSelectFriendPage extends Panel {
    protected prefab: string = "prefabs/panel/fanyu/FanyuUpSelectFriendPage";

    protected tile: Label;
    private sussLabel: Label;
    protected scroller: AutoScroller;

    protected type: number = 0;
    protected limit = 0;
    private friendsRate = 0;

    protected callback: Function;
    protected datas: {info: SDownlineInfo, select: boolean, sussNum: number, isend:boolean }[] = [];

    private page:number = 1;
    private page_size:number = 10;
    private ishas:boolean = false;
    private ActivityValue:number;
    protected onLoad() {
        this.CloseBy("mask");
        this.CloseBy("panel/closeBtn");
        // this.tile = this.find("tileBar/buildName", Label);
        this.sussLabel = this.find("panel/Node/sussLabel", Label);
        this.scroller = this.find("panel/ScrollView", AutoScroller);
        this.scroller.SetHandle(this.updateItem.bind(this));
        this.scroller.node.on('select', this.onSelect, this);
        this.find("panel/okBtn").on(Input.EventType.TOUCH_END, this.onOk, this);
        // this.find("panel/closeBtn").on(Input.EventType.TOUCH_END, this.Hide, this);
    }

    protected onShow(): void {
        this.page = 1;
        EventMgr.on(Evt_GetRandomDownline, this.updateFriendData, this);
        this.onSend();
       
    }

    flush(playerCount: number, friendsRate: number, ActivityValue:number, callBack: Function) {
        this.callback = callBack;
        this.limit = playerCount;
        this.friendsRate = friendsRate;
        this.sussLabel.string = "0%";
        this.ActivityValue = ActivityValue;
    }


    private onSend() {
        let data = {
            type: MsgTypeSend.GetDownlinesRequest,
            data: { page: this.page, page_size: this.page_size, sort_type: SFriendSortType.SortDailyActivityDesc, SearchPlayerID: "", include_role: false }
        }
        Session.Send(data);
    }


    private updateFriendData(data: SGetDownlines) {
        let datas: SDownlineInfo[] = data.downlines;
        for (const iterator of datas) {
            if(iterator.is_upline && !this.ishas){
                let _data = {
                    info:iterator,
                    select:false,
                    sussNum:this.friendsRate,
                    isend:false,
                }
                this.datas.push(_data)
                this.ishas = true
            }else{
                if(!iterator.is_upline){
                    let _data = {
                        info:iterator,
                        select:false,
                        sussNum:this.friendsRate,
                        isend:false,
                    }
                    this.datas.push(_data)
                }
            }

        }
        this.scroller.node.off("scrolling")
        this.scroller.UpdateDatas(this.datas);
    }



    protected updateItem(item: Node, data:{info: SDownlineInfo, select: boolean, sussNum: number, isend:boolean}) {
        let itemNode = item.getComponent(FanyuUpSelectFriendItem);
        if (!itemNode) itemNode = item.addComponent(FanyuUpSelectFriendItem);
        itemNode.setData(data,  this.ActivityValue);
        this.checkPage(data);
    }

    protected onOk() {
        let ls = this.scroller.children;
        let selects = [];
        for (let obj of ls) {
            if (obj.getComponent(Toggle).isChecked) {
                let role = this.datas[obj['$$index']];
                selects.push(role);
            }
        }
        this.Hide();
        let callback = this.callback;
        this.callback = undefined;
        this.datas = [];
        callback?.(selects);
    }

    protected async onSelect(index: number, item: Node) {
        if (!this.limit) return;
        if(!this.datas[index].info.is_upline && this.datas[index].info.daily_activity < this.ActivityValue){
            Tips.Show("活跃度不足");
            return
        }
        await Second(0);
        let chidlren = this.scroller.children;
        let num = 0;
        let unSelect: boolean = false;
        for (let child of chidlren) {
            let isSelect = child.getComponent(Toggle).isChecked
            if (isSelect) {
                num++;
                if (child == item) {
                    unSelect = true;
                    item.getComponent(Toggle).isChecked = false;
                    num--;
                }
            }
            child.getChildByName("hightlight").getComponent(Sprite).node.active = false;
        }
        if (num >= this.limit) {
            // this.datas[index].select = false;
            item.getComponent(Toggle).isChecked = false;
            Tips.Show("只能选择" + this.limit + "个");
        } else {
            item.getChildByName("hightlight").getComponent(Sprite).node.active = !unSelect;
            item.getComponent(Toggle).isChecked = !unSelect;
            // this.datas[index].select = item.getComponent(Toggle).isChecked;
            if (unSelect) {
                this.sussLabel.string = Math.floor(num * this.friendsRate * 100) + "%";
            } else {
                this.sussLabel.string = Math.floor((num + 1) * this.friendsRate * 100) + "%";
            }
        }
    }

    private checkPage(data:{info: SDownlineInfo, select: boolean, sussNum: number, isend:boolean }) {
        if (!(data.isend) && this.datas[this.datas.length - 1] == data) {
            data.isend = true;
            this.page++;
            this.onSend();
        }
    }

    protected onHide(...args: any[]): void {
        let ls = this.scroller.children;
        for (let obj of ls) {
            let item = obj.getComponent(Toggle);
            if (item.isChecked) {
                item.isChecked = false;
            }
            obj.getChildByName("hightlight").getComponent(Sprite).node.active = false;
        }
        this.datas = []
        this.ishas = false;
        EventMgr.off(Evt_GetRandomDownline)
    }
}
