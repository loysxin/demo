import { _decorator, Button, find, Input, Label, Node, path, Sprite, SpriteFrame, tween } from 'cc';
import { Panel } from '../../../GameRoot';
import { Convert, ConvertNode, ToFixed, formatNumber } from '../../../utils/Utils';
import PlayerData, { SSimpleData } from '../../roleModule/PlayerData';
import { Tips } from '../../login/Tips';
import { AddCollectTime } from './AddCollectTime';
import { CfgMgr, ConditionType, ShopGroupId, StdCommonType, StdHomeLand, StdSysId, StdSystemOpen } from '../../../manager/CfgMgr';
import { HomeLogic } from '../HomeLogic';
import { UnlockHomeLandPanel } from './UnlockHomeLandPanel';
import { EventMgr, Evt_Building_Upgrade_Complete, Evt_EnterHome, Evt_FightChange, Evt_FlushWorker, Evt_Layout_Status_Bar, Evt_Mail_Add, Evt_TaskChange, Goto } from '../../../manager/EventMgr';
import { folder_home, ResMgr } from '../../../manager/ResMgr';
import { BuildingType, CanSet } from '../HomeStruct';
import { HomeItem } from './HomeItem';
import { LeftLowerGroup } from './LeftLowerGroup';
import { MsgPanel } from '../../common/MsgPanel';
import { CheckCondition } from '../../../manager/ConditionMgr';
import { AdaptBgTop } from '../../common/BaseUI';
import { PANEL_TYPE } from '../../../manager/UIGuide';
import { GameSet } from '../../GameSet';
import { ShopPanel } from '../../shop/ShopPanel';
import { MarqueePanel } from './MarqueePanel';
import { NoticePanel } from '../../notice/NoticePanel';
import { AdHelper } from '../../../AdHelper';
import { SignPanel } from '../../task/SignPanel';
import { AdPanel } from './AdPanel';
import { Audio_ArrowClick, Audio_BottomClick, AudioMgr } from '../../../manager/AudioMgr';
import { Session } from '../../../net/Session';
import { MsgTypeRet, MsgTypeSend } from '../../../MsgType';
import { WelfareAdPanel } from '../../welfare/WelfareAdPanel';
import { SettingPanel } from '../../setting/SettingPanel';
import { DateUtils } from '../../../utils/DateUtils';

import { CurrencyIncomInfoPanel } from '../../currencyIncomInfo/CurrencyIncomInfoPanel';

import { UserInfoPanel } from '../../userInfo/UserInfoPanel';
import { HeadItem } from '../../common/HeadItem';
import { RankPanel } from '../../rank/RankPanel';
import { GuildNonePanel } from '../../guild/GuildNonePanel';
import { GuildPanel } from '../../guild/GuildPanel';
import { rightsPanel } from '../../rights/rightsPanel';
import { hasSdk } from '../../../Platform';

const { ccclass, property } = _decorator;

@ccclass('HomeUI')
export class HomeUI extends Panel {
    protected prefab: string = 'prefabs/home/HomeUI';
    private head:HeadItem;
    private rock: Label;
    private wood: Label;
    private water: Label;
    private seed: Label;
    private battle: Label;
    private currency: Label;
    private labelLayout: Node;

    /**左功能按钮*/
    private topLeftBtnCont: Node;
    private moreBtn: Button;//更多
    private settingBtn: Button;//设置
    private noticeBtn: Button;//公告

    /**左功能按钮*/
    private leftGroup: Node;
    private collectBtn: Button;//采集时长
    private rightsCardBtn: Button;//权益卡
    private shop: Button;//商城
    private welfare: Button;//福利

    private leftLowerGroup: LeftLowerGroup;//左下角任务与频道消息

    /**右上功能按钮*/
    private fishBtn: Button;//钓鱼
    private signBtn: Button;//七日签到

    /**右边功能按钮*/
    private rightBtnCont: Node;
    private guildBtn: Button;//公会
    private rankBtn: Button;//排行榜
    private friendBtn: Button;//好友
    private mailBtn: Button;//邮件
    private bagBtn: Button;//背包
    private rightShrinkList: Node[];//右边收缩按钮列表
    private rightArrowBtn: Button;//右边箭头

