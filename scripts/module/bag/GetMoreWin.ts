import { Color, Input, Label, Node, Slider, Sprite, SpriteFrame, Toggle, Tween, UITransform, game, path, random, tween, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { FanyuUpSelectFriendItem } from "../fanyu/FanyuUpSelectFriendItem";
import { CfgMgr, Fetch } from "../../manager/CfgMgr";
import { GetMoreItem } from "./GetMoreItem";
import { Goto } from "../../manager/EventMgr";

export class GetMoreWin extends Panel {
    protected prefab: string = "prefabs/panel/bag/GetMoreWin";
    protected scroller: AutoScroller;
    protected onLoad() {
        this.CloseBy("mask");
        this.scroller = this.find("bg/ScrollView", AutoScroller);
        this.scroller.SetHandle(this.updateItem.bind(this));
        // this.scroller.node.on('select', this.onSelect, this);
        this.find("bg/closeBtn").on(Input.EventType.TOUCH_END, this.Hide, this);
    }

    flush(path: []) {
        if (path && path.length > 0) {
            let datas: Fetch[] = [];
            for (let index = 0; index < path.length; index++) {
                let data = CfgMgr.GetFetchData(path[index]);
                datas.push(data);
            }
            this.scroller.UpdateDatas(datas);
        }
    }

    protected onShow(): void {
    }
    protected onHide(...args: any[]): void {
    }

    protected updateItem(item: Node, data: Fetch) {
        let itemNode = item.getComponent(GetMoreItem);
        if (!itemNode) itemNode = item.addComponent(GetMoreItem);
        itemNode.setData(data, this.close.bind(this));
    }

    private close(data: Fetch) {
        if(data.Win == "ResourcesPanel" || data.Win == "JidiPanel" || data.Win == "SoldierProductionPanel"){
            this.closeOther();
        }
        Goto(data.Win, ...data.Param);
        this.Hide()
    }

}
