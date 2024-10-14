import { Input, Label, Node, Sprite, SpriteFrame, UITransform, Slider, path, Button, tween, v3, PageView, instantiate, Layout } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData from "../roleModule/PlayerData";
import { BoxType, CardQuality, CfgMgr, RewardBox, StdItem } from "../../manager/CfgMgr";
import { ResMgr, folder_icon, folder_item } from "../../manager/ResMgr";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { OpenBoxPage } from "./OpenBoxPage";
import { EventMgr, Evt_GetReward, Evt_Item_Change, Evt_OpenBoxGetRewardPanel } from "../../manager/EventMgr";
import { Tips } from "../login/Tips";
import { ItemUtil } from "../../utils/ItemUtils";
import { fanyuTips } from "../fanyu/fanyuTips";

export class OpenBoxPanel extends Panel {
    protected prefab: string = "prefabs/panel/bag/OpenBoxPanel";
    private iocnBg: Sprite;
    private icon: Sprite;
    private itemName: Label;
    private item_num: Label;
    private lbl_tips: Label;
    private consumeNum: Label;
    private hasNum: Label;
    private Slider: Slider;
    private progress: Node;
    private btn_right: Button;
    private btn_left: Button;
    private okBtn: Button;
    private PageView: PageView;
    private openBoxItem: Node;
    private page1: Node;

    private itemData: StdItem;
    private BoxData: RewardBox;

    private curSelectCount = 1;
    private maxItemcount: number;
    private selectItem: number[];
    private curPageNum: number = 0;
    private datas = []
    private maxPageNum: number = 0;

    protected onLoad(): void {
        this.CloseBy("mask");
        this.find("panel/closeBtn").on(Input.EventType.TOUCH_END, this.Hide, this);
        this.okBtn = this.find("panel/okBtn", Button);
        this.okBtn.node.on("click", this.onOk, this);
        this.iocnBg = this.find("panel/iocnBg", Sprite);
        this.icon = this.find("panel/iocnBg/icon", Sprite);
        this.itemName = this.find("panel/itemName", Label);
        this.item_num = this.find("panel/item_num", Label);
        this.lbl_tips = this.find("panel/lbl_tips", Label);
        this.page1 = this.find("panel/page1");
        this.consumeNum = this.find("panel/page1/consumeNum", Label);
        this.hasNum = this.find("panel/page1/hasNum", Label);
        this.Slider = this.find("panel/page1/Slider", Slider);
        this.progress = this.find("panel/page1/Slider/progress");
        this.btn_right = this.find("panel/btn_right", Button);
        this.btn_left = this.find("panel/btn_left", Button);
       
       
    
        this.PageView = this.find("panel/PageView", PageView)
        this.openBoxItem = this.find("panel/PageView/view/content/OpenBoxItem")
        this.find("panel/page1/right").on(Input.EventType.TOUCH_END, this.onAdd, this);
        this.find("panel/page1/left").on(Input.EventType.TOUCH_END, this.onDel, this);
        this.btn_right.node.on("click", this.onBtnRight, this)
        this.btn_left.node.on("click", this.onBtnLeft, this)
        this.Slider.node.on('slide', this.onSlide, this);
        // EventMgr.on(Evt_Item_Change, this.onItemChange, this);
        // EventMgr.on(Evt_GetReward, this.resetData, this);
        // EventMgr.on(Evt_OpenBoxGetRewardPanel, this.updateBtnState, this);
    }

    protected onShow(): void {
        EventMgr.on(Evt_Item_Change, this.ItemChange, this);
        EventMgr.on(Evt_GetReward, this.resetData, this);
        EventMgr.on(Evt_OpenBoxGetRewardPanel, this.updateBtnState, this);
    }

