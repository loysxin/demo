import { Input, Label, Node, Sprite, SpriteFrame, UITransform, Slider, path, ScrollView, instantiate, EventTouch } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { SDownlineInfo, SFriendSortType, SGetDownlines } from "../roleModule/PlayerData";
import { CardQuality, CfgMgr, StdRoleQuality } from "../../manager/CfgMgr";
import { ResMgr, folder_icon, folder_item } from "../../manager/ResMgr";
import { AutoScroller } from "../../utils/AutoScroller";
import { FanyuUpSelectFriendPage } from "./FanyuUpSelectFriendPage";
import { FanyuUpItem } from "./FanyuUpItem";
import Logger from "../../utils/Logger";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { EventMgr, Evt_GetRandomDownline } from "../../manager/EventMgr";
import { Tips } from "../login/Tips";
import { ToFixed } from "../../utils/Utils";

export class FanyuUpPage extends Panel {
    protected prefab: string = "prefabs/panel/fanyu/FanyuUpPage";
    static get ins(): FanyuUpPage { return this.$instance; }
    private itemUpLabel: Label;
    private friendUpLabel: Label;
    private sussLabel: Label;
    private itemAddNum: Label;
    private itemNameLabel: Label;
    private consumeNum: Label;
    private hasNum: Label;
    private label_1: Label;
    private label_2: Label;
    private Slider: Slider;
    private progress: Node;
    private icon: Sprite;
    private iocnBg: Sprite;
    protected scroller: ScrollView;
    private item:Node;

    private itemcount = 0;
    private friendData = [];
    private itemNum = 0;
    private carId: number;
    private quality: number;
    private suss_rate = 0;
    private callback: Function;
    private itemid: Array<number>;
    private cfg: StdRoleQuality;
    private maxItemcount: number;
    private maxFriendCoun: number;

    private selectFriendIds: string[] = [];
    private oldSelectFriendIds: string[] = [];
    protected onLoad(): void {
        this.CloseBy("mask");
        this.CloseBy("panel/closeBtn");
        // this.find("panel/closeBtn").on(Input.EventType.TOUCH_END, this.Hide, this);
        this.find("panel/okBtn").on(Input.EventType.TOUCH_END, this.onOk, this);
        this.itemUpLabel = this.find("panel/itemLabelNode/itemUpLabel", Label);
        this.label_1 = this.find("panel/itemLabelNode/label_1", Label);
        this.label_2 = this.find("panel/frinendLabelNode/label_2", Label);
        this.friendUpLabel = this.find("panel/frinendLabelNode/friendUpLabel", Label);
        this.sussLabel = this.find("panel/Node/sussLabel", Label);
        this.itemAddNum = this.find("panel/itemAddNum", Label);
        this.itemNameLabel = this.find("panel/itemNameLabel", Label);
        this.consumeNum = this.find("panel/page1/consumeNum", Label);
        this.hasNum = this.find("panel/page1/hasNum", Label);
        this.icon = this.find("panel/iocnBg/icon", Sprite);
        this.iocnBg = this.find("panel/iocnBg", Sprite);
        this.Slider = this.find("panel/page1/Slider", Slider);
        this.progress = this.find("panel/page1/Slider/progress");
        this.find("panel/page1/right").on(Input.EventType.TOUCH_END, this.onAdd, this);
        this.find("panel/page1/left").on(Input.EventType.TOUCH_END, this.onDel, this);
        this.Slider.node.on('slide', this.onSlide, this);
        this.scroller = this.find("panel/ScrollView", ScrollView);
        this.item = this.find("panel/ScrollView/view/content/FanyuUpItem");
        // this.scroller.SetHandle(this.updateItem.bind(this));
        // this.scroller.node.on('select', this.onSelect, this);
    }

    protected onShow(): void {
    }

