import { Input, Label, Node, Sprite, SpriteFrame, Toggle, UIOpacity, } from "cc";
import { Panel } from "../../GameRoot";
import { SAssistRoleInfo, SDownlineInfo, SGetDownlines, SPlayerDataRole, SRoleAssistData } from "../roleModule/PlayerData";
import { Tips } from "../login/Tips";
import { AutoScroller } from "../../utils/AutoScroller";
import { Card, CardType } from "../home/panel/Card";
import { Second } from "../../utils/Utils";
import { ResMgr } from "../../manager/ResMgr";
import { CfgMgr } from "../../manager/CfgMgr";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { EventMgr, Evt_UpdateFriendAssistRole } from "../../manager/EventMgr";
import { TradeHeroPanel } from "../trade/TradeHeroPanel";

export class SelectHeroPanel extends Panel {
    protected prefab: string = "prefabs/panel/SelectHeroPanel";

    private navBar: Node;
    protected tile: Label;
    protected scroller: AutoScroller;
    private noneListCont:Node;
    protected friends_scroller: AutoScroller;
    protected my_lbl: Label;
    protected friend_lbl: Label;
    protected type: number = 0;
    protected limit = 0;
    protected callback: Function;

    protected isShowFriend: boolean;
    protected datas: { role: SPlayerDataRole, select: boolean, isend: boolean }[];
    protected friend_datas: { role: SPlayerDataRole, select: boolean, isend: boolean }[];
    private page: number = 1;
    private page_size: number = 12;
    private tab: number;
    private all_select: number = 0;
    private is_show_role_info: boolean;
    private selects = [];
    private selectsMer = [];

    protected onLoad() {
        this.CloseBy("mask");
        this.navBar = this.find("frame/navBar");
        this.tile = this.find("tileBar/buildName", Label);
        this.my_lbl = this.find("frame/navBar/btn1/my_lbl", Label);
        this.friend_lbl = this.find("frame/navBar/btn2/friend_lbl", Label);
        this.noneListCont = this.find("noneListCont");
        this.scroller = this.find("ScrollView", AutoScroller);
        this.scroller.SetHandle(this.updateItem.bind(this));
        this.scroller.node.on('select', this.onSelect, this);

        this.friends_scroller = this.find("friendScrollView", AutoScroller);
        this.friends_scroller.SetHandle(this.updateItem.bind(this));
        this.friends_scroller.node.on('select', this.onFrienSelect, this);
        this.find("okBtn").on(Input.EventType.TOUCH_END, this.onOk, this);
        this.navBar.children.forEach((node, index) => {
            node.on(Input.EventType.TOUCH_END, () => {
                this.setNav(index)
            })
        })
        this.CloseBy("closeBtn");
        EventMgr.on(Evt_UpdateFriendAssistRole, this.updateRoleData, this);
    }

    static SelectMerge(roles: SPlayerDataRole[], selects: SPlayerDataRole[], limit: number, callBack: Function) {
        this.Show(roles, selects, limit, callBack, CardType.Merge);
    }
    static SelectDefense(roles: SPlayerDataRole[], selects: SPlayerDataRole[], limit: number, callBack: Function) {
        this.Show(roles, selects, limit, callBack, CardType.defend);
    }
    static SelectWork(roles: SPlayerDataRole[], selects: SPlayerDataRole[], limit: number, callBack: Function) {
        this.Show(roles, selects, limit, callBack, CardType.Work);
    }
    static SelectHelp(roles: SPlayerDataRole[], selects: SPlayerDataRole[], limit: number, callBack: Function) {
        this.Show(roles, selects, limit, callBack);
    }

