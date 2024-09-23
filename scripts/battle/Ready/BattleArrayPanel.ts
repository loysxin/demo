import { Button, EditBox, Label, Node, Prefab, input, instantiate, resources, find, math, Sprite, SpriteFrame, Toggle, ProgressBar, tween, Vec3, sp, path, Color, Tween, Input, TiledObjectGroup } from 'cc';
import { Panel } from "../../GameRoot";
import PlayerData, { CountPower, FightState, PlayerDataMap, SAssistRoleInfo, SBattleRole, SDownlineInfo, SGetDownlines, SPlayerDataRole, SPlayerDataSkill } from '../../module/roleModule/PlayerData';
import { AutoScroller } from '../../utils/AutoScroller';
import { HomeScene } from '../../module/home/HomeScene';
import { BattleReadyLogic } from './BattleReadyLogic';
import { BuildingType } from '../../module/home/HomeStruct'
import Logger from '../../utils/Logger';
import { SendOutTroopsPanel } from './SendOutTroopsPanel';
import { Tips } from '../../module/login/Tips';
import { LootVsPanel } from '../../module/loot/LootVsPanel';
import { Attr, AttrFight, CardQuality, CfgMgr, JobName, StdCommonType, StdPassiveLevel } from '../../manager/CfgMgr';
import { MsgTypeRet, MsgTypeSend } from '../../MsgType';
import { Session } from '../../net/Session';
import { EventMgr, Evt_LootPlunder, Evt_RoleAttack, Evt_UpdateFriendAssistRole } from '../../manager/EventMgr';
import { BattleUI } from './BattleUI';
import { Second } from '../../utils/Utils';
import { ComboBox } from '../../utils/ComboBox';
import { ResMgr, bg_quality_color, folder_head_card, folder_icon, folder_item, folder_quality, folder_skill, skill_quality_color } from '../../manager/ResMgr';
import { SpriteLabel } from '../../utils/SpriteLabel';
import { AttrSub, FormatAttr, FormatRoleFightAttr, GetAttrValueByIndex } from '../../module/common/BaseUI';
import { AudioMgr, Audio_CommonClick } from '../../manager/AudioMgr';

export class BattleArrayPanel extends Panel {
    protected prefab: string = 'prefabs/battle/BattleArrayPanel';

    private list_scroller: AutoScroller;
    private scroller: AutoScroller;
    protected friends_scroller: AutoScroller;
    private navBar: Node;
    protected my_lbl: Label;
    protected friend_lbl: Label;
    private isShowFriend: boolean;
    private combo1: ComboBox;
    private combo2: ComboBox;
    private roleInfoNode: Node;
    private body: sp.Skeleton
    private midScroller: AutoScroller;
    private skillLayout: AutoScroller;
    private Power: Node;
    private level: Label;
    private light: Sprite;
    private PowerLabel: SpriteLabel;
    private shangZhen: Node;
    private xiaZhen: Node;
    private noneListCont: Node;

    protected limit = 0;
    protected callback: Function;
    //源数据不参与只排序不删减
    protected datas: { role: SPlayerDataRole, select: boolean, isend: boolean, friend: SAssistRoleInfo, sort: number }[];
    protected friend_datas: { role: SPlayerDataRole, select: boolean, isend: boolean, friend: SAssistRoleInfo, sort: number }[];

    //排序数据
    protected sort_datas: { role: SPlayerDataRole, select: boolean, isend: boolean, friend: SAssistRoleInfo, sort: number }[] = [];
    protected sort_friend_datas: { role: SPlayerDataRole, select: boolean, isend: boolean, friend: SAssistRoleInfo, sort: number }[] = [];

    private my_all_select: number = 0;
    private page: number = 1;
    private page_size: number = 10;
    private friend_limit: number = 1;
    private friend_all_select: number = 0;
    private sorts1: number = 1;
    private sorts2: number = 1;;
    private type: number;

    private combo1Str = { [1]: "默认", [2]: "肉盾", [3]: "战士", [4]: "射手", [5]: "辅助", }
    private combo2Str = { [1]: "默认", [2]: "战力", [3]: "品质", [4]: "等级", }