    /**底部功能按钮 */
    private roleBtn: Button;//角色
    private dealBtn: Button;//交易
    private homeBtn: Button;//家园
    private outdoorBtn: Button;//探险
    private snatchBtn: Button;//抢夺
    private homeCont: Node;//家园列表容器
    private homeItemList: HomeItem[] = [];//家园列表脚本
    protected onLoad(): void {
        this.head = this.find('top/HeadItem').addComponent(HeadItem);
        this.head.SetClickBc(this.onHeadClick.bind(this));
        this.rock = this.find('top/topLayout/stone/Label', Label);
        this.wood = this.find('top/topLayout/tree/Label', Label);
        this.water = this.find('top/topLayout/water/Label', Label);
        this.seed = this.find('top/topLayout/seed/Label', Label);
        this.battle = this.find('top/abilityLayout/battle/Label', Label);
        this.find('top/abilityLayout/currency').on(Input.EventType.TOUCH_END,()=>{CurrencyIncomInfoPanel.Show()},this);
        this.currency = this.find('top/abilityLayout/currency/Label', Label);
        this.labelLayout = this.find("labelLayout");

        this.moveToLay(this.rock);
        this.moveToLay(this.wood);
        this.moveToLay(this.water);
        this.moveToLay(this.seed);
        this.moveToLay(this.battle);
        this.moveToLay(this.currency);

        this.moreBtn = this.find('topLeftGroup/more').getComponent(Button);
        this.topLeftBtnCont = this.find('topLeftGroup/btnCont');
        this.settingBtn = this.find('topLeftGroup/btnCont/setting').getComponent(Button);
        this.noticeBtn = this.find('topLeftGroup/btnCont/notice').getComponent(Button);

        this.leftGroup = this.find('leftGroup');
        this.collectBtn = this.find('leftGroup/collect').getComponent(Button);
        this.rightsCardBtn = this.find('leftGroup/rightsCard').getComponent(Button);
        this.shop = this.find('leftGroup/shop').getComponent(Button);
        this.welfare = this.find('leftGroup/welfare').getComponent(Button);

        this.fishBtn = this.find('topRightGroup/fish').getComponent(Button);
        this.signBtn = this.find('topRightGroup/sign').getComponent(Button);

        this.rightBtnCont = this.find('rightGroup/btnCont');
        this.bagBtn = this.find('rightGroup/btnCont/bag').getComponent(Button);
        this.guildBtn = this.find('rightGroup/btnCont/guild').getComponent(Button);
        this.rankBtn = this.find('rightGroup/btnCont/rank').getComponent(Button);
        this.friendBtn = this.find('rightGroup/btnCont/friend').getComponent(Button);
        this.mailBtn = this.find('rightGroup/btnCont/mail').getComponent(Button);
        this.rightArrowBtn = this.find('rightGroup/arrowBtn').getComponent(Button);
        this.rightShrinkList = [this.guildBtn.node, this.rankBtn.node, this.friendBtn.node, this.mailBtn.node];

        this.roleBtn = this.find('bottomGroup/role/btn').getComponent(Button);
        this.dealBtn = this.find('bottomGroup/deal/btn').getComponent(Button);
        this.homeBtn = this.find('bottomGroup/home/btn').getComponent(Button);
        this.outdoorBtn = this.find('bottomGroup/outdoor/btn').getComponent(Button);
        this.snatchBtn = this.find('bottomGroup/snatch/btn').getComponent(Button);
        this.homeCont = this.find('bottomGroup/home/homeCont');

        this.find("topRightGroup/Button").on(Button.EventType.CLICK, btn => {
            AdPanel.Show();
        }, this);

        this.leftLowerGroup = this.find('leftLowerGroup').addComponent(LeftLowerGroup);

        this.moreBtn.node.on(Button.EventType.CLICK, this.onTopLeftClick, this);
        this.settingBtn.node.on(Button.EventType.CLICK, this.onTopLeftClick, this);
        this.noticeBtn.node.on(Button.EventType.CLICK, this.onTopLeftClick, this);

        this.collectBtn.node.on(Button.EventType.CLICK, this.onLeftClick, this);
        this.rightsCardBtn.node.on(Button.EventType.CLICK, this.onLeftClick, this);
        this.shop.node.on(Button.EventType.CLICK, this.onLeftClick, this);
        this.welfare.node.on(Button.EventType.CLICK, this.onLeftClick, this);

        this.fishBtn.node.on(Button.EventType.CLICK, this.onTopRightClick, this);
        this.signBtn.node.on(Button.EventType.CLICK, this.onTopRightClick, this);



        this.guildBtn.node.on(Button.EventType.CLICK, this.onRightClick, this);
        this.rankBtn.node.on(Button.EventType.CLICK, this.onRightClick, this);
        this.friendBtn.node.on(Button.EventType.CLICK, this.onRightClick, this);
        this.mailBtn.node.on(Button.EventType.CLICK, this.onRightClick, this);
        this.bagBtn.node.on(Button.EventType.CLICK, this.onRightClick, this);
        this.rightArrowBtn.node.on(Button.EventType.CLICK, this.onRightClick, this);

        for (const homeNode of this.homeCont.children) {
            let homeItem = homeNode.addComponent(HomeItem);
            let thisObj = this;
            homeItem.SetClickCb((data: StdHomeLand) => {
                thisObj.onHomeClick(data);
            })
            this.homeItemList.push(homeItem);
        }
        this.roleBtn.node.on(Button.EventType.CLICK, this.onBottomClick, this);
        this.dealBtn.node.on(Button.EventType.CLICK, this.onBottomClick, this);
        this.homeBtn.node.on(Button.EventType.CLICK, this.onBottomClick, this);
        this.outdoorBtn.node.on(Button.EventType.CLICK, this.onBottomClick, this);
        this.snatchBtn.node.on(Button.EventType.CLICK, this.onBottomClick, this);

        EventMgr.on(Evt_EnterHome, this.onEnterHome, this);
        EventMgr.on(Evt_Mail_Add, this.onAddMail, this);
        EventMgr.on(Evt_Building_Upgrade_Complete, this.onBuildUpdate, this);
        EventMgr.on(Evt_FightChange, this.onFightChange, this);

        if (hasSdk()) {
            if (GameSet.Server_cfg.Mark) {
                this.collectBtn.node.active = false;
            } else {
                this.rightsCardBtn.node.active = false;
            }
        }
    }

