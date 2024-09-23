import { EventTouch, Input, Label, Layout, Node, ProgressBar, Rect, Size, Sprite, SpriteFrame, Tween, UIOpacity, UITransform, Vec2, Vec3, instantiate, sp, tween, v2 } from "cc";
import { ResMgr } from "../../../manager/ResMgr";
import { GameObj } from "../../../GameRoot";
import { BuildingLayout, BuildingType, CanSet } from "../HomeStruct";
import { CheckAnimation, Convert, ConvertNode, GetBoundingBoxTo, MapChildren, NoTouch, Second, countDown, formatTime } from "../../../utils/Utils";
import PlayerData, { BuildingState, FightState, SPlayerDataBuilding, SPlayerDataRole } from "../../roleModule/PlayerData";
import { MsgTypeRet, MsgTypeSend } from "../../../MsgType";
import { Session } from "../../../net/Session";
import { EventMgr, Evt_Add_Entity_Bar, Evt_Building_Action, Evt_Building_Child_Action, Evt_Building_Complete, Evt_Building_Effect, Evt_Collect_Update, Evt_Hide_Home_Ui, Evt_Map_Moving, Evt_Map_StopMove, Evt_Show_Home_Ui, Evt_Show_Scene, Goto } from "../../../manager/EventMgr";
import { CfgMgr, StdBuilding } from "../../../manager/CfgMgr";
import { SceneCamera } from "../../SceneCamera";
import { BuildingPanel } from "../panel/BuildingPanel";
import { BuildCompletedPanel } from "../../common/BuildCompletedPanel";
import { Worker } from "./Worker";
import { PANEL_TYPE } from "../../../manager/UIGuide";
import { BeforeGameUtils } from "../../../utils/BeforeGameUtils";
import { CheckCondition } from "../../../manager/ConditionMgr";
import { ItemUtil } from "../../../utils/ItemUtils";
import { AudioMgr, Audio_BuildingSucceed } from "../../../manager/AudioMgr";
import { GameSet } from "../../GameSet";
import { HomeLogic } from "../HomeLogic";

export class Building extends GameObj {

    static dragSeed = 1;
    static dragLoop = 1;

    protected $prefab: string = "prefabs/home/Building";

    public homeId: number;
    protected buildingid: number;
    protected buildingType: number;
    protected select: Sprite;
    protected img: Sprite;
    protected ske: sp.Skeleton;
    protected produce: sp.Skeleton;
    protected bounds: number[];
    protected lvCfg: StdBuilding;
    protected layoutCfg: BuildingLayout;
    protected localtion: number;
    protected nameLabel: Label;
    protected trans: UITransform;
    protected workers: Worker[];
    protected strikeEffect: Node;
    protected otherskes: Node[];
    protected nameBarAlpha: UIOpacity;
    protected nameAlpha: UIOpacity;

    protected lock: Node;
    protected nameBar: Node;
    protected arrow: Node;
    protected lvLabel: Label;
    protected stateBar: Node;
    protected buildBar: Node;
    protected lockOffset: Vec3;
    protected successOffset: Vec3;
    protected nameBarOffset: Vec3;
    protected stateBarOffset: Vec3;
    protected buildBarOffset: Vec3;

    protected success: Node;
    protected lessTime: Label;
    protected lessProgress: Sprite;
    protected buildProgress: ProgressBar;
    protected buildTime: Label;
    protected workerNum: Label;
    protected building: Node;
    protected $body: Node;
    protected hitTest: Node;

    protected upgradeCompleteTime: number;//升级结束时间点
    protected upgradeDuration: number;
    protected canLock: boolean = false;
    protected buildLevel: number = 0;
    protected colletcTime: number;
    protected canCollect: boolean = false;

