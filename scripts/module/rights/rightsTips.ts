import { Input, Label, Node, Toggle,} from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_Hide_Scene, Evt_Show_Scene } from "../../manager/EventMgr";
import { MsgTypeSend } from "../../MsgType";
import { StdItem } from "../../manager/CfgMgr";
import { Session } from "../../net/Session";
import { BagItem } from "../bag/BagItem";
import PlayerData from "../roleModule/PlayerData";
import { countDown2 } from "../../utils/Utils";
import { DateUtils } from "../../utils/DateUtils";


export class rightsTips extends Panel {
    protected prefab: string = "prefabs/panel/rights/rightsTips";

    private item:Node
    private has_num:Label;
    private add_num:Label;


    private cfg:StdItem
    private time_data:number;

    protected onLoad(): void {
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
        this.item = this.find("BagItem")
        this.has_num = this.find("Node/has_num", Label)
        this.add_num = this.find("Node-001/add_num",Label)
        this.find("btn1").on(Input.EventType.TOUCH_END, this.onOk, this);   
    }

    protected onShow(): void {
    }

    async flush(cfg:StdItem, hasNum:number, addNum:string) {
        this.cfg = cfg;
        let seconds = hasNum - PlayerData.GetServerTime();
        if(seconds > 0){
            let time = countDown2(hasNum)
            if(time.d > 0){
                this.has_num.string = time.d + "天";
            }else{
                this.has_num.string = time.h + ":" + time.m + ":" + time.s;
            }
            if(this.time_data){
                clearInterval(this.time_data);
            }
            this.time_data = setInterval(() => {
                if (seconds > 0) {
                    seconds -= 1;
                    let time = countDown2(hasNum);
                    if(time.d > 0){
                        this.has_num.string = time.d + "天";
                    }else{
                        this.has_num.string = time.h + ":" + time.m + ":" + time.s;
                    }
                } else {
                    clearInterval(this.time_data);
                }
            }, 1000)
        }else{
            this.has_num.string =  "0天";
        }
        this.add_num.string = addNum;


        let data = PlayerData.GetItem(cfg.Items);
        let bagItem = this.item.getComponent(BagItem);
        if (!bagItem) bagItem = this.item.addComponent(BagItem);
        this.item.getComponent(BagItem).setIsShowSelect(false);    
        bagItem.SetData(data);
        
    }

    private onOk(){
        let sendData = {
            type: MsgTypeSend.UseItem,
            data: {
                item_id: this.cfg.Items
            }
        }
        Session.Send(sendData);
        this.Hide();
    }

    protected onHide(...args: any[]): void {
        clearInterval(this.time_data);
    }
}