    async flush(...args: any[]) {
        this.itemData = args[0];
        // this.itemData = CfgMgr.Getitem(1202)
        if (!this.itemData) return;
        this.itemName.string = this.itemData.ItemName;
        let count = PlayerData.GetItemCount(this.itemData.Items);
        this.page1.active = true;
        if (count <= 1) {
            this.page1.active = false;
        }
        this.item_num.string = "" + count;
        this.BoxData = CfgMgr.GetBoxData(this.itemData.Items);

        this.maxItemcount = count > this.BoxData.Limit ? this.BoxData.Limit : count;
        this.hasNum.string = "/" + this.maxItemcount;
        let icon_url = path.join(folder_item, this.itemData.Icon, "spriteFrame");
        this.icon.spriteFrame = await ResMgr.LoadResAbSub(icon_url, SpriteFrame);
        let icon_bg_url = path.join(folder_icon, "quality", CardQuality[this.itemData.Quality] + "_bag_bg", "spriteFrame");
        this.iocnBg.spriteFrame = await ResMgr.LoadResAbSub(icon_bg_url, SpriteFrame);

        
        // this.BoxData = CfgMgr.GetBoxData(1200);
        let is_select = this.BoxData.Boxtype == BoxType.select
        this.okBtn.enabled = !is_select;
        this.okBtn.node.getComponent(Sprite).grayscale = is_select;
        let str = ["可随机获得以下道具" , "选择获得以下道具0/", "可获得以下道具"]
        this.lbl_tips.string = is_select ? str[this.BoxData.Boxtype - 1] + this.BoxData.RewardNum : str[this.BoxData.Boxtype - 1];
        let rewardDataType = this.BoxData.Types;
        let rewardData = this.BoxData.Items;
        let rewardDataNum = this.BoxData.ItemsNum;
        let rewardCount = this.BoxData.Items.length < 8 ? this.BoxData.Items.length : 8;

        let page_num = Math.floor(rewardData.length / 8) + (rewardData.length % 8 == 0 ? 0 : 1);

        this.maxPageNum = page_num;
        this.datas = [];
        for (let index = 0; index < page_num; index++) {
            let pageData = [];
            for (let i = 0; i < rewardCount; i++) {
                let type = rewardDataType[i + (index * rewardCount)]
                let id = rewardData[i + (index * rewardCount)];
                let num = rewardDataNum[i + (index * rewardCount)]
                if (!num) {
                    break;
                }
                if(type == 5){
                  id = CfgMgr.GetRewardRoleById(id).RoleType;
                }
                let awardList = ItemUtil.CreateThing(type, id, num);
                pageData.push(awardList)
            }
            this.datas.push(pageData);
        }

        this.PageView.removeAllPages();
        for (let k = 0; k < page_num; k++) {
            let item = instantiate(this.openBoxItem)
            let itemNode = item.getComponent(OpenBoxPage);
            if (!itemNode) itemNode = item.addComponent(OpenBoxPage);
            itemNode.SetData(this.datas[k], this.curSelectCount, this.BoxData.RewardNum, is_select, this.getSelect.bind(this))
            this.PageView.addPage(item)
        }
        this.updateProgress();
    }

    private getRoleReward(type:number){
        let cfg = CfgMgr.Get("RewardRole");
        for (let index = 0; index < cfg.length; index++) {
            const element = cfg[index];
            if(type == element.RewardID){
                return element.RoleType;
            } 
        }
        return null;
    }

    private ItemChange() {
        let count = PlayerData.GetItemCount(this.itemData.Items);
        this.item_num.string = "" + count;
        this.maxItemcount = count > this.BoxData.Limit ? this.BoxData.Limit : count;;
        this.hasNum.string = "/" + this.maxItemcount;
    }

    private resetData() {
        if (this.maxItemcount <= 0) {
            this.Hide();
            return;
        }
        if (this.maxItemcount <= 1) {
            this.page1.active = false;
        }
        this.curSelectCount = 1;
        this.curPageNum = 0;
        if (this.BoxData.Boxtype == BoxType.select) {
            this.selectItem = [];
            this.lbl_tips.string = "选择获得以下道具" + this.selectItem.length + "/" + this.BoxData.RewardNum;
            this.PageView.setCurrentPageIndex(this.curPageNum);
            let item = this.PageView.getPages()[this.curPageNum].getComponent(OpenBoxPage)
            item.SetData(this.datas[this.curPageNum], this.curSelectCount, this.BoxData.RewardNum, this.BoxData.Boxtype == BoxType.select, this.getSelect.bind(this))
            this.okBtn.enabled = false;
            this.okBtn.node.getComponent(Sprite).grayscale = true;
        }
        this.updateProgress();
    }

    private updateProgress() {
        this.Slider.progress = this.curSelectCount / this.maxItemcount;
        this.consumeNum.string = this.curSelectCount + "";
        let item = this.PageView.getPages()[this.curPageNum].getComponent(OpenBoxPage)
        item.setSelectNum(this.curSelectCount, this.BoxData.Boxtype == BoxType.select)
    }

