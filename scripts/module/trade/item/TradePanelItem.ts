import { _decorator, Component, find, Input, Label, Node, path, Sprite, SpriteFrame, System, Tween, tween, TweenSystem } from 'cc';
import PlayerData, { SOrderData, SOrderType, SPlayerDataSkill } from '../../roleModule/PlayerData';
import Logger from '../../../utils/Logger';
import { RoleMsgPanel } from '../RoleMsgPanel';
import { CardQuality, CfgMgr, StdCommonType, StdPassiveLevel } from '../../../manager/CfgMgr';
import { ResMgr, folder_common, folder_head_card, folder_icon, folder_quality, folder_skill } from '../../../manager/ResMgr';
import { AutoScroller } from '../../../utils/AutoScroller';
import { copyToClip, countDown, ToFixed } from '../../../utils/Utils';
import { BagItem } from '../../bag/BagItem';
import { BuyPanel } from '../BuyPanel';
import { MsgTypeSend } from '../../../MsgType';
import { Session } from '../../../net/Session';
import { TradePanel } from '../TradePanel';
import { TradeCreateOrderPanel } from '../TradeCreateOrderPanel';
import { CopyToClip } from '../../../Platform';
import { MsgPanel } from '../../common/MsgPanel';
import { PassiveSkillTipsPanel } from '../../common/PassiveSkillTipsPanel';
const { ccclass, property } = _decorator;

@ccclass('TradePanelItem')
export class TradePanelItem extends Component {
    start() {

    }

    update(deltaTime: number) {

    }