    private isWaitBattle;
    private battleBtnInfo: Label;

    protected async onLoad() {
        this.SetLink(undefined);
        this.roleInfoNode = this.find("roleInfoNode");
        this.noneListCont = this.find("panel/ready/bg/noneListCont");
        this.body = this.find("roleInfoNode/TradeHeroPanel/body", sp.Skeleton);
        this.midScroller = this.find(`roleInfoNode/TradeHeroPanel/midLayout`, AutoScroller);
        this.skillLayout = this.find(`roleInfoNode/TradeHeroPanel/skillLayout`, AutoScroller);
        this.Power = this.find(`roleInfoNode/TradeHeroPanel/Power`);
        this.PowerLabel = this.Power.getChildByName(`label`).addComponent(SpriteLabel);
        this.level = this.find("roleInfoNode/TradeHeroPanel/level", Label);
        this.light = this.find("roleInfoNode/TradeHeroPanel/light", Sprite);
        this.midScroller.SetHandle(this.updateAttrItem.bind(this));
        this.skillLayout.SetHandle(this.onUpdateSkill.bind(this));
        this.find("roleInfoNode/TradeHeroPanel/close").on(Button.EventType.CLICK, this.onRoleInfoNode, this)


        this.scroller = this.find("panel/ready/bg/chooseList", AutoScroller);
        this.scroller.SetHandle(this.updateItem.bind(this));
        this.scroller.node.on('select', this.onSelect, this);

        this.combo1 = this.find("panel/ready/bg/selectJob", ComboBox);
        this.combo1.Init([1, 2, 3, 4, 5], this.updateJobItem.bind(this), this.updateHead1.bind(this));
        this.combo1.node.on('select', this.onSelectJob, this);
        this.combo2 = this.find("panel/ready/bg/selectQuality", ComboBox);
        this.combo2.Init([1, 2, 3, 4], this.updatequalityItem.bind(this), this.updateHead2.bind(this));
        this.combo2.node.on('select', this.onSelectquality, this);

        this.friends_scroller = this.find("panel/ready/bg/friendScrollView", AutoScroller);
        this.friends_scroller.SetHandle(this.updateItem.bind(this));
        this.friends_scroller.node.on('select', this.onFrienSelect, this)
        this.find("panel/ready/chubingBtn").on(Button.EventType.CLICK, this.OnChuBingClick, this);
        this.find("panel/ready/bg/closeBtn").on(Button.EventType.CLICK, this.OnReadyCloseClick, this);
        this.find("panel/ready/bg/shangZhen").on(Button.EventType.CLICK, this.OnReadyClick, this);
        this.find("panel/ready/bg/xiaZhen").on(Button.EventType.CLICK, this.onOneKeyRemove, this);
        this.find("panel/ready/bg/startBattle").on(Button.EventType.CLICK, this.OnStartBattleClick, this);
        this.battleBtnInfo = this.find("panel/ready/bg/startBattle/info", Label);
        this.shangZhen = this.find("panel/ready/bg/shangZhen")
        this.xiaZhen = this.find("panel/ready/bg/xiaZhen")
        this.my_lbl = this.find("panel/navBar/btn1/my_lbl", Label);
        this.friend_lbl = this.find("panel/navBar/btn2/friend_lbl", Label);
        this.navBar = this.find("panel/navBar");
        this.navBar.children.forEach((node, index) => {
            node.on(Input.EventType.TOUCH_END, () => {
                this.setNav(index)
            })
        })
        this.roleInfoNode.on(Input.EventType.TOUCH_END, this.onRoleInfoNode, this)
        EventMgr.on(Evt_UpdateFriendAssistRole, this.updateRoleData, this);
        EventMgr.on(Evt_RoleAttack, this.updateRoleAttack, this);
    }

    protected async onShow(...args: any) {
        this.isWaitBattle = false;
    }