    private updateBtnState(){
        this.okBtn.enabled = true;
    }

    protected onHide(...args: any[]): void {
        this.curSelectCount = 1;
        this.curPageNum = 0;
        this.selectItem = undefined;
        this.PageView.removeAllPages();
        EventMgr.off(Evt_Item_Change, this.ItemChange, this);
        EventMgr.off(Evt_GetReward, this.resetData, this);
        EventMgr.off(Evt_OpenBoxGetRewardPanel, this.updateBtnState, this);
    }

    protected update(dt: number): void {
        let size = this.Slider.node.getComponent(UITransform).contentSize;
        this.progress.getComponent(UITransform).setContentSize(this.Slider.progress * size.width, 28);
    }

    private onAdd(e?: any) {
        if (this.curSelectCount >= this.maxItemcount) return;
        this.curSelectCount++;
        //超出拥有数量
        if (this.curSelectCount > this.maxItemcount) {
            this.curSelectCount = this.maxItemcount
        }
        this.updateProgress();
    }

    private onDel(e?: any) {
        if (this.curSelectCount < 1) return;
        this.curSelectCount--;
        if (this.curSelectCount < 1) {
            this.curSelectCount = 1;
        }
        this.updateProgress();
    }

    private onSlide(e?: Slider) {
        this.curSelectCount = Math.max(Math.ceil(this.maxItemcount * this.Slider.progress), 1);
        this.updateProgress();
    }


    private onBtnRight() {
        this.curPageNum++;
        if (this.curPageNum >= this.maxPageNum) {
            this.curPageNum = this.maxPageNum - 1;
            return;
        }
        this.setItemData();
    }

    private onBtnLeft() {
        this.curPageNum--;
        if (this.curPageNum < 0) {
            this.curPageNum = 0;
            return;
        }
        this.setItemData();
    }

    private setItemData() {
        this.PageView.setCurrentPageIndex(this.curPageNum);
        let cur = this.PageView.getCurrentPageIndex();
        let item = this.PageView.getPages()[cur].getComponent(OpenBoxPage)
        item.SetData(this.datas[cur], this.curSelectCount, this.BoxData.RewardNum, this.BoxData.Boxtype == BoxType.select, this.getSelect.bind(this))
    }

    private getSelect(data: number[]) {
        this.selectItem = data
        this.lbl_tips.string = "选择获得以下道具" + data.length + "/" + this.BoxData.RewardNum;
        let isClick = data.length == this.BoxData.RewardNum;
        this.okBtn.enabled = isClick
        this.okBtn.node.getComponent(Sprite).grayscale = !isClick;
    }

    protected onOk() {
        if (this.BoxData.Boxtype == BoxType.select && (!this.selectItem || this.selectItem.length < this.BoxData.RewardNum)) {
            Tips.Show("请选择道具")
            return;
        }
        if(this.curSelectCount >= 2 && this.BoxData.Text && this.BoxData.Text != ""){
            let id = this.BoxData.Items[this.selectItem[0]]
            let lbl = CfgMgr.GetRewardRoleById(id).RoleName
            let str = CfgMgr.GetText(this.BoxData.Text, {name: lbl})
            Tips.Show(str, this.callBack.bind(this))
        }else{
            this.callBack();
        }
    }

    private callBack(){
        if (this.BoxData.Boxtype == BoxType.random) {
            let data = {
                type: MsgTypeSend.OpenBoxRequest,
                data: {
                    item_id: this.BoxData.ItemID,
                    count: this.curSelectCount,
                    selected_items: [],
                }
            }
            Session.Send(data)
        } else if(this.BoxData.Boxtype == BoxType.select) {
            let data = {
                type: MsgTypeSend.OpenBoxRequest,
                data: {
                    item_id: this.BoxData.ItemID,
                    count: this.curSelectCount,
                    selected_items: this.selectItem,
                }
            }
            Session.Send(data)
        }else{
            let data = {
                type: MsgTypeSend.OpenBoxRequest,
                data: {
                    item_id: this.BoxData.ItemID,
                    count: this.curSelectCount,
                }
            }
            Session.Send(data)
        }
        this.okBtn.enabled = false;
    }




}