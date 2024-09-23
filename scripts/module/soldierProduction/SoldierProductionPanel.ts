import { Color, Input, Label, Node, Slider, Sprite, SpriteFrame, Toggle, Tween, UITransform, game, path, tween, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { BuildingType } from "../home/HomeStruct";
import { BaseLvPage } from "../home/panel/BaseLvPage";
import { BaseNavPage } from "../home/panel/BaseNavPage";
import { Tips } from "../login/Tips";
import PlayerData, { BoostType, SPlayerDataSoldier, SPlayerDataSoldierProduction, Tips2ID } from "../roleModule/PlayerData";
import { AutoScroller } from "../../utils/AutoScroller";
import { CfgMgr, StdRole, StdSoldierProduction } from "../../manager/CfgMgr";
import { ResMgr, folder_head, folder_head_card, folder_icon } from "../../manager/ResMgr";
import { BigNumber, formatNumber, formatTime, maxx, minn } from "../../utils/Utils";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { EventMgr, Evt_Hide_Home_Ui, Evt_Show_Home_Ui, Evt_Soldier_JiaSu, Evt_Soldier_Push } from "../../manager/EventMgr";
import { BoostPanel } from "../home/panel/BoostPanel";
import { AttrSub, FormatAttr, UpdateAttrItem } from "../common/BaseUI";
import { Tips2 } from "../home/panel/Tips2";
import { MsgPanel } from "../common/MsgPanel";
import { AudioMgr, Audio_SoldierRecruit } from "../../manager/AudioMgr";

export class SoldierProductionPanel extends Panel {
    protected prefab: string = "prefabs/panel/SoldierProductionPanel";

    protected navPage: BaseNavPage;
    protected lvPage: BaseLvPage;
    protected page1: Node;
    protected totalScroller: AutoScroller;
    protected iconScroller: AutoScroller;
    protected propScroller: AutoScroller;
    protected slider: Slider;
    protected progress: Node;
    protected current: Label;
    protected total: Label;
    protected countDown: Label;

    private buildingId: number;
    private page = -1;
    private productions: SPlayerDataSoldierProduction[] = [];
    private selectInfo: SPlayerDataSoldierProduction;
    private stdLv: StdSoldierProduction;
    private selectCount: number;
    private selectMaxCount: number; //当前兵种携带最大上限
    private curSelectIndex:number = -1;//当前选中兵种下标
    protected onLoad() {
        this.CloseBy("mask");
        this.navPage = this.find("BaseNavPage").addComponent(BaseNavPage);
        this.lvPage = this.find("BaseLvPage").addComponent(BaseLvPage);
        this.page1 = this.find("page1");

        this.navPage.SetNav(["升级", "招募"]);
        this.navPage.node.on("select", this.onPage, this);
        this.navPage.node.on("close", this.onClose, this);

        this.totalScroller = this.find("page1/totalLayout", AutoScroller);
        this.iconScroller = this.find("page1/iconLayout", AutoScroller);
        this.propScroller = this.find("page1/propLayout/layout", AutoScroller);

        this.slider = this.find("page1/Slider").getComponent(Slider);
        this.progress = this.find("page1/Slider/progress");

        this.totalScroller.SetHandle(this.updateTotalItem.bind(this));
        this.iconScroller.SetHandle(this.updateIconItem.bind(this));
        this.propScroller.SetHandle(UpdateAttrItem.bind(this));

        this.iconScroller.node.on('select', this.onSelect, this);
        this.slider.node.on('slide', this.onSlide, this);
        this.find("page1/left").on(Input.EventType.TOUCH_END, this.onDel, this);
        this.find("page1/right").on(Input.EventType.TOUCH_END, this.onAdd, this);
        this.find("page1/left").on(Input.EventType.TOUCH_CANCEL, this.onDel, this);
        this.find("page1/right").on(Input.EventType.TOUCH_CANCEL, this.onAdd, this);
        this.find("page1/left").on(Input.EventType.TOUCH_START, this.onDelStart, this);
        this.find("page1/right").on(Input.EventType.TOUCH_START, this.onAddStart, this);
        this.find("page1/btnLayout/zhaomuBtn").on(Input.EventType.TOUCH_END, this.onZhaoMu, this);
        this.find("page1/btnLayout/jiasuBtn").on(Input.EventType.TOUCH_END, this.onClcikJiaSu, this);
        this.find("BaseNavPage/frame/tileBar/helpBtn").on(Input.EventType.TOUCH_START, this.onHelpBtn, this);
        EventMgr.on(Evt_Soldier_Push, this.onPush, this);
        this.curSelectIndex = -1;
    }

    public flush(buildingId: number, selectPage?: number) {
        if (!this.buildingId && !buildingId) return;
        if (buildingId) this.buildingId = buildingId;
        let state = PlayerData.GetBuilding(this.buildingId);
        if (!state) {
            this.Hide();
            Tips.Show("兵营尚未解锁");
            return;
        }
        if (selectPage) this.page = selectPage - 1;
        let std = CfgMgr.GetBuildingUnLock(this.buildingId);
        this.navPage.SetTile(std.remark, buildingId, state.level);
        this.navPage.SetPage(this.page);
        if (this.page == 0) {
            this.lvPage.Show(state.id);
            this.page1.active = false;
            this.selectInfo = undefined;
        } else {
            this.lvPage.Hide();
            this.page1.active = true;
            this.flushPage1();
            if (!this.selectInfo) {
                this.iconScroller.SelectFirst();
            } else {
                let index = this.iconScroller.GetSelectIndex() || 0;
                this.selectInfo = undefined;
                this.onSelect(index);
            }
        }
    }

    /**获取当前上限 */
    static GetLimit(production: SPlayerDataSoldierProduction, stdLv: StdSoldierProduction) {
        if (!production || !stdLv) return [0, 0, 0];
        let index = stdLv.SoldiersType.indexOf(production.id);
        let info = PlayerData.GetSoldier(production.id);
        let totalLimit = stdLv.SoldiersNum[index] - (info ? info.count : 0);
        return [minn(stdLv.SingleNum[index], totalLimit), stdLv.SoldiersTime[index], stdLv.SoldiersCost[index]];
        // if (!this.selectInfo || !this.stdLv) return [0, 0, 0];
        // let index = this.stdLv.SoldiersType.indexOf(this.selectInfo.id);
        // let info = PlayerData.GetSoldier(this.selectInfo.id);
        // let totalLimit = this.stdLv.SoldiersNum[index] - (info ? info.count : 0);
        // return [minn(this.stdLv.SingleNum[index], totalLimit), this.stdLv.SoldiersTime[index], this.stdLv.SoldiersCost[index]];
    }
    protected getLimit() {
        return SoldierProductionPanel.GetLimit(this.selectInfo, this.stdLv);
    }

    /**
     * 更新招募页面
     */
    protected flushPage1() {
        let state = PlayerData.GetBuilding(this.buildingId, PlayerData.RunHomeId);
        let cfg = CfgMgr.GetSoldierProduction(this.buildingId)
        this.stdLv = cfg[state.level];
        let totalDatas = [];
        this.productions = [];
        let postypes = {};
        let stdRoleTypes = CfgMgr.Get("role_type");
        for (let i = 0; i < this.stdLv.SoldiersType.length; i++) {
            let id = this.stdLv.SoldiersType[i];
            let solider = PlayerData.GetSoldier(id);
            let stdRole: StdRole = stdRoleTypes[id];
            if (stdRole && postypes[stdRole.PositionType] != undefined && totalDatas[postypes[stdRole.PositionType]]) {
                totalDatas[postypes[stdRole.PositionType]].count += (solider ? solider.count : 0);
            } else {
                postypes[stdRole.PositionType] = i;
                if (solider) {
                    totalDatas[i] = {
                        id: id,
                        count: solider.count,
                        building_id: solider.building_id
                    };
                } else {
                    totalDatas[i] = {
                        id: id,
                        count: 0,
                        building_id: this.buildingId
                    }
                }
            }
            let production = PlayerData.GetSoldierProduction(id, this.buildingId);
            if (production) {
                this.productions[i] = production;
            } else {
                this.productions[i] = {
                    id: id,
                    count: 0,
                    building_id: this.buildingId,
                    start_time: 0,
                    soldier_id: 0
                }
            }
        }
        this.totalScroller.UpdateDatas(totalDatas);
        this.resetSelect();
        this.iconScroller.UpdateDatas(this.productions);
    }

    protected onPush(data: { soldier_id: number, count: number }) {
        if (!this.selectInfo || !this.stdLv) return;
        if (this.selectInfo.id != data.soldier_id) return;
        this.flushPage1();
        this.selectCount -= data.count;
        let [limit, time, cost] = this.getLimit();
        this.slider.progress = this.selectCount / limit;
        this.onSlide();
    }
    private resetSelect():void{
        let children:Node[] = this.iconScroller.node.getChildByPath("view/content").children;
        for (let i = 0; i < children.length; i++) {
            let node:Node = children[i];
            node.getChildByName("select").active = false;
        }
    }
    /**选择兵种 */
    protected async onSelect(index: number, item?: Node) {
        //if(this.curSelectIndex == index) return;
        this.resetSelect();
        if(item){
            let select:Node = item.getChildByName("select");
            select.active = true;
        }
        
        this.selectInfo = this.productions[index];
        this.curSelectIndex = index;
       
        this.selectCount = maxx(1, this.selectInfo.count);
        this.selectMaxCount = this.stdLv.SoldiersNum[index];
        let info = PlayerData.GetSoldier(this.selectInfo.id);
        this.slider.enabled = info ? (info.count < this.selectMaxCount) : true;
        // Logger.log("onSelect===", this.selectCount, this.selectInfo.count);
        let [limit, time, cost] = this.getLimit();
        this.slider.progress = this.selectCount / limit;
        this.onSlide();
        let datas: AttrSub[] = [];
        let stdRole = CfgMgr.GetRole()[this.selectInfo.id];
        let stdAttr = CfgMgr.GetFightAttr();
        for (let i = 0; i < stdRole.AttrFight.length; i++) {
            let std = stdAttr[stdRole.AttrFight[i]];
            let value = stdRole.AttrFightValue[i];
            let obj = FormatAttr(std.ID);
            obj.value = value;
            datas.push(obj);
        }

        this.propScroller.UpdateDatas(datas);

        let body = this.find("page1/role/body").getComponent(Sprite);
        let icon = this.find("page1/role/icon").getComponent(Sprite);
        let name = this.find("page1/role/name").getComponent(Label);
        let url = path.join(folder_head, CfgMgr.GetRole()[this.selectInfo.id].Icon, "spriteFrame");
        body.spriteFrame = await ResMgr.LoadResAbSub(url, SpriteFrame);

        const icons = { [1]: "201", [2]: "202", [3]: "203" };
        let color = {[1]: "#25bf22", [2]: "#0066ff", [3]: "#ea020"}
        url = path.join(folder_icon, icons[stdRole.PositionType] || "gong", "spriteFrame");
        icon.spriteFrame = await ResMgr.LoadResAbSub(url, SpriteFrame);
        name.color = new Color().fromHEX(color[stdRole.Quality] || "#FFFFFF");
        name.string = stdRole.Name;
    }
    protected onSlide() {
        let [limit, time, cost] = this.getLimit();
        this.selectCount = Math.round(this.slider.progress * limit);
        if (PlayerData.GetSoldier(this.selectInfo.id) && PlayerData.GetSoldier(this.selectInfo.id).count < this.selectMaxCount) {
            if (this.selectInfo.count > this.selectCount) {
                this.selectCount = this.selectInfo.count;
                this.slider.progress = this.selectCount / limit;
            } else if (this.selectCount < 1) {
                this.selectCount = 1;
                this.slider.progress = this.selectCount / limit;
            }
        }
        let add = this.selectCount - this.selectInfo.count;
        this.find("page1/btnLayout/zhaomuBtn/value").getComponent(Label).string = formatNumber(add * cost, 2);
        if (add * cost > PlayerData.roleInfo.currency) {
            this.find("page1/btnLayout/zhaomuBtn").getComponent(Sprite).color = new Color().fromHEX('#7C7C7C');
        } else {
            this.find("page1/btnLayout/zhaomuBtn").getComponent(Sprite).color = new Color().fromHEX('#FFFFFF');
        }
        this.find("page1/img/num").getComponent(Label).string = this.selectCount ? BigNumber(this.selectCount) : "0";
        this.find("page1/limit").getComponent(Label).string = "/" + BigNumber(limit);
    }
    private startDel = Number.MAX_SAFE_INTEGER;
    protected onDelStart() {
        this.startDel = game.totalTime;
        this.startAdd = Number.MAX_SAFE_INTEGER;
    }
    protected onDel(e?: any) {
        if (e) this.startDel = Number.MAX_SAFE_INTEGER;
        if (!this.selectInfo || this.selectCount < 0) return;
        let [limit, time, cost] = this.getLimit();
        this.slider.progress = maxx(0, (this.selectCount - 1) / limit);
        this.onSlide();
    }
    private startAdd = Number.MAX_SAFE_INTEGER;
    protected onAddStart() {
        this.startAdd = game.totalTime;
        this.startDel = Number.MAX_SAFE_INTEGER;
    }
    protected onAdd(e?: any) {
        if (e) this.startAdd = Number.MAX_SAFE_INTEGER;
        if (!this.selectInfo || this.selectCount < 0) return;
        let [limit, time, cost] = this.getLimit();
        this.slider.progress = minn(1, (this.selectCount + 1) / limit);
        this.onSlide();
    }

    /**招募 */
    protected onZhaoMu() {
        if (!this.selectInfo || !this.stdLv) return;
        let [limit, time, cost] = this.getLimit();
        let add = this.selectCount - this.selectInfo.count;
        if (add * cost > PlayerData.roleInfo.currency) {
            Tips.Show("资源不足");
            return;
        }
        AudioMgr.PlayOnce(Audio_SoldierRecruit);
        let data = {
            type: MsgTypeSend.SoldierProduction,
            data: {
                building_id: this.buildingId,
                soldier_id: this.selectInfo.id,
                count: add
            }
        }
        Session.Send(data, MsgTypeRet.SoldierProductionRet);
    }
    private onClcikJiaSu(): void {
        let index = this.stdLv.SoldiersType.indexOf(this.selectInfo.id);
        let t = this.selectCount * this.stdLv.SoldiersTime[index];
        let endTime: number = this.selectInfo.start_time + t;
        if (!PlayerData.CheckAddTimeItem()) {
            MsgPanel.Show(CfgMgr.GetText("tips_1"));
            return;
        }
        BoostPanel.Show(this.selectInfo.id, BoostType.BoostTypeSoldierProduce, this.selectInfo.start_time, endTime);
    }
    protected onShow(): void {
        if (this.page == -1) this.page = 0;
        EventMgr.emit(Evt_Hide_Home_Ui);
    }
    protected onHide(...args: any[]): void {
        this.lvPage.Hide();
        this.selectInfo = undefined;
        EventMgr.emit(Evt_Show_Home_Ui);
    }

    public SetPage(page: number): void {
        this.onPage(page);
    }

    protected onPage(index: number) {
        if (this.page == index) return;
        this.page = index;
        if (this.buildingId) this.flush(this.buildingId);
    }
    protected onClose() {
        this.Hide();
    }

    /**更新库存 */
    private async updateTotalItem(item: Node, data: SPlayerDataSoldier) {
        let icon = item.getChildByName("icon").getComponent(Sprite);
        let name = item.getChildByName("value").getComponent(Label);
        let std: StdRole = CfgMgr.Get("role_type")[data.id];
        const icons = { [1]: "201", [2]: "202", [3]: "203" };
        let url = path.join(folder_icon, icons[std.PositionType] || "gong", "spriteFrame");
        icon.spriteFrame = await ResMgr.LoadResAbSub(url, SpriteFrame);
        name.string = BigNumber(data.count);
        if (data.add) {
            let add = item.getChildByName("add");
            add.getComponent(Label).string = "+" + data.add.toString();
            Tween.stopAllByTarget(add);
            add.active = true;
            add.setPosition(170, 0);
            tween(add).to(1.5, { position: v3(170, 80) }).call(() => {
                add.active = false;
            }).start();
            data.add = 0;
        }
    }

    /**更新兵种图标 */
    private async updateIconItem(item: Node, data: SPlayerDataSoldierProduction, index:number) {
        let icon = item.getChildByPath("icon").getComponent(Sprite);
        let select = item.getChildByPath("select");
        select.active = this.curSelectIndex == index;
        // let label = item.getChildByPath("mask/countDown/label").getComponent(Label);
        // let ls = CfgMgr.Get("role_type");
        let std: StdRole = CfgMgr.Get("role_type")[data.id];
        let url = path.join(folder_head_card, String(std.Icon || 1), "spriteFrame");
        icon.spriteFrame = await ResMgr.LoadResAbSub(url, SpriteFrame);
    }

    protected update(dt: number): void {
        let size = this.slider.node.getComponent(UITransform).contentSize;
        this.progress.getComponent(UITransform).setContentSize(this.slider.progress * size.width, 28);
        if (!this.selectInfo || !this.stdLv) return;
        let t = game.totalTime;
        if (t - this.startAdd > 200) this.onAdd();
        if (t - this.startDel > 200) this.onDel();
        let lesstime = 0;
        let [limit, time, cost] = this.getLimit();
        if (this.selectInfo.count) {
            // Logger.log("update", this.selectInfo.start_time, this.selectInfo.count, time);
            lesstime = maxx(0, this.selectInfo.start_time + this.selectInfo.count * time - PlayerData.GetServerTime());
            // lesstime = this.selectInfo.count * time;
        }
        let str = formatTime(lesstime);
        let addTime = 0;
        if (this.selectCount > this.selectInfo.count) {
            addTime = (this.selectCount - this.selectInfo.count) * time;
            str = str + " +" + formatTime(addTime);
        }
        if (lesstime > 0 || addTime > 0) {
            this.find("page1/countDown").active = true;
        } else {
            this.find("page1/countDown").active = false;
        }
        this.find("page1/countDown").getComponent(Label).string = "训练完成时间：" + str;
        if (this.selectCount) {
            this.find("page1/btnLayout/noneBtn").active = false;
            if (this.selectInfo.count < this.selectCount) {
                this.find("page1/btnLayout/jiasuBtn").active = false;
                this.find("page1/btnLayout/zhaomuBtn").active = true;
            } else {
                this.find("page1/btnLayout/jiasuBtn").active = true;
                this.find("page1/btnLayout/zhaomuBtn").active = false;
            }
        } else {
            this.find("page1/btnLayout/jiasuBtn").active = false;
            this.find("page1/btnLayout/zhaomuBtn").active = false;
            this.find("page1/btnLayout/noneBtn").active = true;
        }

        let children = this.iconScroller.children;
        let serverTime = PlayerData.GetServerTime();
        for (let child of children) {
            let info = this.productions[child['$$index']];
            let index = this.stdLv.SoldiersType.indexOf(info.id);
            let t = info.count * this.stdLv.SoldiersTime[index];
            let label = child.getChildByPath("countDown/label").getComponent(Label);
            if (info.start_time && serverTime < info.start_time + t) {
                label.node.parent.active = true;
                // label.string = formatTime(info.start_time + t - serverTime);
                label.string = '招募中';
            } else {
                label.node.parent.active = false;
            }
        }
    }
    private onHelpBtn() {
        Tips2.Show(Tips2ID.HomeBingYing);
    }
}