    public flush(fightType: number, selects: SBattleRole[], limit: number, isBattle: boolean, callBack?: Function, is_show_role_info?: boolean) {
        this.isShowFriend = fightType == FightState.PvP;
        this.battleBtnInfo.string = isBattle ? "开始战斗" : "保存";
        this.navBar.active = this.isShowFriend;
        this.limit = limit;
        this.callback = callBack;
        this.datas = [];
        this.friend_datas = [];
        this.my_all_select = 0;
        this.friend_all_select = 0;
        this.page = 1;
        this.roleInfoNode.active = false;
        this.noneListCont.active = false;
        let role_data = PlayerData.roleInfo.roles;
        for (let role of role_data) {
            let is_upline = BattleReadyLogic.ins.HasDeployment(role.id, role.type)[0]
            let data = {
                role: role,
                select: is_upline,
                isend: false,
                friend: null,
                sort: 1,
            }
            if (is_upline) {
                data.sort = 2
                this.my_all_select++
            }
            this.datas.push(data);
        }
        this.sort_datas = this.datas;
        this.setNav(0)
        if (this.isShowFriend) {
            this.onSend();
        }
        this.updateSelectCount();
    }

    //切页
    private setNav(index) {
        if (this.type == index) return;
        this.type = index;
        this.noneListCont.active = false;
        if (index == 0) {
            this.scroller.node.active = true;
            this.friends_scroller.node.active = false;
            this.list_scroller = this.scroller;
            this.shangZhen.getComponent(Button).enabled = true;
            this.xiaZhen.getComponent(Button).enabled = true;
            this.shangZhen.getComponent(Sprite).grayscale = false;
            this.xiaZhen.getComponent(Sprite).grayscale = false;
        } else {
            this.scroller.node.active = false;
            this.friends_scroller.node.active = true;
            this.list_scroller = this.friends_scroller;
            this.shangZhen.getComponent(Button).enabled = false;
            this.xiaZhen.getComponent(Button).enabled = false;
            this.shangZhen.getComponent(Sprite).grayscale = true;
            this.xiaZhen.getComponent(Sprite).grayscale = true
        }
        this.Sort();
    }

    //选择上阵角色
    protected async onSelect(index: number, item: Node) {
        if (!this.limit) return;
        await Second(0);
        let count = BattleReadyLogic.ins.getUpBattleRole()
        this.my_all_select = count.length;

        let unitType = CfgMgr.GetRole()[this.sort_datas[index].role.type];
        //是否已上阵；上阵的位置；是否以上阵相同的职业
        let result: [boolean, number, boolean] = BattleReadyLogic.ins.HasDeployment(this.sort_datas[index].role.id, this.sort_datas[index].role.type);
        if (result[0]) {
            //已上阵，需要下阵   
            item.getComponent(Toggle).isChecked = false;
            this.my_all_select--;
            if (this.my_all_select < 0) {
                this.my_all_select = 0;
            }
            BattleReadyLogic.ins.RemoveBattleRoleByIndex(result[1]);
            this.sort_datas[index].sort = 1;
        } else {
            if (result[2]) {
                //已上阵相同的职业。弹提示结束
                item.getComponent(Toggle).isChecked = false;
                Tips.Show(CfgMgr.GetText("battle_2"))
                return;
            }
            let positionType = BattleReadyLogic.ins.GetAttackIndexByPositionType(unitType.PositionType)
            //阵容是否已满
            if (positionType >= 0) {
                //未满，上阵
                item.getComponent(Toggle).isChecked = true;
                this.my_all_select++;
                if (this.my_all_select > this.limit) {
                    this.my_all_select = this.limit;
                }
                BattleReadyLogic.ins.AddBattleHeroByIndex(this.sort_datas[index].role.id, positionType, this.sort_datas[index].role);
                this.sort_datas[index].sort = 2;
            } else {
                //已满，弹提示结束
                item.getComponent(Toggle).isChecked = false;
                Tips.Show(CfgMgr.GetText("battle_3"))
                return;
            }
        }

        this.sort_datas = this.sortSelect(this.sort_datas)
        this.list_scroller.UpdateDatas(this.sort_datas);
        this.updateSelectCount();
    }

