
import { CfgMgr, StdRoleLevel, ThingType } from "../../manager/CfgMgr";
import { AwardItem } from "../common/AwardItem";
import { Panel } from "../../GameRoot";
import { Button, Color, Input, Label, Node} from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData, { SPlayerDataItem, SThing } from "../roleModule/PlayerData";
import { MsgPanel } from "../common/MsgPanel";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { ConsumeItem } from "../common/ConsumeItem";
import { ItemUtil } from "../../utils/ItemUtils";
import { ItemTips } from "../common/ItemTips";

export class RoleTuPoPanel extends Panel {
    protected prefab: string = "prefabs/panel/role/RoleTuPoPanel";
    private tuPoBtn:Button;
    private consumeItem:ConsumeItem;
    private consumeLits:AutoScroller;
    private curSelectIndex:number = -1;
    private roleId:string;
    private stdRoleLv:StdRoleLevel;
    private datas:SPlayerDataItem[];
    protected onLoad() {
        this.tuPoBtn = this.find("tuPoBtn", Button);
        let consumeItemNode:Node = this.find("tuPoBtn/ConsumeItem");
        this.consumeItem = consumeItemNode.addComponent(ConsumeItem);
        this.consumeLits = this.find("consumeLits", AutoScroller);
        this.consumeLits.SetHandle(this.updateItem.bind(this));
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
        this.tuPoBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
    }
    protected async onShow(...args): Promise<void> {
        if (!this.$hasLoad) await this.initSub;
        this.roleId = args[0];
        this.stdRoleLv = args[1];
        this.datas = [];
        if (this.stdRoleLv.BreakItem && this.stdRoleLv.BreakItem.length > 0){
            for (let i = 0; i < this.stdRoleLv.BreakItem.length; i++) {
                this.datas[i] = {id:this.stdRoleLv.BreakItem[i], count:this.stdRoleLv.BreakCost[i]};
            }
        }
        this.consumeLits.UpdateDatas(this.datas);
        let thing:SThing = ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, this.stdRoleLv.Cost);
        this.consumeItem.SetData(thing);
    }
    public flush(): void {
        
        
    }
    protected onHide(...args: any[]): void {
        
    }
    onBtnClick(event: Button) {
        let myMoney = PlayerData.roleInfo.currency;
        if (myMoney < this.stdRoleLv.Cost) {
            MsgPanel.Show('当前突破费用不足');
            return;
        }
        if (this.datas && this.datas.length > 0){
            for (const dataItem of this.datas) {
                let std = CfgMgr.Getitem(dataItem.id);
                let has = PlayerData.GetItemCount(dataItem.id);
                if (has < dataItem.count){
                    MsgPanel.Show(`${std.ItemName}不足${dataItem.count}个!`);
                    return;
                }
            }
        }
        
        let data = {
            type: MsgTypeSend.UpgradeRole,
            data: {
                role_id: this.roleId,
            }
        }
        Session.Send(data);
        this.Hide();
    }
    
    protected updateItem(item:Node, data: SPlayerDataItem) {
        let awardItem = item.getComponent(AwardItem);
        if (!awardItem) awardItem = item.addComponent(AwardItem);
        let haveNum:number = PlayerData.GetItemCount(data.id);
        awardItem.SetData({itemData:data});
        item.off(Input.EventType.TOUCH_END);
        item.on(Input.EventType.TOUCH_END,()=>{ItemTips.Show(data)},this)
        let haveNumLab:Label = item.getChildByPath("otherNumCont/haveNumLab").getComponent(Label);
        let needNumLab:Label = item.getChildByPath("otherNumCont/needNumLab").getComponent(Label);
        let colorStr:string = "#ff3f3f";
        if(haveNum >= data.count){
            colorStr = "#8CFF75";
        }
        haveNumLab.string = haveNum.toString();
        needNumLab.string = data.count.toString();
        haveNumLab.color = new Color().fromHEX(colorStr);
    }
    
}