import { Input, Label, Node, Sprite, SpriteFrame, UITransform, Slider, path, ScrollView, instantiate, EventTouch, Color, Toggle } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { SDownlineInfo, SFriendSortType, SGetDownlines } from "../roleModule/PlayerData";
import { CardQuality, CfgMgr, StdRoleQuality, ThingItemId, ThingType } from "../../manager/CfgMgr";
import { ResMgr, folder_icon, folder_item } from "../../manager/ResMgr";
import { AutoScroller } from "../../utils/AutoScroller";
import { FanyuUpSelectFriendPage } from "../fanyu/FanyuUpSelectFriendPage";
import { FanyuUpItem } from "../fanyu/FanyuUpItem";
import Logger from "../../utils/Logger";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { EventMgr, Evt_CurrencyIncomInfoUpdate, Evt_GetRandomDownline } from "../../manager/EventMgr";
import { Tips } from "../login/Tips";
import { CurrencyIncomSortPanel } from "./CurrencyIncomSortPanel";
import { DateUtils } from "../../utils/DateUtils";
import { ToFixed, formatNumber } from "../../utils/Utils";

export class CurrencyIncomInfoPanel extends Panel {
    protected prefab: string = "prefabs/panel/currencyIncomInfo/CurrencyIncomInfoPanel";

    private navBtns: Node;
    private currency1ScrollView: AutoScroller;
    private currency3ScrollView: AutoScroller;
    private noneListCont: Node;
    private typeList = [ThingType.ThingTypeCurrency, ThingType.ThingTypeGemstone]; // 当前页签所对应的货币类型（大类）



    private callback: Function;
    private currency1Datas: { player_id: string, type1: number, type2: number, count: number, source: number, data: string, time: number }[] = [];
    private currency3Datas: { player_id: string, type1: number, type2: number, count: number, source: number, data: string, time: number }[] = [];


    private type: number; //当前页签 0彩虹体，1辉耀石

    private sortType: number = 0;
    private currency1page = 1; //滑动页数
    private currency3page = 1; //滑动页数
    private pageSize: number = 15;

    protected onLoad() {
        this.CloseBy("mask");
        this.CloseBy("panel/closeBtn");
        this.find("panel/sortBtn").on(Input.EventType.TOUCH_END, this.onSortBtn, this);
        this.noneListCont = this.find("panel/noneListCont")
        this.currency1ScrollView = this.find("panel/currency1ScrollView", AutoScroller);
        this.currency1ScrollView.SetHandle(this.updateItem.bind(this));
        this.currency3ScrollView = this.find("panel/currency3ScrollView", AutoScroller);
        this.currency3ScrollView.SetHandle(this.updateItem.bind(this));
        this.navBtns = this.find(`panel/nav`);
        this.navBtns.children.forEach((node, index) => {
            node.off(Input.EventType.TOUCH_END);
            node.on(Input.EventType.TOUCH_END, () => {
                this.setNav(index)
            })
        })
        EventMgr.on(Evt_CurrencyIncomInfoUpdate, this.updateIncomeInfoData, this)
    }

    protected onShow(): void {

    }

    flush() {
        this.currency1Datas = [];
        this.currency3Datas = [];
        this.currency1page = 1;
        this.currency3page = 1;
        this.type = undefined;
        this.sortType = 0
        this.setNav(0)
    }

    private setNav(index) {
        if (this.type == index) return;
        this.navBtns.children[index].getComponent(Toggle).isChecked = true;
        this.type = index;
        if (index == 0) {
            this.currency1ScrollView.node.active = true;
            this.currency3ScrollView.node.active = false;
        } else {
            this.currency1ScrollView.node.active = false;
            this.currency3ScrollView.node.active = true;
        }
        this.onSend();
    }

