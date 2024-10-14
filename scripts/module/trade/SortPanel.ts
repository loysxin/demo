import { Button, Component, EditBox, EventHandler, EventTouch, Input, Label, Layout, Node, ScrollView, Sprite, SpriteFrame, Toggle, find, instantiate, path, sp, tween, view } from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { Attr, AttrFight, Bourse, CardQuality, Selection, CfgMgr, StdMerge, StdRoleQuality } from "../../manager/CfgMgr";
import { ResMgr, folder_icon } from "../../manager/ResMgr";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { SQueryArgs, SQuerySortType, SQueryType, SortType } from "../roleModule/PlayerData";
import { TradePanel } from "./TradePanel";
import { Tips } from "../login/Tips";

export type serchMsg = {
    id: number;
    title: string;
    type: selectType;
    index: number;
    icon?: string;
    Group?: number;
    GroupDesc?: string;
}

export enum selectType {
    serch,
    item,
    role,
}

export class SortPanel extends Panel {
    protected prefab: string = "prefabs/panel/Trade/SortPanel";

    static get ins(): SortPanel { return this.$instance; }
    private selectScroll: Node = null;
    private selectRoleScroll: Node = null;
    private sortSerchList: Node = null;
    private itemSerchList: Node = null;
    private serchRoleList: Node = null;
    private serch: Node = null;
    private nav: Node = null;
    private type: number;
    private index: number = 0;
    private isInit: boolean = false;
    private topTitle: Label = null;
    private topTitle2: Label = null;
    private deleteBtn: Node = null;
    private SortQArgs:SQueryArgs = {};

    private sortDataList: serchMsg[] = []
    private itemDataList: serchMsg[] = []
    private roleDataList: serchMsg[][] = []
    private sortSerchDataList: serchMsg[] = []
    private itemSerchDataList: serchMsg[] = []
    private roleSerchDataList: serchMsg[][] = []
    private sortData = [
        { id: SortType.priceUp, string: `单价从高到低` },
        { id: SortType.priceDown, string: `单价从低到高` },
        { id: SortType.totalUp, string: `总价从高到低` },
        { id: SortType.totalDown, string: `总价从低到高` },
        { id: SortType.countUp, string: `数量从高到低` },
        { id: SortType.countDown, string: `数量从低到高` },
    ]

    protected onLoad() {
        this.CloseBy("mask");
        this.CloseBy("panel/closeBtn");
        this.topTitle = this.find(`panel/selete/infoTitle/title`, Label);
        this.topTitle2 = this.find(`panel/seleteRole/infoTitle/title`, Label);
        this.selectScroll = this.find(`panel/selete`);
        this.selectRoleScroll = this.find(`panel/seleteRole`);
        this.sortSerchList = this.find(`panel/sortList`);
        this.itemSerchList = this.find(`panel/serchList`);
        this.serchRoleList = this.find(`panel/serchRoleList`);
        this.serch = this.find(`panel/serch`);
        this.nav = this.find(`panel/nav`);
        this.deleteBtn = this.find(`panel/deleteBtn`)
        this.onBtnEvent();
    }
    private initData() {
        this.initSortSerchData();
        this.initItemSerchData();
        this.initRoleSerchData();
    }

    private onBtnEvent() {
        this.nav.children.forEach((node, index) => {
            node.on(Input.EventType.TOUCH_END, () => {
                this.setNav(index)
            })
        })
        this.serch.getChildByName(`EditBox`).on(EditBox.EventType.EDITING_DID_ENDED, this.onEditEnd, this)

        this.deleteBtn.on(Input.EventType.TOUCH_END, () => {
            this.resetNode();
            this.resetData();
            this.initData();
            this.setNav(this.index);
        }, this)

        this.selectScroll.getComponentInChildren(AutoScroller).SetHandle(this.updateSelectItem.bind(this));
        this.selectRoleScroll.getComponentInChildren(AutoScroller).SetHandle(this.updateSelectRoleItem.bind(this));
        this.sortSerchList.getComponentInChildren(AutoScroller).SetHandle(this.updateSortItem.bind(this));
        this.itemSerchList.getComponentInChildren(AutoScroller).SetHandle(this.updateSerchItem.bind(this));
        this.serchRoleList.getComponentInChildren(AutoScroller).SetHandle(this.updateSerchRoleItem.bind(this));
    }