    async flush(...args: any[]) {
        this.carId = args[0];
        this.quality = args[1];
        this.callback = args[2];
        this.itemcount = args[3][0] ?  args[3][0] : 0;
        this.oldSelectFriendIds = args[4];
        this.friendData = args[5];
        this.cfg = CfgMgr.GetRoleQuality(this.carId, this.quality)
        let itemData = CfgMgr.Getitem(this.cfg.UpItemID[0]);
        this.itemid = [this.cfg.UpItemID[0]];
        this.itemNameLabel.string = itemData.ItemName;
        let icon_url = path.join(folder_item, itemData.Icon, "spriteFrame");
        this.icon.spriteFrame = await ResMgr.LoadResAbSub(icon_url, SpriteFrame);
        let icon_bg_url = path.join(folder_icon, "quality", CardQuality[itemData.Quality] + "_bag_bg", "spriteFrame");
        this.iocnBg.spriteFrame = await ResMgr.LoadResAbSub(icon_bg_url, SpriteFrame);
        this.itemAddNum.string = this.cfg.UpItemRate[0] * 100 + "%";
        let item_num = PlayerData.GetItemCount(this.cfg.UpItemID[0])
        this.itemNum = item_num > this.cfg.UpItemNumMax[0] ? this.cfg.UpItemNumMax[0] : item_num;
        if(this.itemNum == 0){
            this.Slider.enabled = false;
        }else{
            this.Slider.enabled = true;
        }
        this.hasNum.string = "/" + this.itemNum;
        this.maxItemcount = this.cfg.UpItemNumMax[0] > this.itemNum ? this.itemNum : this.cfg.UpItemNumMax[0];
        this.maxFriendCoun = this.cfg.FriendsNum;

        // let datas = [];
        this.scroller.content.removeAllChildren();
        for (let index = 0; index < this.maxFriendCoun; index++) {
            // let data = {
            //     lock: undefined,
            // }
            // datas.push(data);

            let node = instantiate(this.item);
            node.off(Input.EventType.TOUCH_END,this.onSelect,this)
            node.on(Input.EventType.TOUCH_END,this.onSelect,this)
            this.updateItem(node);
            this.scroller.content.addChild(node);    
        }
        // this.scroller.UpdateDatas(datas);

        this.getPlayeId(this.friendData, true)
        this.updateCount();
        this.updateProgress();
    }


    private updateCount() {
        this.label_1.string = this.cfg.UpItemRateMax * 100 + "%";
        this.label_2.string = this.cfg.FriendsRateMax * 100 + "%";

        let item_rate = this.cfg.UpItemRate[0] * 100 * this.itemcount;
        this.itemUpLabel.string = ToFixed(item_rate, 2) + "%";

        let friend_rate = this.cfg.FriendsRate * 100 * this.friendData.length;
        this.friendUpLabel.string = ToFixed(friend_rate, 2) + "%"

        this.consumeNum.string = this.itemcount + "";
        let max_suss_rate = this.cfg.BaseRate * 100 + item_rate + friend_rate
        this.suss_rate = max_suss_rate > 100 ? 100 : max_suss_rate;
        this.sussLabel.string = ToFixed(this.suss_rate, 2) + "%"
    }

    private updateProgress() {
        this.Slider.progress = this.itemcount / this.maxItemcount;
    }

    private async updateItem(item: Node) {
        let data = null;
        let itemNode = item.getComponent(FanyuUpItem);
        if (!itemNode) itemNode = item.addComponent(FanyuUpItem);
        itemNode.setData(data);
    }

    protected update(dt: number): void {
        let size = this.Slider.node.getComponent(UITransform).contentSize;
        this.progress.getComponent(UITransform).setContentSize(this.Slider.progress * size.width, 28);
    }

    private onAdd(e?: any) {
        if (this.itemNum <= 0) return;
        this.itemcount++;
        let max = this.cfg.UpItemRate[0] * this.itemcount;
        //超出最大概率或者超出最大数量
        if (max > this.cfg.UpItemRateMax || this.itemcount > this.cfg.UpItemNumMax[0]) {
            this.itemcount = this.cfg.UpItemNumMax[0]
        }

        //超出拥有数量
        if (this.itemcount > this.itemNum) {
            this.itemcount = this.itemNum
        }
        this.updateCount();
        this.updateProgress();
    }