    protected useSeed = 0;
    protected initSub: Promise<number>;
    protected initHandle: Function;
    protected hideSub: Promise<number>;
    protected hideHandle: Function;
    protected canUpBuildType: { [key: string]: boolean } = BeforeGameUtils.toHashMap(
        BuildingType.ji_di, BuildingType.cai_mu,
        BuildingType.cai_kuang, BuildingType.cai_shui,
        BuildingType.fang_yu_ta, BuildingType.bing_ying,
        BuildingType.cheng_qiang, BuildingType.hua_fang,
    );
    protected childVisibles: { [uuid: string]: { child: Node, active: boolean } } = {};
    protected onLoad(): void {
        super.onLoad();

        this.select = this.find("select", Sprite);
        this.img = this.find("img", Sprite);
        this.ske = this.find("ske", sp.Skeleton);
        this.produce = this.find("produce", sp.Skeleton);
        this.nameLabel = this.find("nameBar/Label", Label);
        this.nameBar = this.find("nameBar");
        this.arrow = this.find("nameBar/arrow");
        this.lvLabel = this.find("nameBar/Label").getComponent(Label);
        this.stateBar = this.find("stateBar");
        this.buildBar = this.find("buildprogress");
        this.lessTime = this.find("stateBar/layout/num", Label);
        this.lessProgress = this.find("stateBar/progress", Sprite);
        this.buildProgress = this.find("buildprogress/Progress", ProgressBar);
        this.buildTime = this.find("buildprogress/time", Label);
        this.workerNum = this.find("stateBar/layout/worker", Label);
        this.building = this.find("building");
        this.strikeEffect = this.find("strikeEffect");
        if (!this.nameBar.getComponent(UIOpacity)) {
            this.nameBarAlpha = this.nameBar.addComponent(UIOpacity);
            this.nameAlpha = this.nameLabel.addComponent(UIOpacity);
        }

        this.workers = []; this.otherskes = [];
        let children = this.$proxy.node.children;
        for (let child of children) {
            this.childVisibles[child.uuid] = { child: child, active: child.active }
            let name = child.name.toLocaleLowerCase();
            if (name.search("worker") == 0) {
                let worker = child.addComponent(Worker);
                worker.Init(this.buildingType);
                this.workers.push(worker);
                child.active = false;
            } else if (child.name != "ske" && child.getComponent(sp.Skeleton)) {
                this.otherskes.push(child);
                child.active = false;
                child.getComponent(sp.Skeleton).setCompleteListener(() => {
                    child.active = false;
                })
            }
        }
        this.nameBarAlpha.opacity = 0;
        this.nameAlpha.opacity = 0;
        this.workerNum.string = "0/0";
        if (this.lessTime) this.lessTime.string = "00:00:00";

        this.lock = this.find('lock');
        this.lockOffset = this.lock.getPosition();
        this.success = this.find('success');
        this.successOffset = this.success.getPosition();

        this.nameBarOffset = this.nameBar.getPosition();
        this.stateBarOffset = this.stateBar.getPosition();
        this.buildBarOffset = this.buildBar.getPosition();

        if (this.ske.node.active) {
            this.$body = this.ske.node;
        } else {
            this.$body = this.img.node;
        }

        this.hitTest = this.find("hitTest");
        if (this.hitTest) this.hitTest.active = true;
        if (this.$prefab == "prefabs/home/Building") {
            if (this.hitTest) {
                this.hitTest.off(Input.EventType.TOUCH_END, this.onTouch, this);
            } else {
                this.body.off(Input.EventType.TOUCH_END, this.onTouch, this);
            }
            this.lock.off(Input.EventType.TOUCH_END, this.onLock, this);
            this.success.off(Input.EventType.TOUCH_END, this.onLockSuccess, this);
            NoTouch(this);
        } else {
            if (this.hitTest) {
                this.hitTest.on(Input.EventType.TOUCH_END, this.onTouch, this);
            } else {
                this.body.on(Input.EventType.TOUCH_END, this.onTouch, this);
            }
            this.lock.on(Input.EventType.TOUCH_END, this.onLock, this);
            this.success.on(Input.EventType.TOUCH_END, this.onLockSuccess, this);
        }

        this.on(Node.EventType.PARENT_CHANGED, this.onParnetChange, this);
        EventMgr.on("camera_move", this.onCameraMove, this);
        EventMgr.on(Evt_Building_Effect, this.onBuildingSuccess, this);
        EventMgr.on(Evt_Building_Action, this.onAction, this);
        EventMgr.on(Evt_Building_Child_Action, this.onChildAction, this);
        EventMgr.on(Evt_Map_Moving, this.pauseAllSke, this);
        EventMgr.on(Evt_Map_StopMove, this.resumeAllSke, this);
        EventMgr.on(Evt_Show_Home_Ui, this.onShowHomeUi, this);
        EventMgr.on(Evt_Collect_Update, this.onCollectUpdate, this);
    }

