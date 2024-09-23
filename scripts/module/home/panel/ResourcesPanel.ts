import { Color, Input, Label, Node, Slider, Sprite, SpriteFrame, Toggle, Tween, UITransform, game, path, tween, v3 } from "cc";
import { Panel } from "../../../GameRoot";
import { BaseNavPage } from "./BaseNavPage";
import { BaseLvPage } from "./BaseLvPage";
import PlayerData, { Tips2ID } from "../../roleModule/PlayerData";
import { BuildingType } from "../HomeStruct";
import { Tips } from "../../login/Tips";
import { BaseWorkPage } from "./BaseWorkPage";
import { CfgMgr } from "../../../manager/CfgMgr";
import { DefensePage } from "./DefensePage";
import { EventMgr, Evt_Hide_Home_Ui, Evt_Show_Home_Ui } from "../../../manager/EventMgr";
import { Tips2 } from "./Tips2";

export class ResourcesPanel extends Panel {
    protected prefab: string = "prefabs/panel/ResourcesPanel";

    protected buildingId: number;
    protected navPage: BaseNavPage;
    protected lvPage: BaseLvPage;
    protected workPage: BaseWorkPage;
    protected defensePage: DefensePage;
    protected selectPage = 0;
    private pages: (BaseLvPage | BaseWorkPage | DefensePage)[] = [];
    private helpBtn: Node;

    protected onLoad() {
        this.CloseBy("mask");
        this.helpBtn = this.node.getChildByPath("BaseNavPage/frame/tileBar/helpBtn");
        this.navPage = this.find("BaseNavPage").addComponent(BaseNavPage);
        this.lvPage = this.find("BaseLvPage").addComponent(BaseLvPage);
        this.workPage = this.find("BaseWorkPage").addComponent(BaseWorkPage);
        this.defensePage = this.find("DefensePage").addComponent(DefensePage);
        this.pages = [this.lvPage, this.workPage, this.defensePage];
        for (let page of this.pages) {
            page.Hide();
        }

        this.helpBtn.on(Input.EventType.TOUCH_END, this.onHelpBtn, this);
        this.navPage.node.on('select', this.onSelect, this);
        this.navPage.node.on('close', this.Hide, this);
    }

    public flush(buildingId: number, selectPage?: number) {
        if (!buildingId) return;
        if (buildingId) this.buildingId = buildingId;
        let std = CfgMgr.GetBuildingUnLock(this.buildingId);
        if (std.BuildingType == BuildingType.cheng_qiang) {
            this.navPage.SetNav(["升级", "驻守"], [], this.lvPage, this.defensePage);
            this.pages = [this.lvPage, this.defensePage];
        } else if (std.BattleType == 2) {
            this.navPage.SetNav(["升级", "工作"], [], this.lvPage, this.workPage);
            this.pages = [this.lvPage, this.workPage];
        } else if (std.BattleType == 1) {
            this.navPage.SetNav(["升级"], [], this.lvPage);
            this.pages = [this.lvPage];
        }
        let state = PlayerData.GetBuilding(std.BuildingId, PlayerData.RunHomeId);
        if (!state || state.level == 0) {
            this.Hide();
            Tips.Show(std.remark + "尚未解锁");
            return;
        }
        this.navPage.SetTile(std.remark, buildingId, state.level);
        if (selectPage) {
            this.selectPage = this.selectPage;
        } else {
            this.selectPage = this.selectPage || 0;
        }
        if (selectPage) this.selectPage = selectPage;
        this.navPage.SetPage(this.selectPage);
    }

    protected onShow(): void {
        this.selectPage = undefined;
        EventMgr.emit(Evt_Hide_Home_Ui);
    }
    protected onHide(...args: any[]): void {
        this.lvPage.node.active = false;
        this.workPage.node.active = false;
        this.defensePage.node.active = false;

        EventMgr.emit(Evt_Show_Home_Ui);
    }

    async SetPage(page: number) {
        if (!this.$hasLoad) await this.initSub;
        this.onSelect(page);
    }

    protected onSelect(index: number, target?: Node) {
        if (!this.buildingId) return;
        this.selectPage = index;
        this.pages[index].Show(this.buildingId);
    }
    private onHelpBtn() {
        Tips2.Show(Tips2ID.Collect);
    }
}