    private updateIncomeInfoData(data: { player_id: string, type1: number, type2: number, count: number, source: number, data: string, time: number }[]) {
        this.noneListCont.active = false
        if (this.type == 0) {
            if (data) {
                for (let index = 0; index < data.length; index++) {
                    this.currency1Datas.push(data[index]);
                }
            }
            if (this.currency1Datas.length == 0) {
                this.noneListCont.active = true;
            }
            this.currency1ScrollView.UpdateDatas(this.currency1Datas)
        } else {
            if (data) {
                for (let index = 0; index < data.length; index++) {
                    this.currency3Datas.push(data[index]);
                }
            }
            if (this.currency3Datas.length == 0) {
                this.noneListCont.active = true;
            }
            this.currency3ScrollView.UpdateDatas(this.currency3Datas)
        }
    }

    private async updateItem(item: Node, data: { player_id: string, type1: number, type2: number, count: number, source: number, data: string, time: number, isend?: boolean }) {
        let icon = item.getChildByName("icon").getComponent(Sprite);
        let source = item.getChildByName("source").getComponent(Label);
        let time = item.getChildByName("time").getComponent(Label);
        let incom = item.getChildByName("incom").getComponent(Label);
        let icon_name = this.type == 0 ? "caizuan" : "huihuangshi"
        icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_item, icon_name, "spriteFrame"), SpriteFrame);
        source.string = CfgMgr.GetTransactionInfo(data.source);
        let datetime = DateUtils.TimestampToDate(data.time * 1000)
        let m = parseInt(datetime[1]) < 10 ? `0${datetime[1]}` : `${datetime[1]}`;
        let d = parseInt(datetime[2]) < 10 ? `0${datetime[2]}` : `${datetime[2]}`;
        let h = parseInt(datetime[3]) < 10 ? `0${datetime[3]}` : `${datetime[3]}`;
        let min = parseInt(datetime[4]) < 10 ? `0${datetime[4]}` : `${datetime[4]}`;
        let s = parseInt(datetime[5]) < 10 ? `0${datetime[5]}` : `${datetime[5]}`;
        time.string = datetime[0] + "-" + m + "-" + d + "  " + h + ":" + min + ":" + s;
        let currency_num = this.type == 0 ? ToFixed(data.count, 2) : ToFixed(data.count, 4)
        incom.string = data.count > 0 ? "+" + currency_num : currency_num + "";
        incom.color = data.count > 0 ? new Color().fromHEX("#498127") : new Color().fromHEX("#AD5858")
        this.checkPage(data);
    }

    protected onSortBtn() {
        let callback = (sort_type) => {
            this.sortType = sort_type
            if (this.type == 0) {
                this.currency1Datas = [];
            } else {
                this.currency3Datas = [];
            }
        };
        CurrencyIncomSortPanel.Show(this.sortType, this.typeList[this.type], this.pageSize, callback.bind(this));
    }



    private checkPage(data: { player_id: string, type1: number, type2: number, count: number, source: number, data: string, time: number, isend?: boolean }) {
        if (this.type == 0) {
            if (!(data.isend) && this.currency1Datas[this.currency1Datas.length - 1] == data) {
                data.isend = true;
                this.currency1page++;
                this.onSend();
            }
        } else {
            this.currency3Datas = [];
            if (!(data.isend) && this.currency3Datas[this.currency3Datas.length - 1] == data) {
                data.isend = true;
                this.currency3page++;
                this.onSend();
            }
        }
    }

    private onSend() {
        let cur_page = 0
        if (this.type == 0) {
            cur_page = this.currency1page;
        } else {
            cur_page = this.currency3page;
        }
        let data = {
            type: MsgTypeSend.QueryThingRecordsRequest,
            data: { count_filter: this.sortType, type1: this.typeList[this.type], page_size: this.pageSize, page: cur_page }
        }
        Session.Send(data);
    }

    protected onHide(...args: any[]): void {
        this.currency1Datas = [];
        this.currency3Datas = [];
        this.currency1page = 1;
        this.currency3page = 1;
    }

}