    private pauseAllSke() {
        let skes = MapChildren(this, sp.Skeleton);
        for (let ske of skes) {
            ske.paused = true;
        }
    }
    private onShowHomeUi(): void {
        SceneCamera.recoverCamera();
    }
    private resumeAllSke() {
        let skes = MapChildren(this, sp.Skeleton);
        for (let ske of skes) {
            ske.paused = false;
        }
    }

    private onCameraMove(value: boolean) {
        if (!this.$hasLoad) return;
        let nameBar = this.nameBar;
        if (this.arrow && this.arrow.active) {
            this.resetNameBar();
            return;
        }
        if (value) {
            this.resetNameBar();
        } else {
            tween(this.nameBarAlpha).to(1.5, { opacity: 0 }).call(() => {
                // nameBar.active = false;
            }).start();
            tween(this.nameAlpha).to(1.5, { opacity: 0 }).start();
        }
    }
    private resetNameBar(): void {
        Tween.stopAllByTarget(this.nameBarAlpha);
        Tween.stopAllByTarget(this.nameAlpha);
        this.nameBarAlpha.opacity = 255;
        this.nameAlpha.opacity = 255;
    }
    protected start(): void { }

    /**工作 */
    async Work(infos: (SPlayerDataRole | any)[], total: number) {

        if (!this.$hasLoad) await this.loadSub;
        for (let i = 0; i < this.workers.length; i++) {
            let worker = this.workers[i];
            if (!worker) break;
            if (i < infos.length) {
                worker.node.active = true;
                worker.Work(i, infos[i]);
            } else {
                worker.node.active = false;
            }
        }
        if (this.ske.node.active) {
            let action = infos.length ? "Idle" : "Idle_Empty";
            if (CheckAnimation(this.ske, action)) this.ske.setAnimation(0, action, true);
        }
        if (this.strikeEffect) {
            this.strikeEffect.active = infos.length < 1;
        }
        this.workerNum.string = infos.length + "/" + total;
    }

    /**
     * 设置建筑动作
     * @param buildingId 
     * @param action 
     */
    async onAction(buildingId: number, action: string) {
        if (this.ske && this.buildingId == buildingId) {
            // console.log("onAction", buildingId, action);
            if (CheckAnimation(this.ske, action)) {
                if (this.ske.getCurrent(0)?.animation.name == action) return;
                this.ske.setAnimation(0, action, true);
            }
        }
    }

    /**
     * 播放指定子对象
     * @param buildingId 
     * @param childName 
     * @returns 
     */
    protected async onChildAction(buildingId: number, childName: string, loop: boolean = false) {
        if (this.buildingid != buildingId) return;
        let ske = this.find(childName, sp.Skeleton);
        if (ske) {
            ske.node.active = true;
            ske.setAnimation(0, "animation", loop);
        }
    }

