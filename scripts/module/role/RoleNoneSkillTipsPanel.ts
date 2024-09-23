import { Button } from "cc";
import { Panel } from "../../GameRoot";
import { Goto } from "../../manager/EventMgr";

export class RoleNoneSkillTipsPanel extends Panel {
    protected prefab: string = "prefabs/panel/role/RoleNoneSkillTipsPanel";
    private gotoBtn:Button;
    protected onLoad() {
        this.gotoBtn = this.find("cont/gotoBtn", Button);
        this.CloseBy("mask");
        this.CloseBy("cont/closeBtn");
        this.gotoBtn.node.on(Button.EventType.CLICK, this.onGoTo, this);
    }
    protected onShow(): void {
        
    }
    public async flush(roleId:string, isInit:boolean = true): Promise<void> {
        
        
    }
    protected onHide(...args: any[]): void {
        
    }
    private onGoTo(btn:Button) {
        Goto("FanyuPanel", 1);
        this.Hide();
    }
    
}