    private moveToLay(label: Label) {
        label.cacheMode = Label.CacheMode.BITMAP;
        let [x, y] = ConvertNode(label.node, this.labelLayout);
        this.labelLayout.addChild(label.node);
        label.node.setPosition(x, y);
    }
    private onHeadClick(data:SSimpleData):void{
        UserInfoPanel.Show(data);
    }
    
    private onTopLeftClick(btn: Button): void {
        switch (btn) {
            case this.moreBtn:
                AudioMgr.PlayOnce(Audio_ArrowClick);
                this.topLeftBtnCont.active = !this.topLeftBtnCont.active;
                break;
            case this.settingBtn:
                AudioMgr.PlayOnce(Audio_BottomClick);
                //MsgPanel.Show("---->")

                SettingPanel.Show();
                break;
            case this.noticeBtn:
                AudioMgr.PlayOnce(Audio_BottomClick);
                NoticePanel.Show();
                break;
        }
    }
    private async onLeftClick(btn: Button) {
        AudioMgr.PlayOnce(Audio_BottomClick);
        switch (btn) {
            case this.collectBtn:
                AddCollectTime.Show();
                break;
            case this.rightsCardBtn:
                rightsPanel.Show();
                break;
            case this.shop:
                ShopPanel.Show(ShopGroupId.BaseShop);
                break;
            case this.welfare:
                WelfareAdPanel.Show();
                break;
        }
    }

    private onTopRightClick(btn: Button): void {
        AudioMgr.PlayOnce(Audio_BottomClick);
        switch (btn) {
            case this.fishBtn:
                Goto(PANEL_TYPE.FishingPanel);
                break;
            case this.signBtn:
                // PlayerData.TipsList.push({ type: `1`, content: `测试公告1`, icon: "", speed: 1 });
                // PlayerData.TipsList.push({ type: `1`, content: `测试公告2`, icon: "", speed: 2 });
                // PlayerData.TipsList.push({ type: `1`, content: `测试公告3`, icon: "", speed: 3 });
                // if (!MarqueePanel.Showing) MarqueePanel.ShowTop();
                SignPanel.Show();
                break;
        }
    }