    get LoadSub() { return this.loadSub; }
    get InitSub() { return this.initSub; }
    get HideSub() { return this.hideSub; }
    get seed() { return this.useSeed; }
    get prefab() { return this.$prefab; }
    get buildingId() { return this.buildingid; }
    get type() { return this.buildingType; }
    get body() {
        if (this.$body) return this.$body;
        if (this.img && this.img.node.active) return this.img.node;
        if (this.ske && this.ske.node.active) return this.ske.node;
        return this.img.node;
    }
    private _boundBox: Rect;
    private _boundoffset = v2();
    get boundBox() {
        let box: Rect;
        if (this._boundBox) {
            this._boundBox.x += (this.position.x - this._boundoffset.x);
            this._boundBox.y += (this.position.y - this._boundoffset.y);
        }
        if (this.hitTest && this.hitTest.activeInHierarchy) {
            box = GetBoundingBoxTo(this.hitTest, this.parent);
            if (!this._boundBox) this._boundBox = box;
        } else if (this.$body && this.$body.activeInHierarchy) {
            if (!this.$body.activeInHierarchy && this._boundBox) return this._boundBox;
            box = GetBoundingBoxTo(this.$body, this.parent);
        } else if (this.img && this.img.node.activeInHierarchy) {
            if (!this.img.node.activeInHierarchy && this._boundBox) return this._boundBox;
            box = GetBoundingBoxTo(this.img.node, this.parent);
        } else if (this.ske && this.ske.node.activeInHierarchy) {
            if (!this.ske.node.activeInHierarchy && this._boundBox) return this._boundBox;
            box = GetBoundingBoxTo(this.ske.node, this.parent);
        } else if (this._boundBox) {
            box = this._boundBox;
        } else {
            box = new Rect(this.position.x - 150, this.position.y - 150, 300, 300);
        }
        this._boundoffset.x = this.position.x;
        this._boundoffset.y = this.position.y;
        return box;
    }

    /**
     * 初始化建筑
     * @param homeId 
     * @param layoutCfg 
     * @param name 
     * @param lvCfg 
     */
    async Init(homeId: number, layoutCfg: BuildingLayout, level: number) {
        this.active = true;
        this.homeId = homeId;
        this.lvCfg = CfgMgr.GetBuildingLv(layoutCfg.buildingId, level);
        this.buildLevel = level;
        this.layoutCfg = layoutCfg;
        this.buildingid = layoutCfg.buildingId;
        this.buildingType = layoutCfg.type;
        this.localtion = layoutCfg.location;
        this.setPosition(layoutCfg.x, layoutCfg.y);
        this.bounds = [];
        for (let idx of layoutCfg.bounds) {
            this.bounds.push(idx);
        }
        this.bounds.sort((a, b) => { return a - b; });

        if (!this.$hasLoad) await this.loadSub;
        this.$proxy.node.setPosition(layoutCfg.offsetX, layoutCfg.offsetY);
        const buildType = BuildingType[layoutCfg.type];
        this.name = buildType ? buildType : this.$prefab.split("/").pop();//stdDefine ? stdDefine.remark : layoutCfg.name;
        let stdDefine = CfgMgr.GetBuildingUnLock(this.buildingId);
        this.nameLabel.string = stdDefine ? stdDefine.remark : layoutCfg.name;

        for (let worker of this.workers) {
            worker.node.active = false;
        }
        for (let other of this.otherskes) {
            other.active = false;
        }

        if (this.ske) {
            if (CheckAnimation(this.ske, "Idle")) {
                this.ske.setAnimation(0, "Idle", true);
            } else if (CheckAnimation(this.ske, "Idle_Empty")) {
                this.ske.setAnimation(0, "Idle_Empty", true);
            } else if (this.ske.skeletonData) {
                let actions = this.ske.skeletonData.getAnimsEnum();
                for (let k in actions) {
                    this.ske.setAnimation(0, k, true);
                    break;
                }
            }

        }

        if (this.lvCfg) {
            this.lvLabel.string = this.nameLabel.string + "Lv" + this.buildLevel;
        } else {
            this.lvLabel.getComponent(Label).string = this.nameLabel.string;
        }

        this.onCollectUpdate();
        // if (this.type == BuildingType.sheng_chan && PlayerData.fightState == FightState.None) {
        //     SetQipao(this);
        // }

        EventMgr.emit(Evt_Building_Complete, this.buildingId, this.buildingType);
        if (this.initHandle) {
            let h = this.initHandle;
            this.initHandle = undefined;
            h(this.useSeed);
        }
    }

    protected onCollectUpdate() {
        if (PlayerData.roleInfo && PlayerData.resources && PlayerData.nowhomeLand) {
            this.colletcTime = 0;
            switch (this.type) {
                case BuildingType.cai_mu:
                    this.colletcTime = PlayerData.nowhomeLand.total_wood_collect_duration;
                    break;
                case BuildingType.cai_kuang:
                    this.colletcTime = PlayerData.nowhomeLand.total_rock_collect_duration;
                    break;
                case BuildingType.cai_shui:
                    this.colletcTime = PlayerData.nowhomeLand.total_water_collect_duration;
                    break;
                case BuildingType.hua_fang:
                    this.colletcTime = PlayerData.nowhomeLand.total_seed_collect_duration;
                    break;
                default:
                    break;
            }
            this.colletcTime = PlayerData.nowhomeLand.total_wood_collect_duration + PlayerData.GetServerTime();
            this.canCollect = this.colletcTime > 0;
        }
    }

