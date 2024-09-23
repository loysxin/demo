import { Component, Node } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { SThing } from "../roleModule/PlayerData";
import { AwardItem } from "../common/AwardItem";
import { ItemTips } from "../common/ItemTips";

export class TaskActiveBoxTipsCont extends Component {
    private awardList:AutoScroller;
    private isInit:boolean = false;
    private datas:SThing[] = [];
    protected onLoad(): void {
        this.awardList = this.node.getChildByName("awardList").getComponent(AutoScroller);
        this.awardList.SetHandle(this.updateAwardItem.bind(this));
        this.awardList.node.on('select', this.onSelect, this);
        this.isInit = true;
        this.updateShow();
    }
    protected onEnable(): void {
        this.updateShow();
    }
    SetData(datas:SThing[]) {
        this.datas = datas;
        this.updateShow();
    }

    private updateShow():void{
        if (!this.isInit || !this.datas) return;
        this.awardList.UpdateDatas(this.datas);
    }
    private updateAwardItem(item: Node, data: SThing) {
        let awardItem = item.getComponent(AwardItem);
        if (!awardItem) awardItem = item.addComponent(AwardItem);
        awardItem.SetData({ itemData: data });
    }
    protected async onSelect(index: number, item: Node) {
        let selectData = this.datas[index];
        if(selectData){
            ItemTips.Show(selectData);
        }
    }
}