    /**单选框事件 */
    private setNav(index) {
        this.resetNode();
        this.index = index;
        this.nav.children[index].getComponent(Toggle).isChecked = true;
        if (index != 0) {
            this.topTitle.string = `我的筛选`;
            this.topTitle2.string = `我的筛选`;
            this.selectScroll.active = false;
            this.sortSerchList.active = false;
            this.serch.active = true;
            this.serch.getChildByName(`EditBox`).getComponent(EditBox).placeholderLabel.string = this.type == 0 ? "请输入想要购买的道具名称/商品码" : "请输入想要购买的商品码"
            if (this.type == 1) {
                this.selectRoleScroll.active = true;
                this.serchRoleList.active = true;
                this.updataRoleDatas();
            } else {
                this.selectScroll.active = true;
                this.itemSerchList.active = true;
                this.updataItemDatas();
            }
            if (TradePanel.ins.GetCopyCode()) {
                this.serch.getComponentInChildren(EditBox).string = TradePanel.ins.GetCopyCode();
            }
        } else {
            this.topTitle.string = `我的排序`;
            this.topTitle2.string = `我的排序`;
            this.updataSortDatas();
        }
    }

    private updataSortDatas() {
        this.selectScroll.getComponentInChildren(AutoScroller).UpdateDatas(this.sortDataList);
        this.sortSerchList.getComponentInChildren(AutoScroller).UpdateDatas(this.sortSerchDataList)
        this.selectScroll.getComponentInChildren(AutoScroller).ScrollToHead();
        this.sortSerchList.getComponentInChildren(AutoScroller).ScrollToHead();
    }
    private updataItemDatas() {
        this.itemSerchList.getComponentInChildren(AutoScroller).UpdateDatas(this.itemSerchDataList);
        this.selectScroll.getComponentInChildren(AutoScroller).UpdateDatas(this.itemDataList);
        this.itemSerchList.getComponentInChildren(AutoScroller).ScrollToHead();
        this.selectScroll.getComponentInChildren(AutoScroller).ScrollToHead();
    }
    private updataRoleDatas() {
        this.serchRoleList.getComponentInChildren(AutoScroller).UpdateDatas(this.roleSerchDataList);
        let datas = []
        this.roleDataList.forEach((cDatas) => {
            cDatas.forEach((data) => {
                datas.push(data);
            })
        })
        console.log(datas)
        this.selectRoleScroll.getComponentInChildren(AutoScroller).UpdateDatas(datas);
        this.serchRoleList.getComponentInChildren(AutoScroller).ScrollToHead();
        this.selectRoleScroll.getComponentInChildren(AutoScroller).ScrollToHead();
    }

    /**重置UI和数据 */
    public reset() {
        this.isInit = false;
        this.resetNode();
        this.resetData();
    }

    private resetNode() {
        this.topTitle.string = `我的排序`;
        this.selectScroll.active = true;
        this.selectRoleScroll.active = false;
        this.sortSerchList.active = true;
        this.itemSerchList.active = false;
        this.serchRoleList.active = false;
        this.serch.active = false;
        this.nav.children[0].getComponent(Toggle).isChecked = true;
        this.serch.getComponentInChildren(EditBox).string = ``;
    }

    private resetData() {
        this.sortDataList = [];
        this.itemDataList = [];
        this.roleDataList = [];
        this.sortSerchDataList = [];
        this.itemSerchDataList = [];
        this.roleSerchDataList = [];

    }

    protected onShow(): void {

    }

    async flush(type, QArgs) {
        this.type = type;
        this.SortQArgs = QArgs;
        if (!this.isInit) {
            this.initData();
            this.isInit = true;
        }
        this.initSortSerchData();
        this.initItemSerchData();
        this.setNav(0)
    }