    Reset() {
        this.useSeed++;
        let thisObj = this;
        this.hideSub = new Promise((resolve, reject) => {
            thisObj.hideHandle = resolve;
        });
        this.initSub = new Promise((resolve, reject) => {
            thisObj.initHandle = resolve;
        })
    }

    Clean() {
        this.buildingid = undefined;
        this.upgradeCompleteTime = undefined;
        this.upgradeDuration = undefined;
        this.canLock = false;
        this.colletcTime = undefined;
        this.canCollect = false;
        if (this.$hasLoad) {
            for (let k in this.childVisibles) {
                let obj = this.childVisibles[k];
                obj.child.active = obj.active;
            }
        }

        if (this.hideHandle) {
            let handle = this.hideHandle;
            this.hideHandle = undefined;
            handle(this.useSeed);
        }
        if (this.initHandle) {
            let handle = this.initHandle;
            this.initHandle = undefined;
            handle(this.useSeed);
        }
    }

    /**
     * 更新状态
     * @param sbuilding 
     * @returns 
     */
    async FlushState(sbuilding: SPlayerDataBuilding) {
        if (!this.buildingId) return;
        if (!this.$hasLoad) await this.loadSub;
        // this.lock.active = false;
        this.success.active = false;
        this.buildBar.active = false;
        let state = sbuilding ? sbuilding.state : BuildingState.Lock;
        switch (state) {
            case BuildingState.Lock:
                // this.lock.active = true;
                break;
            case BuildingState.CanUnLock:
                this.success.active = true;
                break;
            case BuildingState.Building:
                this.buildBar.active = true;
                this.upgradeCompleteTime = sbuilding.upgrade_time;
                if (sbuilding.level <= 1) {
                    this.upgradeDuration = CfgMgr.GetBuildingUnLock(sbuilding.id).UnlockDuration || 0;
                    this.building.active = true;//building.level == 0;
                } else {
                    this.upgradeDuration = CfgMgr.GetBuildingLv(this.buildingId, sbuilding.level).ConstructDuration || 0;
                }
                break;
            case BuildingState.Complete:
                break;
        }
    }

    private loadSeed = 0;

    /**
     * 加载
     * @param url 
     */
    async Load(url: string, action?: string) {
        if (!this.$hasLoad) await this.loadSub;
        if (!url) {
            this.ske.node.active = false;
            this.img.node.active = false;
            return;
        }
        this.ske.node.active = false;
        this.img.node.active = true;
        this.$body = this.img.node;
        let seed = ++this.loadSeed;
        let spriteFrame = await ResMgr.LoadResAbSub(url.replace(/(\.png)|(\.jpg)/, "") + "/spriteFrame", SpriteFrame);
        if (seed != this.loadSeed) return;
        this.img.spriteFrame = spriteFrame;
        this.select.spriteFrame = this.img.spriteFrame;
        this.nameLabel.node.setPosition(0, this.img.getComponent(UITransform).height / 2);
    }

    protected onParnetChange() {
        if (this.barContent && this.barContent.parent) this.barContent.parent.removeChild(this.barContent);
        if (this.labContent && this.labContent.parent) this.labContent.parent.removeChild(this.labContent);
    }

    TweenTo() {
        let zoom: number = 0.7;
        let changeY: number = this.position.y - 340;
        SceneCamera.TweenTo(this.position.x, changeY, zoom);
    }