    public async SetData(data: SOrderData, selectType: number, selectGroup: number) {
        let item = this.node;
        let resetItem = (bagItem) => {
            bagItem.children.forEach((node) => {
                node.active = false;
                if (node.name == `bg` || node.name == `maskbg` || node.name == `icon`) {
                    node.active = true;
                }
            })
        }
        let bagItem = item.getChildByName(`BagItem`);
        if (!bagItem) {
            item.children.forEach((Node) => {
                if (Node.getComponent(BagItem)) bagItem = Node
            })
        }
        resetItem(bagItem)

        let btnBuy = item.getChildByName(`BtnBuy`);
        let btnSell = item.getChildByName(`BtnSell`);
        btnBuy.getComponent(Sprite).grayscale = data.player_id == PlayerData.roleInfo.player_id;
        btnSell.getComponent(Sprite).grayscale = data.player_id == PlayerData.roleInfo.player_id;
        btnBuy.off(Input.EventType.TOUCH_END);
        btnSell.off(Input.EventType.TOUCH_END);
        if (data.order_type == `sell`) {
            btnBuy.active = true;
            btnSell.active = false;
            btnBuy.on(Input.EventType.TOUCH_END, () => {
                //打开购买页面
                if (data.player_id != PlayerData.roleInfo.player_id) {
                    if (data.things.data[0].role) {
                        RoleMsgPanel.Show(SOrderType.BUY, data)
                    } else {
                        console.log(data)
                        BuyPanel.Show(SOrderType.BUY, data)
                    }
                }
            })
        } else {
            btnBuy.active = false;
            btnSell.active = true;
            btnSell.on(Input.EventType.TOUCH_END, () => {
                //打开出售页面
                if (data.player_id != PlayerData.roleInfo.player_id) {
                    if (data.things.data[0].role) {
                        RoleMsgPanel.Show(SOrderType.SELL, data)
                    } else {
                        BuyPanel.Show(SOrderType.SELL, data)
                    }
                }
            })
        }

        let msgNode = item.getChildByName(`msgItem`);
        item.getChildByName(`msgItem`).active = false;
        item.getChildByName(`msgRole`).active = false;
        let itemData = data.things.data[0].item;
        let roleData = data.things.data[0].role;
        let resource = data.things.data[0].resource;

        let item_data = bagItem.getComponent(BagItem);
        item_data = item_data ? item_data : bagItem.addComponent(BagItem);
        item_data.SetData(data.things.data[0]);
        item_data.setIsShowSelect(false);
        item_data.setIsShowTips(true);

        if (selectType == 1 && selectGroup == 0) {//购买角色
            if (roleData) {
                msgNode = item.getChildByName(`msgRole`);
                let help = find(`help`, msgNode);
                let skillNum = find(`skillNum`, msgNode).getComponent(Label);
                let skillLayout = find(`skillLayout`, msgNode).getComponent(AutoScroller);
                skillNum.string = `${roleData.passive_skills.length}/10`
                help.on(Input.EventType.TOUCH_END, () => { });
                skillLayout.SetHandle(this.onUpdateSkill.bind(this));
                skillLayout.UpdateDatas(roleData.passive_skills);
            }
        } else {//道具或者求购角色
            let name = find(`Name`, msgNode).getComponent(Label);
            let count = find(`Count`, msgNode).getComponent(Label);
            if (itemData || resource) {
                if (resource) {
                    let itemId = 6;
                    if (resource.rock > 0) {
                        itemId = 7;
                    } else if (resource.seed > 0) {
                        itemId = 9;
                    } else if (resource.water > 0) {
                        itemId = 8;
                    }
                    itemData = {
                        id: itemId,
                        count: data.unit_count,
                    }
                }
                let itemCfg = CfgMgr.Getitem(itemData.id);
                name.string = itemCfg.ItemName;
            } else if (roleData) {
                let stdRole = CfgMgr.GetRole()[roleData.type];
                name.string = stdRole.Name;
            }
            count.string = `${data.unit_count}`;
        }
        msgNode.active = true;
        let icon = find(`icon`, msgNode).getComponent(Sprite);
        icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_common, data.order_type, "spriteFrame"), SpriteFrame);
        let time = find(`time`, msgNode).getComponent(Label);
        let playerName = find(`playerName`, msgNode).getComponent(Label);
        let price = find(`PriceLayout/Price`, msgNode).getComponent(Label);

        playerName.string = data.player_name;
        price.string = `${ToFixed(data.unit_value, 2)}`;
        time.string = `剩余时间：${countDown(data.close_time)}`;
        if (TweenSystem.instance.ActionManager.getNumberOfRunningActionsInTarget(item) > 0) {
            Tween.stopAllByTarget(item);
        }
        tween(item).repeatForever(tween().delay(1).call(() => {
            time.string = `剩余时间：${countDown(data.close_time)}`;
        })).start();
    }

    public async SetOrderData(data: SOrderData, selectType: number) {
        let item = this.node;
        let empty = item.getChildByName(`empty`);
        let bagItem = item.getChildByName(`BagItem`);
        if (!bagItem) {
            item.children.forEach((Node) => {
                if (Node.getComponent(BagItem)) bagItem = Node
            })
        }
        let msgNode = item.getChildByName(`msgItem`);
        if (data) {
            empty.active = false;
            bagItem.active = true;
            msgNode.active = true;
            bagItem.children.forEach((node) => {
                node.active = false;
                if (node.name == `bg` || node.name == `maskbg` || node.name == `icon`) {
                    node.active = true;
                }
            })
            let itemData = data.things.data[0].item;
            let roleData = data.things.data[0].role;
            let resource = data.things.data[0].resource;

            let name = find(`name`, msgNode).getComponent(Label);
            let item_data = bagItem.getComponent(BagItem);
            item_data = item_data ? item_data : bagItem.addComponent(BagItem);
            item_data.SetData(data.things.data[0]);
            item_data.setIsShowSelect(false);
            item_data.setIsShowTips(true);
            if (itemData || resource) {
                if (resource) {
                    let itemId = 6;
                    if (resource.rock > 0) {
                        itemId = 7;
                    } else if (resource.seed > 0) {
                        itemId = 9;
                    } else if (resource.water > 0) {
                        itemId = 8;
                    }
                    itemData = {
                        id: itemId,
                        count: data.unit_count,
                    }
                }
                let itemCfg = CfgMgr.Getitem(itemData.id);
                name.string = itemCfg.ItemName;
            } else if (roleData) {
                let stdRole = CfgMgr.GetRole()[roleData.type];
                name.string = stdRole.Name;
            }

            let count = find(`countLayout/count`, msgNode).getComponent(Label);
            count.string = `${data.unit_count}`;

            let time = find(`time`, msgNode).getComponent(Label);
            time.string = `剩余时间：${countDown(data.close_time)}`;
            if (TweenSystem.instance.ActionManager.getNumberOfRunningActionsInTarget(item) > 0) {
                Tween.stopAllByTarget(item);
            }
            tween(item).repeatForever(tween().delay(1).call(() => {
                time.string = `剩余时间：${countDown(data.close_time)}`;
            })).start();

            let price = find(`priceLayout/Price`, msgNode).getComponent(Label);
            price.string = `${ToFixed(data.unit_value,2)}`;


            let code = find(`code`, msgNode).getComponent(Label);
            let copyCodeBtn = find(`copyCodeBtn`, msgNode);
            let less = find(`lessLayout/less`, msgNode).getComponent(Label);
            let cost = find(`costLayout/cost`, msgNode).getComponent(Label);
            let costTitle = find(`costTitle`, msgNode);
            if (data.order_type == `sell`) {
                cost.string = `${Math.ceil(data.unit_count * data.unit_value * CfgMgr.GetCommon(StdCommonType.Bourse).Fees * 100) / 100}`
                less.node.parent.active = false;
                code.node.active = true;
                copyCodeBtn.active = true;
                code.string = `${data.view_id}`
                msgNode.getChildByName(`codeTtitle`).active = true;
                msgNode.getChildByName(`lessTtitle`).active = false;
                cost.node.parent.active = true
                costTitle.active = true

                copyCodeBtn.on(Input.EventType.TOUCH_END, () => {
                    TradePanel.ins.SetCopyCode(data.view_id);
                    CopyToClip(data.view_id, (desc: string) => {
                        if (desc == data.view_id) {
                            MsgPanel.Show("已复制到粘贴板");
                        }
                    });
                })
            } else {
                less.node.parent.active = true;
                code.node.active = false;
                copyCodeBtn.active = false;
                less.node.active = true;
                less.string = `${ToFixed(data.unit_value * data.unit_count,2)}`;
                msgNode.getChildByName(`lessTtitle`).active = true;
                msgNode.getChildByName(`codeTtitle`).active = false;
                cost.node.parent.active = false
                costTitle.active = false
            }

            let removeBtn = find(`removeBtn`, msgNode);
            removeBtn.off(Input.EventType.TOUCH_END);
            removeBtn.on(Input.EventType.TOUCH_END, () => {
                let sessionData = {
                    type: MsgTypeSend.ExchangesCancelOrder,
                    data: {
                        order_id: data.order_id
                    }
                }
                Session.Send(sessionData);
            })
        } else {
            empty.active = true;
            bagItem.active = false;
            msgNode.active = false;
            empty.off(Input.EventType.TOUCH_END);
            empty.on(Input.EventType.TOUCH_END, (() => {
                Logger.log("打开订单页面>>>", selectType);
                TradeCreateOrderPanel.Show(selectType)
            }))
        }
    }

    private async onUpdateSkill(item: Node, data: SPlayerDataSkill) {
        if (data) {
            item.off(Node.EventType.TOUCH_END);
            item.on(Node.EventType.TOUCH_END, () => {
                PassiveSkillTipsPanel.Show(data);
            }, this);
            let stdSkill: StdPassiveLevel = CfgMgr.GetPassiveSkill(data.skill_id, data.level);
            if (stdSkill) {
                let bg = item.getChildByName(`frame`).getComponent(Sprite)
                bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, "p_skill_bg_" + stdSkill.RareLevel, "spriteFrame"), SpriteFrame);


                let iconUrl: string = path.join(folder_skill, stdSkill.Icon.toString(), "spriteFrame");
                ResMgr.LoadResAbSub(iconUrl, SpriteFrame, res => {
                    item.getChildByPath(`Mask/icon`).getComponent(Sprite).spriteFrame = res;
                });
            }
        }
    }
}