    flush(roles: SPlayerDataRole[], selects: SPlayerDataRole[], limit: number, callBack: Function, cardType: number, isShowFriend?: boolean) {
        this.limit = limit;
        this.callback = callBack;
        this.datas = [];
        this.friend_datas = [];
        this.selectsMer = selects
        this.all_select = 0;
        this.page = 1;
        this.type = cardType;
        this.isShowFriend = isShowFriend;
        this.navBar.active = isShowFriend;
        this.is_show_role_info = false;
        this.my_lbl.string = "我的(0/" + this.limit + ")"
        this.friend_lbl.string = "好友(0/" + this.limit + ")"
        this.selects = selects;
        if (isShowFriend) {
            this.setNav(0)
            this.onSend();
        }
        for (let role of roles) {
            let data = {
                role: role,
                select: selects.indexOf(role) != -1,
                isend: false
            }
            this.datas.push(data);
        }
        if (cardType == CardType.Merge) {
            this.tile.string = `选择繁育英雄`
            if (selects[0] && selects.length >= 1) {
                let mainRole = null
                this.datas.forEach(element => {
                    if (element.select) mainRole = element.role;
                });
                let stds = CfgMgr.Get("role_quality");
                let std = null
                stds.forEach((curStd) => {
                    if (curStd.MainRoleid == mainRole.type && mainRole.quality + 1 === curStd.RoleQuailty) {
                        std = curStd;
                    }
                })
                let curRoles = CfgMgr.getFanyuOrtherRole(mainRole, std);
                this.datas = [];
                for (let role of curRoles) {
                    let data = {
                        role: role,
                        select: selects.indexOf(role) != -1,
                        isend: false
                    }
                    this.datas.push(data);
                }
                // this.datas.sort((a, b) => { return (b.select as any) - (a.select as any) });
            }
        } else if (cardType == CardType.Work) {
            this.tile.string = `选择英雄`
        } else if (cardType == CardType.Friend) {
            this.tile.string = `助战协作`
        } else if (cardType == CardType.Trade) {
            this.tile.string = `选择出售`
            this.is_show_role_info = true;
        } else {
            this.datas.sort((a, b) => { return b.role.quality * 1000 + b.role.level - a.role.quality * 1000 + a.role.level; });
            this.tile.string = `选择出战角色`
        }
        this.scroller.UpdateDatas(this.datas);
        this.noneListCont.active = this.datas && this.datas.length <= 0;
        this.scroller.ScrollToHead();
    }

    protected onShow(): void {


    }
    protected onHide(...args: any[]): void {
        this.scroller.node.getComponent(UIOpacity).opacity = 255;
        this.friends_scroller.node.getComponent(UIOpacity).opacity = 255;
        // if(this.is_show_role_info){
        TradeHeroPanel.Hide();
        // }
    }


    protected async updateItem(item: Node, data: { role: SPlayerDataRole, select: boolean, isend: boolean }, index) {
        let card = item.getComponent(Card);
        if (!card) card = item.addComponent(Card);
        card.SetData(data, this.type, this.tab ? (this.tab == 1) : false);
        if (this.isShowFriend) {
            this.checkPage(data);
        }
        if (this.type == CardType.Merge) {
            let state = item.getChildByName("state");
            let stateSprite = state.getComponent(Sprite);
            state.active = data.select;
            if (data.select) {
                if (this.selects.indexOf(data.role) == 0) stateSprite.spriteFrame = await ResMgr.LoadResAbSub("sheets/fanyu/主/spriteFrame", SpriteFrame);
                else if (this.selects.indexOf(data.role) == 1) stateSprite.spriteFrame = await ResMgr.LoadResAbSub("sheets/fanyu/副/spriteFrame", SpriteFrame);
            }
        }
    }

    private setNav(index) {
        this.tab = index;
        this.noneListCont.active = false;
        if (index == 0) {
            this.scroller.UpdateDatas(this.datas);
            this.noneListCont.active = this.datas && this.datas.length > 0;
        } else {
            this.friends_scroller.UpdateDatas(this.friend_datas);
            this.noneListCont.active = this.friend_datas && this.friend_datas.length > 0;
        }
        this.scroller.node.active = (index == 0)
        this.friends_scroller.node.active = (index == 1);
    }