    //选择助战角色
    protected async onFrienSelect(index: number, item: Node) {
        if (!this.friend_limit) return;
        await Second(0);
        let currency_count = PlayerData.roleInfo.currency;
        let need_currency = this.sort_friend_datas[index].friend.usage_fee;
        if (currency_count < need_currency) {
            item.getComponent(Toggle).isChecked = false;
            Tips.Show("彩虹体不足，无法使用好友助战");
            return;
        }
        this.friend_all_select = 0;
        let count = BattleReadyLogic.ins.getUpBattleRole()
        for (let index = 0; index < this.sort_friend_datas.length; index++) {
            const element = this.sort_friend_datas[index];
            for (let i = 0; i < count.length; i++) {
                const upbattle_role = count[i];
                if (element.role.id == upbattle_role.ID) {
                    this.friend_all_select++;
                    break;
                }
            }
        }
        let unitType = CfgMgr.GetRole()[this.sort_friend_datas[index].role.type];
        //是否已上阵；上阵的位置；是否以上阵相同的职业
        let result: [boolean, number, boolean] = BattleReadyLogic.ins.HasDeployment(this.sort_friend_datas[index].role.id, this.sort_friend_datas[index].role.type);
        if (result[0]) {
            //已上阵，需要下阵   
            item.getComponent(Toggle).isChecked = false;
            this.friend_all_select--;
            if (this.friend_all_select <= 0) {
                this.friend_all_select = 0;
            }
            BattleReadyLogic.ins.RemoveBattleRoleByIndex(result[1]);
            this.sort_friend_datas[index].sort = 1;
        } else {
            if (result[2]) {
                //已上阵相同的职业。弹提示结束
                item.getComponent(Toggle).isChecked = false;
                Tips.Show(CfgMgr.GetText("battle_2"))
                return;
            }
            let positionType = BattleReadyLogic.ins.GetAttackIndexByPositionType(unitType.PositionType)
            //阵容是否已满
            if (positionType >= 0) {
                //未满，上阵
                item.getComponent(Toggle).isChecked = true;
                this.friend_all_select++;
                if (this.friend_all_select > this.friend_limit) {
                    item.getComponent(Toggle).isChecked = false;
                    this.friend_all_select = this.friend_limit;
                    this.friend_all_select--
                    Tips.Show("助战角色只能上阵" + this.friend_limit + "个");
                    return;
                }
                BattleReadyLogic.ins.AddBattleHeroByIndex(this.sort_friend_datas[index].role.id, positionType, this.sort_friend_datas[index].role, true);
                this.sort_friend_datas[index].sort = 2;
            } else {
                //已满，弹提示结束
                item.getComponent(Toggle).isChecked = false;
                Tips.Show(CfgMgr.GetText("battle_3"))
                return;
            }
        }


        this.sort_friend_datas = this.sortSelect(this.sort_friend_datas);
        this.list_scroller.UpdateDatas(this.sort_friend_datas);
        this.updateSelectCount();
    }


    //下一页
    private checkPage(data: { role: SPlayerDataRole, select: boolean, isend: boolean, friend: SAssistRoleInfo, sort: number }) {
        if (!(data.isend) && this.friend_datas[this.friend_datas.length - 1] == data) {
            data.isend = true;
            this.page++;
            this.onSend();
        }
    }

    private Sort() {
        if (!this.list_scroller) return;
        this.noneListCont.active = false;
        let roleData: { role: SPlayerDataRole, select: boolean, isend: boolean, friend: SAssistRoleInfo, sort: number }[];
        if (this.type == 0) {
            roleData = this.datas;
            //职业默认 排序默认 规则 出战、战力、品质、职业、等级
            //选择职业 排序默认 规则 职业、出战、战力、品质、等级
            //选择职业 排序战力 规则 职业、出战、战力、品质、等级
            //选择职业 排序品质 规则 职业、出战、品质、战力、等级
            //选择职业 排序等级 规则 职业、出战、等级、战力、品质

            if (this.sorts1 == 1) {
                this.sort_datas = roleData;
            } else {
                this.sort_datas = [];
                for (let data of roleData) {
                    let role_type = CfgMgr.GetRole()[data.role.type].PositionType;
                    if (role_type == (this.sorts1 - 1)) {
                        this.sort_datas.push(data);
                    }
                }
            }
            this.sort_datas = this.sortSelect(this.sort_datas);
            this.list_scroller.UpdateDatas(this.sort_datas);
        } else {
            roleData = this.friend_datas

            if (this.sorts1 == 1) {
                this.sort_friend_datas = roleData;
            } else {
                this.sort_friend_datas = [];
                for (let data of roleData) {
                    let role_type = CfgMgr.GetRole()[data.role.type].PositionType;
                    if (role_type == (this.sorts1 - 1)) {
                        this.sort_friend_datas.push(data);
                    }
                }
            }

            this.sort_friend_datas = this.sortSelect(this.sort_friend_datas);
            if (!this.sort_friend_datas || this.sort_friend_datas.length == 0) {
                this.noneListCont.active = true;
            }
            this.list_scroller.UpdateDatas(this.sort_friend_datas);
        }
        if (!roleData) return;
        this.list_scroller.ScrollToHead();
    }

