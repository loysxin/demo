
import { CfgMgr, StdRoleLevel } from "../../manager/CfgMgr";
import { Panel } from "../../GameRoot";
import { Button, Label, Node, Prefab, Skeleton, path, sp, v3 } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData, { SPlayerDataItem } from "../roleModule/PlayerData";
import { AttrSub, FormatAttr, FormatRoleAttr, FormatRoleFightAttr, UpdateAttrItem } from "../common/BaseUI";
import { ResMgr } from "../../manager/ResMgr";
import { PowerItem } from "../common/PowerItem";

export class RoleTuPoResultPanel extends Panel {

    protected prefab: string = "prefabs/panel/role/RoleTuPoResultPanel";
    private body: sp.Skeleton;
    private zlEffect: Node;
    private lvLab: Label;
    private baseAttrLits: AutoScroller;
    private pickAttrLits: AutoScroller;
    private isToPo: boolean
    protected onLoad() {
        this.body = this.find("body", sp.Skeleton);
        this.zlEffect = this.find("zlEffect");
        this.lvLab = this.find("infoCont/lvLab", Label);
        this.baseAttrLits = this.find("infoCont/baseAttrList", AutoScroller);
        this.baseAttrLits.SetHandle(this.attrItem.bind(this));
        this.pickAttrLits = this.find("infoCont/pickAttrLits", AutoScroller);
        this.pickAttrLits.SetHandle(this.attrItem.bind(this));
        this.CloseBy("mask");
    }
    protected async onShow(...args: any[]): Promise<void> {
        if (!this.$hasLoad) await this.initSub;
        let roleData = PlayerData.GetRoleById(args[0]);
        this.isToPo = args[1] ? args[1] : false;
        let stdRole = CfgMgr.GetRole()[roleData.type];
        this.lvLab.string = `Lv.${roleData.level}`;
        let attrs: AttrSub[] = [];
        attrs = FormatRoleFightAttr(roleData)
        this.baseAttrLits.UpdateDatas(attrs);

        attrs = [];
        attrs = FormatRoleAttr(roleData)
        this.pickAttrLits.UpdateDatas(attrs);
        this.isToPo = false;
        this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role_p", stdRole.Prefab, stdRole.Prefab), sp.SkeletonData);
        this.body.setAnimation(0, "Idle", true);
        PowerItem.Show(roleData, this.zlEffect.getPosition())
    }

    private attrItem(item: Node, data: AttrSub, index: number) {
        UpdateAttrItem(item, data, index, false);

    }

    public async flush(roleId: string): Promise<void> {

    }
    protected onHide(...args: any[]): void {
        PowerItem.Hide();
    }
}