    private onDel(e?: any) {
        if (this.itemcount <= 0) return;
        this.itemcount--;
        if (this.itemcount < 0) {
            this.itemcount = 0;
        }
        this.updateCount();
        this.updateProgress();
    }

    private onSlide(e?: Slider) {
        this.itemcount = Math.ceil(this.maxItemcount * this.Slider.progress);
        this.updateCount();
        this.updateProgress();
    }

    private onSelect(event:EventTouch) {
        let chidlren = this.scroller.content.children;
        let num = event.currentTarget.getSiblingIndex();
        let child = chidlren[num]
        let itemNode = child.getChildByPath("bg/icon").getComponent(Sprite).node;
        if (itemNode.active) {
            itemNode.active = false;

            let num_lbl = child.getChildByPath("lbl_bg/num").getComponent(Label);
            num_lbl.string = "0%";
            let label = child.getChildByName("playerName").getComponent(Label);
            let select = 0;
            for (const key in this.friendData) {
                if (Object.prototype.hasOwnProperty.call(this.friendData, key)) {
                    const element = this.friendData[key];
                    if (element.info.name == label.string) {
                        select = parseInt(key);
                        break;
                    }
                }
            }
            label.string = "";
            this.friendData.splice(select, 1);
            this.updateCount()
            return;
        }else{
            EventMgr.on(Evt_GetRandomDownline, this.updateFriendData, this);
            let data = {
                type: MsgTypeSend.GetDownlinesRequest,
                data: { page: 1, page_size: 10, sort_type: SFriendSortType.SortDailyActivityDesc, SearchPlayerID: "", include_role: false }
            }
            Session.Send(data);
        }
    }

    private updateFriendData(data: SGetDownlines) {
        EventMgr.off(Evt_GetRandomDownline, this.updateFriendData, this);
        if(data.downlines.length > 0){
            FanyuUpSelectFriendPage.Show(this.maxFriendCoun, this.cfg.FriendsRate, this.cfg.ActivityValue, this.getPlayeId.bind(this))
        }else{
            Tips.Show("暂无符合要求好友")
        }
    }

    private getPlayeId(data:{info: SDownlineInfo, select: boolean, sussNum: number }[], is_frist?:boolean) {
        if (data.length == 0) {
            return;
        }
        
        let chidlren = this.scroller.content.children;
        this.selectFriendIds = [];
        if(is_frist && this.oldSelectFriendIds && this.friendData){
            for (let i = 0; i < this.oldSelectFriendIds.length; i++) {
                let is_has = false;
                const id = this.oldSelectFriendIds[i];
                for (let index = 0; index < this.friendData.length; index++) {
                    const element = this.friendData[index];
                    if(element.info.player_id == id){
                        let itemNode = chidlren[i].getComponent(FanyuUpItem);
                        if (itemNode) {
                            this.selectFriendIds.push(element.info.player_id)
                            itemNode.setData(element);
                            break;
                        }
                    }
                }
            }      
        }else{
            let num = 0;
            this.friendData = data;      
            for (let child of chidlren) {
                let itemNode = child.getComponent(FanyuUpItem);
                if (itemNode) {
                    itemNode.setData(data[num]);
                    if(data[num]){
                        this.selectFriendIds.push(data[num].info.player_id)
                    }
                    num++;
                }
            }
        }

        this.updateCount();
    }

    protected onOk() {
        let callback = this.callback;
        this.callback = undefined;
        callback?.(this.itemid, [this.itemcount], this.selectFriendIds, this.suss_rate, this.friendData);
        this.Hide();
    }


    resetData() {
        this.itemcount = 0;
        this.Slider.progress = 0
        this.friendData = [];
        this.suss_rate = 0;
        this.scroller.getComponent(ScrollView).content.removeAllChildren();
    }

    protected onHide(...args: any[]): void {
        // this.resetData();
        // this.itemcount = 0;
        // this.friendCount = 0;
        // this.suss_rate = 0;
        // this.scroller.getComponent(ScrollView).content.removeAllChildren();
    }

}