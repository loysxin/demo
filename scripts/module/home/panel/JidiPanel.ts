import { Color, Input, Label, Node, Slider, Sprite, SpriteFrame, Toggle, Tween, UITransform, game, path, tween, v3 } from "cc";
import { Panel } from "../../../GameRoot";
import { BaseNavPage } from "./BaseNavPage";
import { BaseLvPage } from "./BaseLvPage";
import PlayerData, { Tips2ID } from "../../roleModule/PlayerData";
import { BuildingType } from "../HomeStruct";
import { Tips } from "../../login/Tips";
import { EventMgr, Evt_Hide_Home_Ui, Evt_Show_Home_Ui } from "../../../manager/EventMgr";
import { Tips2 } from "./Tips2";
import { CfgMgr } from "../../../manager/CfgMgr";

export class JidiPanel extends Panel {
    protected prefab: string = "prefabs/panel/JidiPanel";

    protected buildingId: number;
    protected navPage: BaseNavPage;
    protected lvPage: BaseLvPage;
    private heleBtn: Node;
    protected onLoad() {
        this.CloseBy("mask");
        this.heleBtn = this.find("BaseNavPage/frame/tileBar/helpBtn");
        this.navPage = this.find("BaseNavPage").getComponent(BaseNavPage);
        this.lvPage = this.find("BaseLvPage").addComponent(BaseLvPage);
        this.heleBtn.on(Input.EventType.TOUCH_END, this.onHelpBtn, this);
        this.navPage.node.on("close", this.Hide, this);
    }

    public flush(buildingId: number) {
        if (!this.buildingId && !buildingId) return;
        if (buildingId) this.buildingId = buildingId;
        let state = PlayerData.GetBuildingByType(BuildingType.ji_di, PlayerData.RunHomeId)[0];
        if (!state) {
            this.Hide();
            Tips.Show("兵营尚未解锁");
            return;
        }
        let std = CfgMgr.GetBuildingUnLock(this.buildingId);
        this.navPage.SetTile(std.remark, buildingId, state.level);
        this.lvPage.Show(state.id);
    }

    protected onShow(): void {
        EventMgr.emit(Evt_Hide_Home_Ui);


    }

    private onHelpBtn() {
        Tips2.Show(Tips2ID.HomeJiDi);
    }
    protected onHide(...args: any[]): void {
        this.lvPage.Hide();
        EventMgr.emit(Evt_Show_Home_Ui);
    }

}