    private onRightClick(btn: Button): void {
        switch (btn) {
            case this.guildBtn:
                AudioMgr.PlayOnce(Audio_BottomClick);
                if(PlayerData.MyGuild){
                    GuildPanel.Show();
                }else{
                    GuildNonePanel.Show();
                }
                break;
            case this.rankBtn:
                AudioMgr.PlayOnce(Audio_BottomClick);
                RankPanel.Show();
                // MsgPanel.Show("系统暂未开放");
                break;
            case this.friendBtn:
                AudioMgr.PlayOnce(Audio_BottomClick);
                Goto(PANEL_TYPE.FriendPanel);
                break;
            case this.mailBtn:
                AudioMgr.PlayOnce(Audio_BottomClick);
                Goto(PANEL_TYPE.MailPanel);
                break;
            case this.bagBtn:
                AudioMgr.PlayOnce(Audio_BottomClick);
                Goto(PANEL_TYPE.BagPanel);
                break;
            case this.rightArrowBtn:
                AudioMgr.PlayOnce(Audio_ArrowClick);
                this.toRightEffect();
                break;
        }
    }

    private onBottomClick(btn: Button): void {
        AudioMgr.PlayOnce(Audio_BottomClick);
        switch (btn) {
            case this.roleBtn:
                Goto(PANEL_TYPE.RolePanel);
                break;
            case this.dealBtn:
                AudioMgr.playSound("transaction", false);
                Goto(PANEL_TYPE.TradePanel);
                break;
            case this.homeBtn:
                if (this.homeCont.active) {
                    this.homeCont.active = false;
                } else {
                    this.homeCont.active = true;
                }
                break;
            case this.outdoorBtn:
                Goto(PANEL_TYPE.PvePanel);
                break;
            case this.snatchBtn:
                // let needLv: number = CfgMgr.GetCommon(StdCommonType.PVP).PVPOpenLevel;
                // if (CheckCondition(ConditionType.Home_1, needLv)) {
                //     Tips.Show(`主基地${needLv}级后开启抢夺功能！`);
                //     return;
                // }
                Goto(PANEL_TYPE.LootPanel);
                break;
        }
    }
    private toRightEffect(): void {
        this.rightArrowBtn.interactable = false;
        if (this.rightArrowBtn.node.angle == 0) {
            tween(this.rightArrowBtn.node)
                .by(0.3, { angle: -180 }, {
                    easing: "backIn",
                })
                .call(() => {
                    this.rightArrowBtn.interactable = true;
                    this.toRightShrink(false);
                })
                .start();
        } else {
            tween(this.rightArrowBtn.node)
                .to(0.3, { angle: 0 }, {
                    easing: "backOut",
                })
                .call(() => {
                    this.rightArrowBtn.interactable = true;
                    this.toRightShrink(true);
                })
                .start();
        }
    }
    private toRightShrink(isShow: boolean): void {
        let group = { bag: 1, friend: 5, mail: 4 }
        for (let node of this.rightShrinkList) {
            if (group[node.name]) {//开启判断
                node.active = false;
                let stdSys:{[key:string]:StdSystemOpen} = CfgMgr.GetSysOpenMap();
                for (let k in stdSys) {
                    let std: StdSystemOpen = stdSys[k];
                    if (std.ID == group[node.name] && std.HideType == 0) {
                        let seed = true;
                        for (let n = 1; ; n++) {
                            let types = std['ConditionId' + n];
                            let values = std['ConditionValue' + n];
                            if (types == undefined || values == undefined) break;
                            for (let i = 0; i < types.length; i++) {
                                let type = types[i];
                                let value = values[i];
                                if (CheckCondition(type, value)) {
                                    seed = false;
                                    break;
                                }
                            }
                        }
                        if (seed) {
                            node.active = isShow;
                            break;
                        } else {
                            node.active = false;
                            break;
                        }
                    }
                }
            } else {
                node.active = isShow;
            }
        }
    }
    private updateBottonLock(): void {
        // this.updateSnatchLock();
       let is_open = PlayerData.GetSysIsOpen(StdSysId.Sys_7)
       if(is_open && PlayerData.LootPlayerData == null){
            Session.Send({ type: MsgTypeSend.GetMatchPlayerData, data: { player_id: PlayerData.roleInfo.player_id } });
       }
    }

    private updateSnatchLock(): void {
        let lock: Node = this.snatchBtn.node.getChildByName("lock");
        let unlock: Node = this.snatchBtn.node.getChildByName("unlock");
        let needLv: number = CfgMgr.GetCommon(StdCommonType.PVP).PVPOpenLevel;
        let buildings = PlayerData.GetBuildingByType(BuildingType.ji_di, 101);
        let curLv: number = buildings && buildings.length ? buildings[0].level : 0;
        if (curLv < needLv) {
            lock.active = true;
            unlock.active = false;
        } else {
            lock.active = false;
            unlock.active = true;
        }
    }

