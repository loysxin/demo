import { _decorator, Input, Label, Node, path, Sprite, } from 'cc';
import { AutoScroller } from '../../../utils/AutoScroller';
import { CfgMgr, ConditionType } from '../../../manager/CfgMgr';
import PlayerData from '../../roleModule/PlayerData';
import { Session } from '../../../net/Session';
import { MsgTypeSend } from '../../../MsgType';
import { ConditionSub, FormatCondition, FormaThingCondition, UpdateConditionItem } from '../../common/BaseUI';
import { Panel } from '../../../GameRoot';
import { CheckCondition } from '../../../manager/ConditionMgr';
import { ItemUtil } from '../../../utils/ItemUtils';
const { ccclass, disallowMultiple, property } = _decorator;

export class UnlockHomeLandPanel extends Panel {
    protected prefab: string = "prefabs/panel/UnLockHome";

    private cdScroller: AutoScroller;
    private desc: Label;
    private lockBtn: Node;

    private homeId: number;
    private lock: boolean = false;

    protected onShow(): void {
        this.cdScroller = this.find("panel/cdLayout/ScrollView", AutoScroller);
        this.cdScroller.SetHandle(UpdateConditionItem.bind(this));
        this.desc = this.find("panel/info/des", Label);
        this.CloseBy("mask");
        this.CloseBy("panel/closeBtn");
        this.lockBtn = this.find("panel/unLockBtn");
        this.lockBtn.on(Input.EventType.TOUCH_END, this.onUnlock, this);
    }
    public flush(homeId: number): void {
        this.homeId = homeId;
        let std = CfgMgr.GetHomeLandInit(homeId);
        this.desc.string = std.Desc.join("\n");

        let conditions: ConditionSub[] = [];
        this.lock = false;
        for (let i = 0; i < std.ConditionId.length; i++) {
            let conditionId = std.ConditionId[i]
            let data = FormatCondition(conditionId, std.ConditionLv[i]);
            if (data) {
                if (data.fail) this.lock = true;
                conditions.push(data);
            }
        }

        for (let i = 0; i < std.ItemsType.length; i++) {
            let data = FormaThingCondition(std.ItemsType[i], std.ItemsId[i], std.ItemCost[i]);
            conditions.push(data);
        }
        // for (let i = 0; i < std.ItemsId.length; i++) {
        //     let id = std.ItemsId[i];
        //     let stdItem = CfgMgr.Getitem(id);
        //     if (!stdItem) continue;
        //     let url = path.join("sheets/items", stdItem.Icon, "spriteFrame");
        //     let has = PlayerData.GetItemCount(id);
        //     let data: ConditionSub = { id: ConditionType.Home_1, icon: url, name: has + "/" + std.ItemCost[i] };
        //     if (has < std.ItemCost[i]) data.fail = stdItem.ItemName + "不足!";
        //     if (data.fail) this.lock = true;
        //     conditions.push(data);
        // }
        this.lockBtn.getComponent(Sprite).grayscale = this.lock;
        this.cdScroller.UpdateDatas(conditions);
    }

    protected onHide(...args: any[]): void {
    }

    protected onUnlock() {
        if (this.lock) return;
        // 解锁家园
        let data = {
            type: MsgTypeSend.HomelandUnlockRequest,
            data: {
                homeland_id: this.homeId
            }
        }
        Session.Send(data);
        this.Hide();
    }
}
