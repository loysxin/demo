import { Node, Button, Label } from "cc";
import { Panel } from "../../GameRoot";
import { Tips } from "../login/Tips";
import { CfgMgr } from "../../manager/CfgMgr";


export class LootRankPanel extends Panel {
    protected prefab: string = "prefabs/panel/loot/LootRankPanel";

    protected onLoad() {
        this.CloseBy("backBtn");
        this.onBtnEvent();
    }

    private onBtnEvent() {
    }

    protected onShow(): void {
        Tips.Show(CfgMgr.GetText("pvp_1"));
    }
    public flush(...args: any[]): void {

    }
    protected onHide(...args: any[]): void {

    }

    private onSeekBtn() {

    }
    private onAddBtn() {

    }
    private onClickRole() {

    }
}