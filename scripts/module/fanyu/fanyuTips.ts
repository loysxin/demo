import { Input, Label, Node, Toggle,} from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { MsgTypeSend } from "../../MsgType";
import { StdItem } from "../../manager/CfgMgr";
import { Session } from "../../net/Session";
import { BagItem } from "../bag/BagItem";
import PlayerData from "../roleModule/PlayerData";
import LocalStorage from "../../utils/LocalStorage";


export class fanyuTips extends Panel {
    protected prefab: string = "prefabs/panel/fanyu/fanyuTips";

    private toggle: Toggle;
    private tipsLabel;
    private callBack:Function;


    protected onLoad(): void {
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
        this.tipsLabel = this.find("tipsLabel")
        this.toggle = this.find("Node/toggle", Toggle);
        this.find("btn1").on(Input.EventType.TOUCH_END, this.onOk, this);
        this.find("btn2").on(Input.EventType.TOUCH_END, this.onClose, this);
       
    }

    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Scene, this.node.uuid, this.node.getPathInHierarchy());
    }

    async flush(callback:Function) {
        this.callBack = callback
    }


    private onOk(){
        this.callBack && this.callBack();
        let time = Date.now();
        let id = PlayerData.roleInfo.player_id;
        if (this.toggle.isChecked) {
            LocalStorage.SetNumber("Fanyu" + id, time)
        } else {
            LocalStorage.RemoveItem("Fanyu" + id)
        }
        this.Hide();
    }

    private onClose(){     
        this.Hide();
    }

    protected onHide(...args: any[]): void {
        this.callBack = undefined;
        EventMgr.emit(Evt_Show_Scene, this.node.uuid);
    }
}