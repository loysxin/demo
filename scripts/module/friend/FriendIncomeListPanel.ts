import { Button, EventTouch, Input, Label, Node, Sprite, SpriteFrame, Toggle, UIOpacity, UITransform, instantiate, path, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { SGetIncomes, SIncomeRecordInfo, SIncomeRecords, SIncomesInfo } from "../roleModule/PlayerData";
import { AutoScroller } from "../../utils/AutoScroller";
import { EventMgr, Evt_GetIncomeRecords } from "../../manager/EventMgr";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { DateUtils } from "../../utils/DateUtils";
import { ResMgr, folder_head_round } from "../../manager/ResMgr";
import { FriendInfoPanel } from "./FriendInfoPanel";
import { ToFixed, formatNumber } from "../../utils/Utils";

export class FriendIncomeListPanel extends Panel {
    protected prefab: string = "prefabs/panel/friend/FriendIncomeListPanel";

    private incomeNum: Label
    private ScrollView: AutoScroller
    private pageLabel: Label;
    private left: Node;
    private right: Node;
    private noneListCont:Node;
    private maxPage: number;
    private maxCount:number = 1;
    private curPage: number = 1;
    private pageSize: number = 5;
    protected onLoad(): void {
        this.CloseBy("mask");
        this.CloseBy("frame/closeBtn");
        this.noneListCont = this.find("frame/noneListCont")
        this.incomeNum = this.find("frame/incomeNode/incomeNum", Label);
        this.ScrollView = this.find("frame/ScrollView").getComponent(AutoScroller);
        this.ScrollView.SetHandle(this.updateItem.bind(this))
        this.pageLabel = this.find(`frame/pageBg/Label`, Label);
        this.left = this.find(`frame/pageBg/left`);
        this.right = this.find(`frame/pageBg/right`);
        EventMgr.on(Evt_GetIncomeRecords, this.updateLayer, this);
        this.left.on(Input.EventType.TOUCH_END, () => {
            if (this.curPage > 1) {
                this.curPage--;
                this.SendSessionView();
            }
        })

        this.right.on(Input.EventType.TOUCH_END, () => {
            this.curPage++;
            if (this.curPage <= this.maxPage) {
                this.SendSessionView();
            } else {
                this.curPage--;
            }
        })
    }

    protected onShow(): void {
        this.SendSessionView();
    }

    async flush(income: number = 0,) {
        this.incomeNum.string = ToFixed(income, 4) + "";
    }

    private async updateItem(item: Node, data: SIncomeRecordInfo, index: number) {
        let bg = item.getChildByPath("frame/bg")
        let income_bg = item.getChildByPath("frame/income_bg")
        let icon = item.getChildByPath("frame/bg/icon").getComponent(Sprite);
        let player_name = item.getChildByPath("frame/player_name").getComponent(Label);
        let friendNode = item.getChildByPath("frame/friendNode")
        let incomeNum = item.getChildByPath("frame/incomeNode/lbl/incomeNum").getComponent(Label);
        let year_time = item.getChildByPath("frame/incomeNode/timeNode/year_time").getComponent(Label);
        let hours_time = item.getChildByPath("frame/incomeNode/timeNode/hours_time").getComponent(Label);
        let incomeNode = item.getChildByPath("frame/incomeNode")
        bg.off(Input.EventType.TOUCH_START);
        bg.on(Input.EventType.TOUCH_START, ()=>{FriendInfoPanel.Show(data.player_id)}, this);

        income_bg.getComponent(UITransform).width = 430;
        friendNode.active = false;
        incomeNode.active = true;
        // icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_head_round, data.icon_url, "spriteFrame"), SpriteFrame);
        player_name.string = data.name
        incomeNum.string = ToFixed(data.amount, 4) + "";
        let datetime = DateUtils.TimestampToDate(data.timestamp * 1000)
        let m = parseInt(datetime[1]) < 10 ? `0${datetime[1]}` : `${datetime[1]}`;
        let d = parseInt(datetime[2]) < 10 ? `0${datetime[2]}` : `${datetime[2]}`;
        let h = parseInt(datetime[3]) < 10 ? `0${datetime[3]}` : `${datetime[3]}`;
        let min = parseInt(datetime[4]) < 10 ? `0${datetime[4]}` : `${datetime[4]}`;
        let s = parseInt(datetime[5]) < 10 ? `0${datetime[5]}` : `${datetime[5]}`;
        year_time.string = datetime[0] + "." + m + "." + d;
        hours_time.string = h + ":" + min + ":" + s;
    }

    private SendSessionView() {
        let data = {
            type: MsgTypeSend.GetIncomeRecordsRequest,
            data: { page: this.curPage, page_size: this.pageSize },
        }
        Session.Send(data);
    }

    private updateLayer(data: SIncomeRecords) {
        this.maxCount = Math.ceil(data.total / this.pageSize);
        this.maxPage =  this.maxCount > 0 ?  this.maxCount : 1;
        this.pageLabel.string = this.curPage + "/" + this.maxPage;
        this.noneListCont.active = false;
        if(!data.income_records || data.income_records.length == 0 ){
            this.noneListCont.active = true;
        }
        this.ScrollView.UpdateDatas(data.income_records);
    }

    protected onHide(...args: any[]): void {
        this.curPage = 1;
    }
}