    protected onHide(...args: any[]): void {
        let QArgs: SQueryArgs = {};
        let type = SQueryType.ThingType
        //排序
        if (this.sortDataList.length > 0) {
            switch (this.sortDataList[0].id) {
                case SortType.priceUp:
                    QArgs.sort_type = SQuerySortType.UnitPrice;
                    QArgs.reverse = false;
                    break
                case SortType.priceDown:
                    QArgs.sort_type = SQuerySortType.UnitPrice;
                    QArgs.reverse = true;
                    break
                case SortType.countUp:
                    QArgs.sort_type = SQuerySortType.UnitCount;
                    QArgs.reverse = false;
                    break
                case SortType.countDown:
                    QArgs.sort_type = SQuerySortType.UnitCount;
                    QArgs.reverse = true;
                    break
                case SortType.totalUp:
                    QArgs.sort_type = SQuerySortType.TotalPrice;
                    QArgs.reverse = false;
                    break
                case SortType.totalDown:
                    QArgs.sort_type = SQuerySortType.TotalPrice;
                    QArgs.reverse = true;
                    break
            }
        } else {
            QArgs.sort_type = SQuerySortType.OpenTime;
            QArgs.reverse = true;
        }
        // //筛选
        let ids = []
        if(this.SortQArgs.item_selection && this.SortQArgs.item_selection.length > 0){
            type = SQueryType.ItemType;
            ids = this.SortQArgs.item_selection
            QArgs.item_selection = ids;
        }
        // if (this.type == 1 && this.roleDataList.length > 0) {
        //     type = SQueryType.RoleType;
        //     this.roleDataList.forEach((datas) => {
        //         datas.forEach((data) => {
        //             ids.push(data.id);
        //         })
        //     })
        //     QArgs.role_selection = ids;
        // } else if (this.itemDataList.length > 0) {//筛选道具
        //     type = SQueryType.ItemType;
        //     this.itemDataList.forEach((data) => {
        //         ids.push(data.id);
        //     })
           
        // }
        if (ids.length > 0 || this.sortDataList.length > 0) {//筛选或者排序有已选项，发送查询协议
            console.log(`发送协议查询！`, QArgs);
            TradePanel.ins.SendSortOrSerch(1, type, QArgs);
        } else if (this.index != 0) {//筛选
            if (this.serch.getComponentInChildren(EditBox).string) {
                let str = this.serch.getComponentInChildren(EditBox).string;
                let cfg: Bourse[] = CfgMgr.Get("bourse")
                for (const iterator of cfg) {
                    if(iterator.Name == str){
                        if(iterator.WaresType != 1){
                            Tips.Show("暂不支持角色和资源搜索")
                        }else{  
                            ids.push(iterator.ItemId);
                            type = SQueryType.ItemType 
                            QArgs.item_selection = ids; 
                            QArgs.init = 1;
                            TradePanel.ins.SendSortOrSerch(1, type, QArgs);
                        }       
                        return;
                    }   
                }
                this.onEditEnd();
            } else {
                TradePanel.ins.SendSessionView(1);
            }
        } else {
            TradePanel.ins.SendSessionView(1);
        }
    }

    /**搜索栏事件 */
    private onEditEnd() {
        if (this.serch.getComponentInChildren(EditBox).string) {
            let data = {
                "type": MsgTypeSend.ExchangesQueryViewIDList,
                "data": {
                    view_id_list: [
                        this.serch.getComponentInChildren(EditBox).string
                    ]
                }
            }
            Session.Send(data);
            this.Hide();
            TradePanel.ins.ResetCopyCode();
        }
    }

    private initSortSerchData(id?: number) {
        this.sortSerchDataList = []
        if (this.type == 1) {
            for (let index = 0; index < 6; index++) {
                let curData = this.sortData[index];
                let tempData: serchMsg = {
                    id: curData.id,
                    title: curData.string,
                    type: selectType.serch,
                    index: index,
                }
                if (id != tempData.id && curData.id != SortType.countUp && curData.id != SortType.countDown && curData.id != SortType.totalUp && curData.id != SortType.totalDown) this.sortSerchDataList.push(tempData);
            }
        } else {
            for (let index = 0; index < 6; index++) {
                let curData = this.sortData[index];
                let tempData: serchMsg = {
                    id: curData.id,
                    title: curData.string,
                    type: selectType.serch,
                    index: index,
                }
                if (id != tempData.id) this.sortSerchDataList.push(tempData);
            }
        }
    }

