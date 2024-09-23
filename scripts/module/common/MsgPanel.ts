import { Label } from "cc";
import { Panel } from "../../GameRoot";

export class MsgPanel extends Panel {
    protected prefab: string = "prefabs/ui/MsgPanel";
    private msgLabel: Label;
    protected onLoad(): void {
        this.msgLabel = this.find("bar/Label", Label);
    }
    protected onShow(): void {
        
    }
    public flush(msg: string): void {
        if (!msg || msg == "") {
            this.Hide();
            return;
        }
        this.msgLabel.string = msg;
        this.scheduleOnce(this.Hide.bind(this), 2);
    }
    protected onHide(): void {
        this.unscheduleAllCallbacks();
    }
}