import { CfgMgr, StdRoleLevel } from "../../manager/CfgMgr";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData from "../roleModule/PlayerData";
import { AttrSub, FormatAttr, FormatRoleAttr, FormatRoleFightAttr, UpdateAttrItem } from "../common/BaseUI";
import { ResMgr } from "../../manager/ResMgr";

export class RoleAttrPanel extends Panel {
    protected prefab: string = "prefabs/panel/role/RoleAttrPanel";
    private roleAttrLits:AutoScroller;
    private pickAttrLits:AutoScroller;
    protected onLoad() {
        this.roleAttrLits = this.find("cont/roleAttrList", AutoScroller);
        this.roleAttrLits.SetHandle(UpdateAttrItem.bind(this));
        this.pickAttrLits = this.find("cont/pickAttrLits", AutoScroller);
        this.pickAttrLits.SetHandle(UpdateAttrItem.bind(this));
        this.CloseBy("cont/closeBtn");
        this.CloseBy("mask");
    }
    protected async onShow(...args: any[]): Promise<void> {
        if (!this.$hasLoad) await this.initSub;
        let roleData = PlayerData.GetRoleById(args[0]);
        let attrs: AttrSub[] = [];
        attrs = FormatRoleFightAttr(roleData, true);
        this.roleAttrLits.UpdateDatas(attrs);
        
        attrs = [];
        attrs = FormatRoleAttr(roleData, true);
        this.pickAttrLits.UpdateDatas(attrs);
    }

    public async flush(roleId:string): Promise<void> {
        
    }
    protected onHide(...args: any[]): void {
        
    }
}