    /**初始化角色筛选数据 */
    private initRoleSerchData() {
        let selections: Selection[] = CfgMgr.Get("Selection");
        let datas: serchMsg[][] = []
        selections.forEach((selection) => {
            let index = selection.Group - 1
            if (!datas[index]) datas[index] = [];
            let data: serchMsg = {
                id: selection.EnumerateID,
                title: selection.EnumerateDesc,
                type: selectType.role,
                index: datas[index].length,
                icon: selection.Icon,
                Group: selection.Group,
                GroupDesc: selection.GroupDesc,
            }
            datas[index].push(data);
        })
        //排序
        datas.forEach((data) => {
            data.sort((a, b) => {
                return a.index - b.index;
            })
        })
        this.roleSerchDataList = datas;
    }

    /**初始化物品筛选数据 */
    private initItemSerchData() {
        let bourses: Bourse[] = CfgMgr.Get("bourse");
        let datas: serchMsg[] = []
        let type = this.type + 1;
        for (let index in bourses) {
            let bourse = bourses[index];
            if (bourse.ShowType == type && bourse.ShowID) {
                let itemData = CfgMgr.Getitem(bourse.ItemId);
                if (itemData) {
                    let data: serchMsg = {
                        id: bourse.ItemId,
                        title: itemData.ItemName,
                        type: selectType.item,
                        index: datas.length,
                    }
                    datas.push(data);
                }
            }
        }
        this.itemSerchDataList = datas;
    }

    /**选中的筛选物品条件 */
    private updateSelectItem(item, data) {
        item.getChildByName(`Toggle`).getComponent(Toggle).isChecked = true;
        item.getChildByName(`title`).getComponent(Label).string = `${data.title}`;
        item.getChildByName(`Toggle`).off(Toggle.EventType.TOGGLE);
        item.getChildByName(`Toggle`).on(Toggle.EventType.TOGGLE, (toggle) => {
            if (!toggle.getComponent(Toggle).isChecked) {
                if (this.index == 0) {
                    this.sortDataList = []
                    this.initSortSerchData();
                    this.updataSortDatas();
                } else {
                    if (this.itemDataList.indexOf(data) != -1) {
                        this.itemDataList.splice(this.itemDataList.indexOf(data), 1);
                        this.itemSerchDataList.unshift(data);
                        //排序
                        this.itemSerchDataList.sort((a, b) => {
                            return a.index - b.index;
                        })
                        this.updataItemDatas();
                    }
                }
            }
        })
    }

