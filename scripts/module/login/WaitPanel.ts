import { Panel } from "../../GameRoot";

export class WaitPanel extends Panel {
    protected prefab: string = "prefabs/ui/WaitPanel";
    protected onLoad(): void {
        this.SetLink(undefined);
    }

    Show(...args: any[]): void {
        this.ShowTop();
    }

    protected onShow(): void {

    }
    public flush(msg: string, okCallBack?: Function, noCallBack?: Function): void {

    }
    protected onHide(...args: any[]): void {
    }
}