    /**
     * 交互
     * @returns 
     */
    protected onTouch(e: EventTouch) {
        if (!this.buildingid) e.preventSwallow = true;
        if (PlayerData.isHideUI) return;
        if (PlayerData.fightState != FightState.Home) return;
        if (Building.dragLoop != Building.dragSeed || PlayerData.fightState != FightState.Home) return;
        if (!CanSet(this.buildingType) || this.nameLabel.string == '' || this.nameLabel.string == null) return;
        let buildingState = PlayerData.GetBuilding(this.buildingId, this.homeId);
        if (!buildingState) return;
        if (this.lock.active) {
            //解锁
            let data = {
                type: MsgTypeSend.BuildingUnlock,
                data: { building_id: this.buildingId }
            }
            Session.Send(data, MsgTypeRet.BuildingUnlockRet);
            return;
        }
        let zoom: number = 0.7;
        let changeY: number = this.position.y - 340;
        let thisObj = this;
        SceneCamera.TweenTo(this.position.x, changeY, zoom, () => {
            if (thisObj.buildLevel == 0) return;
            switch (thisObj.type) {
                case BuildingType.ji_di:
                    // //Logger.log('点击主基地----->>>')
                    // JidiPanel.Show(thisObj.buildingId, thisObj.type);
                    Goto(PANEL_TYPE.JidiPanel, thisObj.type);
                    break;
                case BuildingType.cai_mu:
                case BuildingType.cai_kuang:
                case BuildingType.cai_shui:
                case BuildingType.hua_fang:
                case BuildingType.cheng_qiang:
                case BuildingType.fang_yu_ta:
                    //Logger.log('点击升级场----->>>')
                    if (thisObj.buildLevel == 0) return;
                    Goto(PANEL_TYPE.ResourcesPanel, this.buildingId);
                    break;
                case BuildingType.he_cheng:
                    //Logger.log('点击合成工坊----->>>')
                    Goto(PANEL_TYPE.CompoundPanel);
                    break;
                case BuildingType.fan_yu:
                    //Logger.log('点击合繁育巢----->>>');
                    HomeLogic.ins.GoToFanyuScene();
                    Goto(PANEL_TYPE.FanyuPanel);
                    break;
                case BuildingType.sheng_chan:
                    //Logger.log('点击生产工坊----->>>')
                    Goto(PANEL_TYPE.ProductionPanel, this.buildingId);
                    break;
                case BuildingType.bing_ying:
                    //Logger.log('点击兵营----->>>');
                    Goto(PANEL_TYPE.SoldierProductionPanel, this.buildingId);
                    break;
                default:
                    return;
            }
            AudioMgr.playSound("building_" + BuildingType[thisObj.type], false);
        });
    }

    /**
     * 检测是否达到解锁条件
     */
    protected checkLock() {
        let stdDefine = CfgMgr.GetBuildingUnLock(this.buildingId);
        if (!stdDefine || !PlayerData.roleInfo || PlayerData.fightState == FightState.PvP) return;
        let lockLevel = stdDefine.Level;
        let lockMoney = stdDefine.Money;
        let lockItem = stdDefine.ItemId;
        let lockItemNum = stdDefine.ItemNum;
        let infos = PlayerData.GetBuildingByType(BuildingType.ji_di, this.homeId);
        let level = infos[0].level;//homeland.level;
        let money = PlayerData.roleInfo.currency;
        let result = true;
        for (let i = 0; i < lockItem.length; i++) {
            let id = lockItem[i];
            if (lockItemNum[i] <= 0 || PlayerData.GetItemCount(id) < lockItemNum[i]) {
                result = false;
                break;
            }
        }
        if (level >= lockLevel) {//达到解锁条件
            this.canLock = true;
            this.lock.active = true;
        } else {
            this.canLock = false;
            this.lock.active = false;
        }
    }