    protected onOk() {
        if (!this.scroller.node.active) {
            this.scroller.node.getComponent(UIOpacity).opacity = 0;
            this.scroller.node.active = true;
        }
        if (this.isShowFriend && !this.friends_scroller.node.active) {
            this.friends_scroller.node.getComponent(UIOpacity).opacity = 0;
            this.friends_scroller.node.active = true;
        }
        let ls = this.scroller.children;
        let selects = [];
        for (let obj of ls) {
            if (obj.getComponent(Toggle).isChecked) {
                let role = this.datas[obj['$$index']].role;
                selects.push(role);
            }
        }
        if (this.type == CardType.Merge) {
            selects = this.selectsMer
        }

        if (this.isShowFriend) {
            let friend_ls = this.friends_scroller.children;
            for (let f_obj of friend_ls) {
                if (f_obj.getComponent(Toggle).isChecked) {
                    let f_role = this.friend_datas[f_obj['$$index']].role;
                    selects.push(f_role);
                }
            }
        }

        this.Hide();
        let callback = this.callback;
        this.callback = undefined;
        callback?.(selects);
    }

    protected async onSelect(index: number, item: Node) {
        if (!this.limit) return;
        await Second(0);
        // let chidlren = this.scroller.children;
        let num = 0;
        // console.log(index);
        this.datas.forEach((data, i) => {
            if (index == i) {
                if(data.select){
                    data.select = false; 
                }else{
                    data.select = true 
                }
            }

            if (data.select){
                num++;
            }
        })
        // for (let child of chidlren) {
        //     if (child.getComponent(Toggle).isChecked) {
        //         num++;
        //     }
        // }
        console.log(num);
        if (this.type == CardType.Merge) {
            let cur_limit = this.limit - this.all_select;
            if (num > cur_limit) {
                this.datas[index].select = false;
                item.getComponent(Toggle).isChecked = false;
                Tips.Show("只能选择" + this.limit + "个");
            } else {
                let state = item.getChildByName("state");
                let Selected = item.getChildByName("ui_breed_Selected");
                this.scroller.children.forEach((node, i) => {
                    node.getChildByName(`ui_breed_Selected`).active = node.getComponent(Toggle).isChecked;
                    node.getChildByName(`state`).active = node.getComponent(Toggle).isChecked;
                })
                this.datas[index].select = item.getComponent(Toggle).isChecked;
                Selected.active = item.getComponent(Toggle).isChecked;
                //标签 切换可选项
                let stateSprite = state.getComponent(Sprite);
                state.active = item.getComponent(Toggle).isChecked;
                if (num == 1) {
                    let mainRole = null
                    this.datas.forEach(element => {
                        if (element.select) mainRole = element.role;
                    });
                    stateSprite.spriteFrame = await ResMgr.LoadResAbSub("sheets/fanyu/主/spriteFrame", SpriteFrame);

                    let stds = CfgMgr.Get("role_quality");
                    let std = null
                    stds.forEach((curStd) => {
                        if (curStd.MainRoleid == mainRole.type && mainRole.quality + 1 === curStd.RoleQuailty) {
                            std = curStd;
                        }
                    })
                    let curRoles = CfgMgr.getFanyuOrtherRole(mainRole, std);
                    SelectHeroPanel.SelectMerge(curRoles, [mainRole], 2, this.callback);
                    this.selectsMer[0] = mainRole;
                    this.selectsMer[1] = null;
                } else if (num == 2) {
                    stateSprite.spriteFrame = await ResMgr.LoadResAbSub("sheets/fanyu/副/spriteFrame", SpriteFrame);
                    if (this.selectsMer[0]) {
                        this.selectsMer[1] = this.datas[index].role;
                    }
                } else {
                    let curRoles = CfgMgr.getFanyuMainRole();
                    SelectHeroPanel.SelectMerge(curRoles, [], 2, this.callback);
                    this.selectsMer = []
                }
            }
        } else {
            let cur_limit = this.limit - this.all_select;
            if (num > cur_limit) {
                if (num == 2) {
                    this.datas.forEach((data, i) => {
                        if (i != index)
                            data.select = false;
                    })
                    this.scroller.children.forEach((node, i) => {
                        if (node != item)
                            node.getComponent(Toggle).isChecked = false;
                    })
                    this.datas[index].select = item.getComponent(Toggle).isChecked;
                } else {
                    this.datas[index].select = false;
                    item.getComponent(Toggle).isChecked = false;
                    Tips.Show("只能选择" + this.limit + "个");
                }

            } else {
                this.datas[index].select = item.getComponent(Toggle).isChecked;
                if (item.getComponent(Toggle).isChecked) {
                    this.all_select++;
                    if (this.all_select > this.limit) {
                        this.all_select = this.limit;
                    }
                } else {
                    this.all_select--;
                    if (this.all_select < 0) {
                        this.all_select = 0;
                    }
                }
            }
        }
        if (this.is_show_role_info) {
            if (item.getComponent(Toggle).isChecked) {
                TradeHeroPanel.Show(this.datas[index].role);
            } else {
                TradeHeroPanel.Hide();
            }
        }
        this.updateSelectCount();
    }

