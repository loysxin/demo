import { Component, Node } from "cc";
import { RoleAttrCont } from "./RoleAttrCont";
import { RoleUpgradeCont } from "./RoleUpgradeCont";
import { SPlayerDataRole } from "../roleModule/PlayerData";
import { EventMgr, Evt_Role_Upgrade } from "../../manager/EventMgr";

export class RoleAttrPage extends Component {
    private roleAttrCont:RoleAttrCont;
    private roleUpgradeCont:RoleUpgradeCont;
    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;
    private roleId:string;
    protected onLoad(): void {
        this.roleAttrCont = this.node.getChildByName("roleAttrCont").addComponent(RoleAttrCont);
        this.roleAttrCont.ShowUpgradeContCall = this.showUpgradeContCall.bind(this);
        this.roleUpgradeCont = this.node.getChildByName("roleUpgradeCont").addComponent(RoleUpgradeCont);
        this.roleUpgradeCont.CloseUpgradeContCall = this.closeUpgradeContCall.bind(this);
        this.roleAttrCont.node.active = true;
        this.roleUpgradeCont.node.active = false;
        this.hasLoad = true;
        this.complete?.();
        EventMgr.on(Evt_Role_Upgrade, this.onUpgrade, this);
    }

    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
    }
    private onUpgrade():void{
        this.SetData(this.roleId, false);
    }
    /**
     * 设置角色数据
     * @param roleId 
     */
    async SetData(roleId: string, isInit:boolean = false) {
        if (!this.hasLoad) await this.loadSub;
        this.roleId = roleId;
        if(isInit) this.closeUpgradeContCall();
        this.roleAttrCont.SetData(this.roleId, isInit);
        this.roleUpgradeCont.SetData(this.roleId);
    }

    private showUpgradeContCall():void{
        this.roleAttrCont.node.active = false;
        this.roleUpgradeCont.node.active = true;
        this.roleUpgradeCont.SetData(this.roleId);
    }

    private closeUpgradeContCall():void{
        this.roleAttrCont.node.active = true;
        this.roleUpgradeCont.node.active = false;
        this.roleAttrCont.SetData(this.roleId);
    }
}