    protected update(dt: number): void {
        if (!PlayerData.roleInfo) return;
        let isShowArrow: boolean = false;
        let now = PlayerData.GetServerTime();
        // console.log("upgradeCompleteTime***", this.buildBar.active, this.upgradeCompleteTime, now)
        if (this.buildBar.active && this.upgradeCompleteTime >= now) {
            let pass = this.upgradeCompleteTime - now;
            let less = Math.max(0, this.upgradeDuration - pass);
            this.buildProgress.progress = less / this.upgradeDuration;
            let time = Math.max(0, pass)
            this.buildTime.string = formatTime(time);
            this.building.active = true;//this.buildLevel == 0;
        } else {
            if (this.buildBar.active) {
                this.success.active = true;
                // console.log("Building.update", this.buildingid);
                // this.lock.active = false;
                // this.img.node.active = true;
                // this.body.active = true;
            }
            this.buildBar.active = false;
            this.building.active = false;
        }
        let state = PlayerData.GetBuilding(this.buildingId, this.homeId);
        if (!state) { //未拥有该建筑
            this.checkLock();
        } else {
            this.lock.active = false;
            let residueTime: number = 0;
            if (state.upgrade_time) {
                residueTime = state.upgrade_time - PlayerData.GetServerTime();
            }
            if (state.upgrade_time && residueTime <= 0) {
                this.success.active = true;
            } else {
                this.success.active = false;
            }
            if (this.canUpBuildType[this.type]) {
                let std: StdBuilding = CfgMgr.GetBuildingLv(this.buildingId, state.level);
                if (std && residueTime <= 0) {
                    isShowArrow = true;
                    if (std.ConditionId && std.ConditionId.length) {
                        for (let index = 0; index < std.ConditionId.length; index++) {
                            let condId: number = std.ConditionId[index];
                            let condVal: number = std.ConditionLv[index];
                            if (CheckCondition(condId, condVal) != undefined) {
                                isShowArrow = false;
                                break;
                            }
                        }

                    }
                    if (std.RewardType && std.RewardType.length) {
                        if (!ItemUtil.CheckThingConsumes(std.RewardType, std.RewardID, std.RewardNumber)) {
                            isShowArrow = false;

                        }
                    }
                }
            } else if (this.type == BuildingType.he_cheng) {
                let compoundCount: number = PlayerData.roleInfo.resource_exchange_uses || 1;
                let stdCompound = CfgMgr.GetCompound()[compoundCount];
                if (stdCompound) {
                    let res = PlayerData.resources;
                    if (res.rock >= stdCompound.RockNum &&
                        res.wood >= stdCompound.WoodNum &&
                        res.water >= stdCompound.WaterNum &&
                        res.seed >= stdCompound.SeedNum && PlayerData.GetItemCount(stdCompound.ItemId) >= stdCompound.Cost
                    ) {
                        isShowArrow = true;
                    }


                }

            }
        }

        if (this.canCollect && this.lessTime) {
            let deltaTime = this.colletcTime;
            if (deltaTime < 0) {
                this.lessTime.string = '00:00:00';
            }
            else {
                // deltaTime -= dt;
                let str = countDown(deltaTime);
                this.lessTime.string = str;
            }
        }

        let p = this.$proxy.node.position;
        if (this.barContent) {
            this.barContent.active = this.active;
            this.barContent.setPosition(this.position.x + p.x, this.position.y + p.y);
        }
        if (this.labContent) {
            this.labContent.active = this.active;
            this.labContent.setPosition(this.position.x + p.x, this.position.y + p.y);

            for (let labs of this.labMap) {
                labs[0].active = labs[1].activeInHierarchy;
                if (labs.length <= 2) continue;
                let proxy = labs[2];
                let size = labs[0].getComponent(UITransform).contentSize;
                proxy.getComponent(UITransform).setContentSize(size.width, size.height);
                let [x, y] = ConvertNode(proxy, this.labContent);
                labs[0].setPosition(x, y);
            }
        }

        if (this.arrow) {
            this.arrow.active = isShowArrow;
            if (isShowArrow) this.resetNameBar();
        }
        if (this.produce) {
            if (this.buildingType == BuildingType.bing_ying) {
                this.produce.node.active = PlayerData.roleInfo.soldier_productions && PlayerData.roleInfo.soldier_productions.length > 0;
            } else {
                this.produce.node.active = false;
            }

        }

    }

    private barContent: Node;
    private labContent: Node;
    private labMap: Node[][] = [];