    /**请求好友助战列表 */
    private onSend() {
        let data = {
            type: MsgTypeSend.GetAssistRolesRequest,
            data: { page: this.page, page_size: this.page_size }
        }
        Session.Send(data);
    }

    protected updateHead1(item: Node, data: number) {
        item.getChildByName("label").getComponent(Label).string = this.combo1Str[data];
    }
    protected async updateJobItem(item: Node, job: number) {
        let icon = item.getChildByName("icon").getComponent(Sprite);
        icon.node.active = false
        item.getChildByName("label").getComponent(Label).string = this.combo1Str[job];
    }

    protected updateHead2(item: Node, data: number) {
        item.getChildByName("label").getComponent(Label).string = this.combo2Str[data];
    }
    protected async updatequalityItem(item: Node, quality: number) {
        let icon = item.getChildByName("icon").getComponent(Sprite);
        icon.node.active = false
        item.getChildByName("label").getComponent(Label).string = this.combo2Str[quality];
    }

    private updateSelectCount() {
        this.my_lbl.string = "我的(" + this.my_all_select + "/" + this.limit + ")"
        this.friend_lbl.string = "好友(" + this.friend_all_select + "/" + this.friend_limit + ")"
        if(this.my_all_select == 0 && this.friend_all_select == 0){
            this.shangZhen.active = true;
            this.xiaZhen.active = false;
        }
    }