    protected async onFrienSelect(index: number, item: Node) {
        if (!this.limit) return;
        await Second(0);
        let chidlren = this.friends_scroller.children;
        let num = 0;
        for (let child of chidlren) {
            if (child.getComponent(Toggle).isChecked) {
                num++;
            }
        }
        if (this.type == CardType.Merge) {
            this.friend_datas.forEach((data, i) => {
                if (i != index)
                    data.select = false;
            })
            this.friends_scroller.children.forEach((node, i) => {
                if (node != item)
                    node.getComponent(Toggle).isChecked = false;
            })
            this.friend_datas[index].select = item.getComponent(Toggle).isChecked;
        } else {
            let cur_limit = this.limit - this.all_select;
            if (num > cur_limit) {
                this.friend_datas[index].select = false;
                item.getComponent(Toggle).isChecked = false;
                Tips.Show("只能选择" + this.limit + "个");
            } else {
                this.friend_datas[index].select = item.getComponent(Toggle).isChecked;
                if (item.getComponent(Toggle).isChecked) {
                    this.all_select++;
                    if (this.all_select > this.limit) {
                        this.all_select = this.limit;
                    }
                } else {
                    this.all_select--;
                    if (this.all_select < 0) {
                        this.all_select = 0;
                    }
                }
            }
        }
        this.updateSelectCount();
    }

    private updateSelectCount() {
        this.my_lbl.string = "我的(" + this.all_select + "/" + this.limit + ")"
        this.friend_lbl.string = "好友(" + this.all_select + "/" + this.limit + ")"
    }

    private checkPage(data: { role: SPlayerDataRole, select: boolean, isend: boolean }) {
        if (!(data.isend) && this.friend_datas[this.friend_datas.length - 1] == data) {
            data.isend = true;
            this.page++;
            this.onSend();
        }
    }

    private onSend() {
        let data = {
            type: MsgTypeSend.GetDownlinesRequest,
            data: { page: this.page, page_size: this.page_size, sort_type: 1, SearchPlayerID: "", include_role: true }
        }
        Session.Send(data);
    }

    private updateRoleData(data: { assistRoles: SAssistRoleInfo[] }) {
        let datas: SAssistRoleInfo[] = data.assistRoles;
        for (const iterator of datas) {
            if (iterator) {
                let _data = {
                    role: {
                        id: iterator.role_id,
                        type: iterator.type,
                        level: iterator.level,
                        experience: 0,
                        soldier_num: 0,
                        active_skills: [],
                        passive_skills: [],
                        is_in_building: false,
                        building_id: 0,
                        battle_power: iterator.battle_power,
                        quality: iterator.quality,
                        skills: [],
                        is_assisting: true,
                        is_in_attack_lineup: false,
                        is_in_defense_lineup: false,
                        trade_cd: 0,
                    },
                    select: false,
                    isend: false,
                }
                this.friend_datas.push(_data)
            }
        }
        
        this.friends_scroller.UpdateDatas(this.friend_datas);
    }
}