    protected onEnterHome(homeId: number) {
        let icon: Sprite = this.homeBtn.node.getChildByName("unlock").getComponent(Sprite);
        let stds: StdHomeLand[] = CfgMgr.Get("homeland_init");
        let homeDataList: StdHomeLand[] = [];
        for (let i = 0; i < stds.length; i++) {
            if (stds[i].HomeId == homeId) {
                let url = path.join(folder_home, `home_${homeId}`, "spriteFrame");
                ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                    icon.spriteFrame = res;
                });
            } else {
                homeDataList.push(stds[i]);
            }
        }
        homeDataList.sort((a: StdHomeLand, b: StdHomeLand) => {
            return b.HomeId - a.HomeId;
        })
        for (let index = 0; index < homeDataList.length; index++) {
            this.homeItemList[index].getComponent(HomeItem).SetData(homeDataList[index]);

        }
    }

    protected onAddMail(num: number) {
        if (num) {
            this.mailBtn.node.getChildByName("isNew").active = true;
        } else {
            this.mailBtn.node.getChildByName("isNew").active = false;
        }
    }

    private onBuildUpdate(): void {
        this.checkFishBtnState();
        this.updateBottonLock();
    }
    private onFightChange(): void {
        this.updateFight();
    }

    static async Show(...args) {
        super.ShowUI(...args);
    }

    protected onShow(...arg: any[]): void {
        AdaptBgTop(this.node.getChildByPath("top/bg"));
    }

    static Visible(value: boolean) {
        this.$instance.node.active = value;
    }

    public flush(...args: any[]): void {
        if (hasSdk()) {
            if (GameSet.Server_cfg.Mark) {
                this.collectBtn.node.name = "lockcollectBtn";
                this.collectBtn.node.active = false;
            } else {
                this.rightsCardBtn.node.name = "lockrightsCard";
                this.rightsCardBtn.node.active = false;
            }
        }
        let res = PlayerData.resources;
        this.rock.string = formatNumber(res.rock, 2);
        this.wood.string = formatNumber(res.wood, 2);
        this.water.string = formatNumber(res.water, 2);
        this.seed.string = formatNumber(res.seed, 2);
        this.currency.string = ToFixed(PlayerData.roleInfo.currency, 2);
        this.updateFight();
        this.checkFishBtnState();
        this.leftLowerGroup.UpdateShow();
        let data:SSimpleData = {
            player_id:PlayerData.roleInfo.player_id,
            name:PlayerData.roleInfo.name,
            weChatNum:PlayerData.roleInfo.weChatNum,
            qqNum:PlayerData.roleInfo.qqNum,
        };
        this.head.SetData(data);
        // this.updateBottonLock();
    }

    protected onHide(...args: any[]): void {

    }

    private checkFishBtnState(): void {
        let openLv: number = CfgMgr.GetFishCommon.OpenLevel;
        var buildings = PlayerData.GetBuildingByType(BuildingType.ji_di, 101);
        this.fishBtn.node.active = buildings && buildings.length > 0 && buildings[0].level >= openLv;
    }

    private onHomeClick(data: StdHomeLand): void {
        this.homeCont.active = false;
    }

    private updateFight(): void {
        this.battle.string = formatNumber(PlayerData.roleInfo.battle_power, 2);
    }


    showHomeList() {

        //let trans = this.homeList.getComponent(UITransform);
        //Tween.stopAllByTarget(trans);
        //tween(trans).to(0.1, { contentSize: new Size(190, leng) }).start();
    }

    hideHomeList() {
        this.homeCont.active = false;
        //let homeList = this.homeList;
        //let trans = homeList.getComponent(UITransform);
        //Tween.stopAllByTarget(trans);
        //tween(trans).to(0.1, { contentSize: new Size(190, 0) }).call(() => {
        //homeList.active = false;
        //}).start();
    }

    onOpenHomeLand(e: Button) {
        this.hideHomeList();
        let homeId = Number(e.node.name);
        if (!homeId) return;
        for (let info of PlayerData.roleInfo.homelands) {
            if (info.id == homeId) {
                HomeLogic.ins.EnterMyHomeScene(info.id);
                return;
            }
        }
        UnlockHomeLandPanel.Show(homeId);
    }
}