    private async updateItem(item: Node, data: { role: SPlayerDataRole, select: boolean, isend: boolean, friend: SAssistRoleInfo, sort: number }, index) {

        let is_assist = this.type ? (this.type == 1) : false
        let std = CfgMgr.GetRole()[data.role.type];
        let bg = item.getChildByName("bg").getComponent(Sprite);
        let icon = item.getChildByPath("Mask/icon").getComponent(Sprite);
        let typeIcon = item.getChildByPath("pos1").getComponent(Sprite);
        let di = item.getChildByPath("di").getComponent(Sprite);
        let tipsBtn = item.getChildByPath("tipsBtn").getComponent(Button);

        let callback = () => {
            if (is_assist) {
                Session.off(MsgTypeRet.GetAssistRoleByIDRet, this.getAssistRoleInfo, this);
                Session.on(MsgTypeRet.GetAssistRoleByIDRet, this.getAssistRoleInfo, this);
                let role_data = {
                    type: MsgTypeSend.GetAssistRoleByIDRequest,
                    data: { role_id: data.friend.role_id }
                }
                Session.Send(role_data);
            } else {
                this.roleInfoCallBack(data.role);
            }
        }

        tipsBtn.node.off("click", callback, this);
        tipsBtn.node.on("click", callback, this);
        di.color = new Color().fromHEX(bg_quality_color[data.role.quality]);
        let stdquality = CfgMgr.GetRoleQuality(data.role.type, data.role.quality);
        if (stdquality) {
            bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, CardQuality[data.role.quality] + "_bag_frame", "spriteFrame"), SpriteFrame);
        }
        typeIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "job" + std.PositionType, "spriteFrame"), SpriteFrame);
        icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_head_card, std.Icon, "spriteFrame"), SpriteFrame);

        let powerNode = item.getChildByName("power")
        powerNode.active = true;
        let role_name = item.getChildByName("role_name").getComponent(Label)
        let power = powerNode.getChildByName("value").getComponent(Label)
        let toggle = item.getComponent(Toggle)
        toggle.isChecked = false;
        let upbattle_role = BattleReadyLogic.ins.getUpBattleRole()
        for (let index = 0; index < upbattle_role.length; index++) {
            const element = upbattle_role[index];
            if (data.role.id == element.ID) {
                toggle.isChecked = true;
                break;
            }
        }
        let assistInfo = item.getChildByName("assistInfo");
        if (!is_assist) {
            assistInfo.active = false;
            let value = CountPower(data.role.type, data.role.level, data.role).toString();
            power.string = value + "";
            role_name.string = std.Name;
        } else {
            if (data.friend) {
                let assist_cost = item.getChildByPath("assistInfo/cost/assist_cost").getComponent(Label);
                let assist_count = item.getChildByPath("assistInfo/count/assist_count").getComponent(Label);
                assistInfo.active = true;
                power.string = data.friend.battle_power + ""
                role_name.string = data.friend.player_name;
                assist_cost.string = data.friend.usage_fee + "";
                assist_count.string = data.friend.daily_assist_count + "";
            }
        }

        if (this.isShowFriend) {
            this.checkPage(data);
        }
    }

    private getAssistRoleInfo(data) {
        if (data) {
            let role: SPlayerDataRole;
            role = {
                id: data.assist_role.id,
                type: data.assist_role.type,
                level: data.assist_role.level,
                experience: data.assist_role.experience,
                soldier_num: 0,
                active_skills: data.assist_role.active_skills,
                passive_skills: data.assist_role.passive_skills,
                is_in_building: false,
                building_id: data.assist_role.building_id,
                battle_power: data.assist_role.battle_attributes.battle_power,
                quality: data.assist_role.quality,
                skills: [],
                is_assisting: false,
                is_in_attack_lineup: false,
                is_in_defense_lineup: false,
                trade_cd: 0 
            }
            this.roleInfoCallBack(role);
        }
    }

    //好友助战数据
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
                        trade_cd: 0 
                    },
                    select: false,
                    isend: false,
                    friend: iterator,
                    sort: 1,
                }
                this.friend_datas.push(_data)
            }
        }
        this.sort_friend_datas = this.friend_datas;
        this.friends_scroller.UpdateDatas(this.sort_friend_datas);
    }

    //***click******************************************************************* */

    //职业筛选
    protected onSelectJob(value: number) {
        this.sorts1 = value;
        this.Sort();
    }

    //品质筛选
    protected onSelectquality(value: number) {
        this.sorts2 = value;
        this.Sort();
    }

    //一键助战
    private OnReadyClick(button: Button) {
        let roleDatas: { role: SPlayerDataRole, select: boolean, isend: boolean, friend: SAssistRoleInfo, sort: number }[];
        this.shangZhen.active = false;
        this.xiaZhen.active = true;
        this.roleInfoNode.active = false;
        if (this.type == 0) {
            roleDatas = this.datas
            this.my_all_select = this.limit - this.friend_all_select;
        } else {
            roleDatas = this.friend_datas
            this.friend_all_select = this.friend_limit;
        }
        roleDatas.sort((a, b) => b.role.battle_power - a.role.battle_power);

        roleDatas.sort((a, b) => {
            let aConfig = CfgMgr.GetRole()[a.role.type];
            let bConfig = CfgMgr.GetRole()[b.role.type];
            let aPos = aConfig.PositionType;
            let bPos = bConfig.PositionType;
            return aPos - bPos;
        });
        this.fillPosition(roleDatas, true);
        this.fillPosition(roleDatas, false);

        let data = this.sortSelect(roleDatas)

        this.sorts1 = 1;
        let node = this.combo1.node.getChildByPath("layout/input");
        this.updateHead1(node, this.sorts1)
        // 更新角色选择状态
        this.list_scroller.UpdateDatas(data);
        this.list_scroller.ScrollToHead();
        this.updateSelectCount();
    }

    /**一键助战排序 */
    private fillPosition(roleDatas: { role: SPlayerDataRole, select: boolean, isend: boolean, friend: SAssistRoleInfo, sort: number }[], condition: boolean) {
        if (condition)
            roleDatas.sort((a, b) => b.role.battle_power - a.role.battle_power);

        let max_select_num = 5
        if (this.type == 0) {
            max_select_num = 5
        } else {
            max_select_num = 1
        }

        for (let i = 0; i < max_select_num; i++) {
            if (BattleReadyLogic.ins.IsAttackerFull())
                break;
            if ((BattleReadyLogic.ins.indexs | (2 << i)) == BattleReadyLogic.ins.indexs)
                continue;

            let types = [1, 2, 3, 4]
            if (condition)
                types = i < 2 ? [1, 2] : [3, 4];

            for (let j = 0; j < roleDatas.length; j++) {
                let roleData = roleDatas[j];
                let config = CfgMgr.GetRole()[roleData.role.type];
                if (types.indexOf(config.PositionType) == -1)
                    continue;

                let result: [boolean, number, boolean] = BattleReadyLogic.ins.HasDeployment(roleData.role.id, roleData.role.type);
                if (result[0] || result[2])
                    continue;

                BattleReadyLogic.ins.AddBattleHeroByIndex(roleData.role.id, i, roleData.role);
                roleData.sort = 2;
                break;
            }
        }
    }

    /**一键下阵 */
    private onOneKeyRemove() {
        this.shangZhen.active = true;
        this.xiaZhen.active = false;
        BattleReadyLogic.ins.RemoveAllUpBattle();
        for (const iterator of this.sort_datas) {
            iterator.sort = 1;
        }
        for (const iterator of this.sort_friend_datas) {
            iterator.sort = 1;
        }
        this.my_all_select = 0;
        this.friend_all_select = 0;
        this.sorts1 = 1;
        let node = this.combo1.node.getChildByPath("layout/input");
        this.updateHead1(node, this.sorts1)
        this.Sort();
        this.updateSelectCount();
    }


    private sortSelect(roleDatas) {
        roleDatas.sort((a, b) => {
            if (this.sorts2 == 1 || this.sorts2 == 2) {
                if (a.sort == b.sort) {
                    if (b.role.battle_power == a.role.battle_power) {
                        if (b.role.quality == a.role.quality) {
                            return b.role.level - a.role.level;
                        }
                        return b.role.quality - a.role.quality;
                    }
                    return b.role.battle_power - a.role.battle_power;
                }
                return b.sort - a.sort
            } else if (this.sorts2 == 3) {
                if (a.sort == b.sort) {
                    if (b.role.quality == a.role.quality) {
                        if (b.role.battle_power == a.role.battle_power) {
                            return b.role.level - a.role.level;
                        }
                        return b.role.battle_power - a.role.battle_power;
                    }
                    return b.role.quality - a.role.quality;
                }
                return b.sort - a.sort
            } else if (this.sorts2 == 4) {
                if (a.sort == b.sort) {
                    if (b.role.level == a.role.level) {
                        if (b.role.battle_power == a.role.battle_power) {
                            return b.role.quality - a.role.quality;
                        }
                        return b.role.battle_power - a.role.battle_power;
                    }
                    return b.role.level - a.role.level;
                }
                return b.sort - a.sort
            }
        });

        return roleDatas;
    }

    //出战
    private OnStartBattleClick(button: Button) {
        Logger.log('StartBattle ----------->>>>>')
        if (this.isWaitBattle) return;
        BattleReadyLogic.ins.StartBattleConfirmation();
    }

    //出兵
    protected OnChuBingClick(button: Button) {
        if (this.isWaitBattle) return;
        if (BattleReadyLogic.ins.indexs > 0)
            SendOutTroopsPanel.Show();
        else {
            Tips.Show(CfgMgr.GetText("battle_4"));
        }
    }

    //关闭
    protected OnReadyCloseClick(button: Button) {
        AudioMgr.PlayOnce(Audio_CommonClick);
        if (PlayerData.fightState == FightState.PvP) {
            if (PlayerData.LootMatchList.length > 0) LootVsPanel.ShowTop();
        }
        BattleReadyLogic.ins.OnHide();
        this.Hide();
        BattleUI.Hide();
    }

    private updateRoleAttack(data): void {
        this.isWaitBattle = false;
    }

    private onRoleInfoNode() {
        this.roleInfoNode.active = false;
    }

    private async roleInfoCallBack(role: SPlayerDataRole) {
        if (!role) return;
        this.roleInfoNode.active = true;
        this.level.string = "Lv." + role.level;
        let prefab = CfgMgr.GetRole()[role.type].Prefab;
        this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role_p", prefab, prefab), sp.SkeletonData);
        this.body.setAnimation(0, `Idle`, true);

        let datas2: AttrSub[] = [];
        let AttrFightData = FormatRoleFightAttr(role)
        let attr_data_list = [];
        let id = [AttrFight.AttackVal, AttrFight.HPMax]
        for (let i = 0; i < id.length; i++) {
            for (let index = 0; index < AttrFightData.length; index++) {
                const element = AttrFightData[index];
                if (element.id == id[i]) {
                    attr_data_list.push(element)
                }
            }
        }

        // 附加属性
        let data1: AttrSub = {
            icon: null,
            name: "兵力数量",
            value: GetAttrValueByIndex(role, Attr.LeaderShip),
            next: 0,
            per: ""
        }
        datas2.push(data1);

        let data2: AttrSub = {
            icon: null,
            name: "攻击力",
            value: attr_data_list[0].value,
            next: 0,
            per: ""
        }
        datas2.push(data2);

        let data3: AttrSub = {
            icon: null,
            name: "生命值",
            value: attr_data_list[1].value,
            next: 0,
            per: ""
        }
        datas2.push(data3);

        this.midScroller.UpdateDatas(datas2);
        this.skillLayout.UpdateDatas(role.passive_skills);

        let battlePower = CountPower(role.type, role.quality, role);
        this.PowerLabel.font = "sheets/common/number/font2";
        this.PowerLabel.string = `${battlePower}`;

        let light = path.join("sheets/fanyu", CardQuality[role.quality], "spriteFrame");
        this.light.spriteFrame = await ResMgr.LoadResAbSub(light, SpriteFrame);
    }

    protected async updateAttrItem(item: Node, data: any) {
        let name = item.getChildByName("name")?.getComponent(Label);
        let now = item.getChildByName("nowValue")?.getComponent(Label);
        // let icon = item.getChildByName("iconJP")?.getComponent(Sprite);
        // if (data.icon) {
        //     icon.node.active = true;
        //     icon.spriteFrame = await ResMgr.LoadResAbSub(data.icon, SpriteFrame);
        // } else {
        //     icon.node.active = false;
        // }
        if (name) name.string = data.name;
        now.string = data.value + data.per;
    }

    private onUpdateSkill(item: Node, data: SPlayerDataSkill) {
        if (data) {
            let stdSkill: StdPassiveLevel = CfgMgr.GetPassiveSkill(data.skill_id, data.level);
            let icon = find(`Mask/icon`, item).getComponent(Sprite);
            let name = find(`skill_name`, item).getComponent(Label);
            let skillLV = find(`lvCont/lvLab`, item).getComponent(Label);
            if (stdSkill) {
                name.string = `${stdSkill.Name}`;
                skillLV.string = `${stdSkill.Level}`;
                name.color = new Color().fromHEX(skill_quality_color[stdSkill.RareLevel]);
                let iconUrl: string = path.join(folder_skill, stdSkill.Icon.toString(), "spriteFrame");
                ResMgr.LoadResAbSub(iconUrl, SpriteFrame, res => {
                    icon.spriteFrame = res;
                });
            }
        }
    }

    protected update(dt: number): void {
    }

    protected onHide(...args: any[]): void {
        this.isWaitBattle = false;
        this.type = null;
        this.navBar.children[0].getComponent(Toggle).isChecked = true;
        if (SendOutTroopsPanel.Showing)
            SendOutTroopsPanel.Hide();
    }

} 