    async GetLab() {
        await this.loadSub;
        if (!this.labContent) {
            let $trans = this.$proxy.node.getComponent(UITransform);
            let scale = this.$proxy.node.getScale();
            this.labContent = new Node(this.prefab.split(/[\/\\]/).pop());
            this.labContent.setScale(scale.x, scale.y, scale.z);
            let trans = this.labContent.addComponent(UITransform);
            trans.setAnchorPoint($trans.anchorX, $trans.anchorY);
            trans.setContentSize($trans.contentSize.width, $trans.contentSize.height);

            let labels = MapChildren(this, Label);
            for (let label of labels) {
                let parent = label.node.parent;
                let arr = [label.node, parent];
                label.cacheMode = Label.CacheMode.BITMAP;
                if (parent.getComponent(Layout)) {
                    let proxy = new Node(label.node.name);
                    proxy.addComponent(UITransform);
                    parent.insertChild(proxy, label.node.getSiblingIndex());
                    arr.push(proxy);
                }
                let [x, y] = ConvertNode(label.node, this.$proxy.node);
                this.labContent.addChild(label.node);
                label.node.setPosition(x, y);
                this.labMap.push(arr);
            }

        }
        return this.labContent;
    }

    async GetBar() {
        await this.loadSub;
        if (!this.barContent) {
            let $trans = this.$proxy.node.getComponent(UITransform);
            let scale = this.$proxy.node.getScale();
            this.barContent = new Node(this.prefab.split(/[\/\\]/).pop());
            this.barContent.setScale(scale.x, scale.y, scale.z);
            let trans = this.barContent.addComponent(UITransform);
            trans.setAnchorPoint($trans.anchorX, $trans.anchorY);
            trans.setContentSize($trans.contentSize.width, $trans.contentSize.height);
            let bars = [this.nameBar, this.stateBar, this.buildBar, this.lock, this.success];
            for (let bar of bars) {
                if (!bar) {
                    console.warn("");
                }
                let [x, y] = ConvertNode(bar, this.$proxy.node);
                this.barContent.addChild(bar);
                bar.setPosition(x, y);
            }
        }
        return this.barContent;
    }

    /**
     * 可以解锁
     */
    onLock(e: EventTouch) {
        if (!this.buildingid) e.preventSwallow = true;
        if (PlayerData.fightState != FightState.Home) return;
        let buildingDef = CfgMgr.GetBuildingUnLock(this.buildingId);
        if (buildingDef) {
            BuildingPanel.Show(buildingDef);
        }
    }

    /**
     * 解锁成功
     */
    onLockSuccess(e: EventTouch) {
        if (!this.buildingid) e.preventSwallow = true;
        if (PlayerData.fightState != FightState.Home) return;
        let self = this;
        this.onBuildingSuccess(this.buildingId);
        if (this.buildLevel == 0) {
            BuildCompletedPanel.Show(this.homeId, this.type, () => {
                let data = {
                    type: MsgTypeSend.BuildingUpgradeComplete,
                    data: {
                        building_id: self.buildingId,
                        upgrade_level: self.buildLevel ? self.buildLevel : 1,
                    }
                }
                //Logger.log('升级成功--------->>>', data);
                Session.Send(data);
                self.success.active = false;
            }, this.buildingId);
        } else {
            this.success.active = false;
            // spine.setCompleteListener(() => {
            let data = {
                type: MsgTypeSend.BuildingUpgradeComplete,
                data: {
                    building_id: this.buildingId,
                    upgrade_level: this.buildLevel ? this.buildLevel : 1,
                }
            }
            //Logger.log('升级成功--------->>>', data);
            Session.Send(data);
            // })
        }
    }

    private onBuildingSuccess(buildingId: number) {
        if (this.buildingId != buildingId) return;
        if (!this.activeInHierarchy) return;
        let eff = this.find('ui_buildcomple');
        if (eff && this.parent) {
            AudioMgr.PlayOnce(Audio_BuildingSucceed)
            let ske = instantiate(eff);
            ske.active = true;
            this.parent.addChild(ske);
            ske.setPosition(this.position.x + eff.position.x, this.position.y + eff.position.y);
            let spine = ske.getComponent(sp.Skeleton);
            spine.setAnimation(0, 'animation', false);
            spine.setCompleteListener(() => {
                if (ske.parent) ske.parent.removeChild(ske);
                ske.destroy();
            });
        }
    }
}