    /**选中的筛选角色条件 */
    private async updateSelectRoleItem(item, data) {
        //文案
        if (data.title) {
            item.getChildByName(`msg`).active = true;
            item.getChildByName(`msg`).getComponent(Label).string = data.title;
        } else {
            item.getChildByName(`msg`).active = false;
        }
        //图标
        if (data.icon) {
            item.getChildByName(`icon`).active = true;
            if (data.Group == 1) {
                item.getChildByName(`icon`).getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "pos" + data.icon, "spriteFrame"), SpriteFrame);
            } else {
                item.getChildByName(`icon`).getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(path.join(folder_icon, "quality", CardQuality[data.icon], "spriteFrame"), SpriteFrame);
            }
        } else {
            item.getChildByName(`icon`).active = false;
        }
        //单选框
        item.getChildByName(`Toggle`).getComponent(Toggle).isChecked = true;
        item.getChildByName(`Toggle`).off(Toggle.EventType.TOGGLE);
        item.getChildByName(`Toggle`).on(Toggle.EventType.TOGGLE, (toggle) => {
            if (!toggle.getComponent(Toggle).isChecked) {
                if (this.roleDataList[data.Group - 1] && this.roleDataList[data.Group - 1].indexOf(data) != -1) {
                    this.roleDataList[data.Group - 1] = [];
                    this.roleSerchDataList[data.Group - 1].push(data);
                    this.roleSerchDataList[data.Group - 1].sort((a, b) => {
                        return a.index - b.index;
                    })
                    this.updataRoleDatas();
                }
            }
        })
    }

    /**未选中排序条件 */
    private updateSortItem(item, data) {
        item.getChildByName(`Toggle`).getComponent(Toggle).isChecked = false;
        item.getChildByName(`title`).getComponent(Label).string = `${data.title}`;
        item.getChildByName(`Toggle`).off(Toggle.EventType.TOGGLE);
        item.getChildByName(`Toggle`).on(Toggle.EventType.TOGGLE, (toggle) => {
            if (toggle.getComponent(Toggle).isChecked) {
                this.initSortSerchData(data.id);
                this.sortDataList = [data];
                this.updataSortDatas();
            }
        })

    }

    /**未选中筛选物品条件 */
    private updateSerchItem(item: Node, data: serchMsg) {
        item.getChildByName(`Toggle`).getComponent(Toggle).isChecked = false;
        item.getChildByName(`title`).getComponent(Label).string = `${data.title}`;
        item.getChildByName(`Toggle`).off(Toggle.EventType.TOGGLE);
        item.getChildByName(`Toggle`).on(Toggle.EventType.TOGGLE, (toggle) => {
            if (toggle.getComponent(Toggle).isChecked) {
                if (this.itemSerchDataList.indexOf(data) != -1) {
                    this.itemSerchDataList.splice(this.itemSerchDataList.indexOf(data), 1);
                    //排序
                    this.itemSerchDataList.sort((a, b) => {
                        return a.index - b.index;
                    })
                    this.itemDataList.push(data);
                    this.updataItemDatas();
                }
            }
        })
    }

    /**未选中筛选角色条件 */
    private updateSerchRoleItem(item, data: serchMsg[]) {
        let title = find(`Node/title`, item).getComponent(Label);
        item.getComponent(Layout).enabled = true;
        if (data[0] && data[0].GroupDesc) title.string = data[0].GroupDesc;
        else {
            item.getComponent(Layout).enabled = false;
            this.serchRoleList.getComponentInChildren(AutoScroller).ScrollToHead();
        }
        let prefabs: Node[] = []
        item.children.forEach((prefab: Node) => {
            if (prefab.name == `item`) {
                prefab.active = false;
                prefabs.push(prefab);
            }
        })
        data.forEach(async (serch, index) => {
            let curNode
            if (!prefabs[index]) {
                curNode = instantiate(prefabs[0]);
                item.addChild(curNode);
            } else {
                curNode = prefabs[index];
            }
            curNode.active = true;
            //文案
            if (serch.title) {
                curNode.getChildByName(`msg`).active = true;
                curNode.getChildByName(`msg`).getComponent(Label).string = serch.title;
            } else {
                curNode.getChildByName(`msg`).active = false;
            }
            //图标
            if (serch.icon) {
                curNode.getChildByName(`icon`).active = true;
                if (serch.Group == 1) {
                    curNode.getChildByName(`icon`).getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "pos" + serch.icon, "spriteFrame"), SpriteFrame);
                } else {
                    curNode.getChildByName(`icon`).getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(path.join(folder_icon, "quality", CardQuality[serch.icon], "spriteFrame"), SpriteFrame);
                }
            } else {
                curNode.getChildByName(`icon`).active = false;
            }
            //单选框
            curNode.getChildByName(`Toggle`).getComponent(Toggle).isChecked = false;
            curNode.getChildByName(`Toggle`).off(Toggle.EventType.TOGGLE);
            curNode.getChildByName(`Toggle`).on(Toggle.EventType.TOGGLE, (toggle) => {
                if (toggle.getComponent(Toggle).isChecked) {
                    if (this.roleSerchDataList[serch.Group - 1].indexOf(serch) != -1) {
                        this.roleSerchDataList[serch.Group - 1].splice(this.roleSerchDataList[serch.Group - 1].indexOf(serch), 1);
                        if (this.roleDataList[serch.Group - 1] && this.roleDataList[serch.Group - 1][0]) {
                            this.roleSerchDataList[serch.Group - 1].push(this.roleDataList[serch.Group - 1][0]);
                            this.roleDataList[serch.Group - 1] = [];
                        } else {
                            this.roleDataList[serch.Group - 1] = []
                        }
                        this.roleSerchDataList[serch.Group - 1].sort((a, b) => {
                            return a.index - b.index;
                        })
                        this.roleDataList[serch.Group - 1].push(serch);
                        this.updataRoleDatas();
                    }
                }
            })
        })
    }
}