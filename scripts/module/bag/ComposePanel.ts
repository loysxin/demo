import { Button, Component, EventTouch, Input, Label, Node, Sprite, SpriteFrame, Toggle, path, sp, tween } from "cc";
import { Panel } from "../../GameRoot";
import { BagItem } from "./BagItem";
import PlayerData, { CountPower, RoleCardPower, SPlayerDataItem } from "../roleModule/PlayerData";
import { AutoScroller } from "../../utils/AutoScroller";
import { Attr, CardQuality, CfgMgr, ItemSubType, ItemType, Job, JobName, StdCommonType, StdItem } from "../../manager/CfgMgr";
import { AttrSub, FormatCardRoleAttr, UpdateBagItem } from "../common/BaseUI";
import { ResMgr, folder_icon, folder_item } from "../../manager/ResMgr";
import { ComboBox } from "../../utils/ComboBox";
import { Tips } from "../login/Tips";
import Logger from "../../utils/Logger";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { EventMgr, Evt_Compose } from "../../manager/EventMgr";
import { formatNumber, SetLabelColor } from "../../utils/Utils";
import { CLICKLOCK } from "../common/Drcorator";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";
import { AudioMgr, Audio_GetReward } from "../../manager/AudioMgr";

export class ComposePanel extends Panel {
    protected prefab: string = "prefabs/panel/bag/ComposePanel";
    private level: Label;
    private body: sp.Skeleton;
    private targetName: Label;
    private quality: Sprite;
    private jobIcon: Sprite;
    private jobName: Label;
    private count: Label;
    private power: Label;
    private composeBtn: Node;
    private icon: Sprite;
    private collectAttrCont:Node;
    private collectAttrIcon:Sprite;
    private collectAttrValLab:Label;
    private Item: StdItem;
    private attrIconInfo: { [key: string]: string } = BeforeGameUtils.toHashMapObj(
        Attr.CollectEfficiency, "quanneng",
        Attr.WoodCollectEfficiency, "mucai",
        Attr.WaterCollectEfficiency, "shui",
        Attr.RockCollectEfficiency, "shitou",
        Attr.SeedCollectEfficiency, "zhongzi",
    );
    // private it
    protected onLoad() {
        this.CloseBy("Main/closeBtn");
        this.CloseBy("mask");
        this.level = this.find(`Main/level`, Label);
        this.count = this.find(`Main/composeBtn/layout/value`, Label);
        this.targetName = this.find(`Main/name`, Label);
        this.body = this.find(`Main/body`, sp.Skeleton);
        this.quality = this.find(`Main/quality`, Sprite);
        this.jobIcon = this.find(`Main/jobLayout/jobIcon`, Sprite);
        this.jobName = this.find(`Main/jobLayout/jobName`, Label);
        this.power = this.find(`Main/power`, Label);
        this.icon = this.find(`Main/composeBtn/layout/icon`, Sprite);
        this.collectAttrCont = this.find("Main/collectAttrCont");
        this.collectAttrIcon = this.find("Main/collectAttrCont/icon", Sprite);
        this.collectAttrValLab = this.find("Main/collectAttrCont/attrLab", Label);
        this.composeBtn = this.find(`Main/composeBtn`);
        
        this.composeBtn.on(Input.EventType.TOUCH_END, this.onClickCompose, this);
    }
    public static showByItemId(ItemID: number) {
        this.Show(ItemID);
    }
    protected onShow(): void {
        EventMgr.on(Evt_Compose, this.onCompose, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_Compose);
    }
    public async flush(ItemID: number) {
        this.Item = CfgMgr.Getitem(ItemID);
        if (!this.Item || this.Item.SubType != ItemSubType.shard) {
            this.Hide();
            return Tips.Show("物品类型错误，没有该物品或者该物品不能合成！");
        }
        this.level.string = `Lv.1`;
        let role = CfgMgr.GetRole()[this.Item.ItemEffect1]
        let prefab = role.Prefab;
        let scale = role.Scale || 1;
        this.body.node.setScale(0.3 * scale, 0.3 * scale);
        this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role", prefab, prefab), sp.SkeletonData);
        this.body.setAnimation(0, `Idle`, true);
        this.targetName.string = `${role.Name}`;
        let url = path.join(folder_icon + "quality", CardQuality[this.Item.ItemEffect2], "spriteFrame");
        this.quality.spriteFrame = await ResMgr.LoadResAbSub(url, SpriteFrame);
        this.jobIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "pos" + role.PositionType, "spriteFrame"), SpriteFrame);
        this.jobName.string = `${JobName[role.PositionType]}`;
        //let oldPower:number = CountPower(role.RoleType, 1);
        let newPower:number = RoleCardPower(role.RoleType, this.Item.ItemEffect2);
        this.power.string = formatNumber(newPower, 2);
        this.count.string = `${PlayerData.GetItemCount(ItemID)}/${this.Item.ItemEffect3}`;
        SetLabelColor(this.count, PlayerData.GetItemCount(ItemID), this.Item.ItemEffect3);
        this.composeBtn.getComponent(Sprite).grayscale = PlayerData.GetItemCount(this.Item.Items) < this.Item.ItemEffect3;
        this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_item, this.Item.Icon, "spriteFrame"), SpriteFrame);
        this.collectAttrCont.active = false;
        let attrList:AttrSub[] = FormatCardRoleAttr(role.RoleType, this.Item.ItemEffect2);
        for (let attr of attrList) {
            if(this.attrIconInfo[attr.id]){
                this.collectAttrCont.active = true;
                let url = path.join(folder_item, this.attrIconInfo[attr.id], "spriteFrame");
                ResMgr.LoadResAbSub(url, SpriteFrame, res => {
                    this.collectAttrIcon.spriteFrame = res;
                });
                this.collectAttrValLab.string = formatNumber(attr.value, 2);
                break;
            }
            
        }
    }

    @CLICKLOCK(1)
    private onClickCompose() {
        if (!this.checkClick) return;
        if (PlayerData.GetItemCount(this.Item.Items) >= this.Item.ItemEffect3) {
            AudioMgr.PlayOnce(Audio_GetReward);
            let data = {
                type: MsgTypeSend.SynthesizeRoleRequest,
                data: {
                    item_id: this.Item.Items,
                    role_type: this.Item.ItemEffect1,
                }
            }
            Session.Send(data, MsgTypeRet.SynthesizeRoleRet);
        } else {
            return Tips.Show(`碎片不足！`)
        }
    }

    private onCompose(data) {
        Logger.log("onCompose>>>", data);
        this.flush(this.Item.Items);
        this.Hide();
    }

    private isClick = false;
    private checkClick() {
        if (this.isClick) {
            Logger.log('Click too fast, please wait.');
            return false;
        }
        this.isClick = true;
        this.scheduleOnce(() => {
            this.isClick = false
        }, .5)
        return true;
    }
}
