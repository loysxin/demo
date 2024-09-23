import { Button, EventTouch, Input, Label, Node, Sprite, SpriteFrame, Toggle, UIOpacity, instantiate, path, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_GetDownLineInfo, Evt_GetIncommons } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { AutoScroller } from "../../utils/AutoScroller";
import { SDownlineInfo, SFriendSortType, SGetDownlines, SortType } from "../roleModule/PlayerData";
import { FriendSortPanel } from "./FriendSortPanel";
import { FriendInfoPanel } from "./FriendInfoPanel";
import { ToFixed, formatNumber } from "../../utils/Utils";


export class FriendListPanel extends Panel {
    protected prefab: string = "prefabs/panel/friend/FriendListPanel";

    private friendNum: Label;
    private vipNum: Label;
    private filtrateBtn: Button;
    private ScrollView: AutoScroller
    private pageBg: Node
    private pageLabel: Label;
    private left: Node;
    private right: Node;
    private noneListCont:Node;

    private maxPage: number
    private curPage: number = 1;
    private pageSize: number = 5;
    private sortType: SFriendSortType;
    private searchPlayerID: string = ""
    private playerData: SDownlineInfo;
    protected onLoad(): void {
        this.CloseBy("mask");
        this.CloseBy("frame/closeBtn");
        this.noneListCont = this.find("frame/noneListCont")
        this.friendNum = this.find("frame/friendInfoPage/friendNum", Label);
        this.vipNum = this.find("frame/friendInfoPage/vipNum", Label);
        this.filtrateBtn = this.find("frame/friendInfoPage/filtrateBtn", Button);
        this.ScrollView = this.find("frame/ScrollView").getComponent(AutoScroller);

        this.pageBg = this.find(`frame/pageBg`);
        this.pageLabel = this.find(`frame/pageBg/Label`, Label);
        this.left = this.find(`frame/pageBg/left`);
        this.right = this.find(`frame/pageBg/right`);

        this.filtrateBtn.node.on("click", this.onFiltrate, this);
        this.ScrollView.SetHandle(this.updateItem.bind(this));
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
        EventMgr.on(Evt_GetDownLineInfo, this.updateFriendData, this);
        this.sortType = SFriendSortType.SortBindTimeAsc;
        this.SendSessionView();
    }

    async flush(maxFriendNum: number) {
        this.friendNum.string = maxFriendNum + "";
        this.vipNum.string = "暂无";
        this.curPage = 1;
    }

    private updateFriendData(data: SGetDownlines) {
        let count = Math.ceil(data.total_count / this.pageSize);
        this.maxPage = count == 0 ? 1 : count; 
        this.pageLabel.string = this.curPage + "/" + this.maxPage;
        this.noneListCont.active = false;
        if(!data.downlines || data.downlines.length == 0 ){
            this.noneListCont.active = true;
        }
        this.ScrollView.UpdateDatas(data.downlines);

    }

    private async updateItem(item: Node, data: SDownlineInfo, index: number) {
        let bg = item.getChildByPath("frame/bg")
        let icon = item.getChildByPath("frame/bg/icon").getComponent(Sprite);
        let player_name = item.getChildByPath("frame/player_name").getComponent(Label);
        let friendIncomeNum = item.getChildByPath("frame/friendNode/todayNode/friendIncomeNum").getComponent(Label);
        let friendAllIncomeNum = item.getChildByPath("frame/friendNode/allNode/friendAllIncomeNum").getComponent(Label);
        let friendNode = item.getChildByPath("frame/friendNode")
        let incomeNode = item.getChildByPath("frame/incomeNode")
        bg.off(Input.EventType.TOUCH_START);
        bg.on(Input.EventType.TOUCH_START, ()=>{FriendInfoPanel.Show(data.player_id)}, this);

        friendNode.active = true;
        incomeNode.active = false;
        this.playerData = data;
        // icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_head_round, data.icon_url, "spriteFrame"), SpriteFrame);
        player_name.string = data.name
        friendIncomeNum.string =  ToFixed(data.daily_output, 4) + "";
        friendAllIncomeNum.string = ToFixed(data.total_output, 4) + "";
    }

    private SendSessionView() {
        let data = {
            type: MsgTypeSend.GetDownlinesRequest,
            data: { page: this.curPage, page_size: this.pageSize, sort_type: this.sortType, search_player_id: this.searchPlayerID }
        }
        Session.Send(data);
    }

    private callBack(sort_type: SFriendSortType, playerid: string) {
        this.sortType = sort_type;
        this.searchPlayerID = playerid;
        this.curPage = 1;
    }

    private onFiltrate() {
        FriendSortPanel.Show(this.pageSize, this.callBack.bind(this), this.sortType, this.searchPlayerID);
    }


    protected onHide(...args: any[]): void {
        this.curPage = 1;
        EventMgr.off(Evt_GetDownLineInfo)
    }
}