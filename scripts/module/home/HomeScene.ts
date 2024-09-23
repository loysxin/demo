import { EventTouch, Input, JsonAsset, Label, Node, Rect, UITransform, Vec2, assetManager, find } from 'cc';
import { Panel } from "../../GameRoot";
import { folder_bgm, ResMgr } from "../../manager/ResMgr";
import { BuildingLayout, BuildingType, GetPrefabFolder, HomeLayout } from "./HomeStruct";
import { Tile } from "./entitys/Tile";
import { Building } from "./entitys/Building";
import { SceneCamera } from "../SceneCamera";
import { map } from "./MapData";
import PlayerData, { BuildingState, FightState, SPlayerDataBuilding, SPlayerDataRole } from "../roleModule/PlayerData";
import { CfgMgr, StdBuilding } from "../../manager/CfgMgr";
import { Convert, MapChildren, Second, maxx, minn } from "../../utils/Utils";
import { GameSet } from "../GameSet";
import { EventMgr, Evt_Add_Entity_Bar, Evt_EnterHome, Evt_Map_Moving, Evt_Map_StopMove } from "../../manager/EventMgr";
import { PlayAddRes } from "./entitys/Add";
import { Loading } from "../../Loading";
import { MarqueePanel } from './panel/MarqueePanel';
import { BeforeGameUtils } from '../../utils/BeforeGameUtils';
import { AudioGroup, SoundDefine } from '../../manager/AudioMgr';

export class HomeScene extends Panel {
    protected prefab: string = "prefabs/home/HomeScene";

    static get ins(): HomeScene { return this.$instance; }
    GetHomeCfg() { return this.homeLayout; }

    private waitUI: Node;
    private hitTest: Node;

    private homeLayout: HomeLayout;
    private homeDefine: { HomeId: number, Style: number, MinScale: number, MaxScale: number, InitScale: number };
    private tiles: Tile[] = [];//地图切块列表
    private buildingPool: { [prefab: string]: Building[] } = {};
    private buildings: Building[] = [];//地图建筑列表

    private groundLay: Node;//地面层级
    private shadowLay: Node;//影子
    private pveLay: Node;//PVE层级
    private entityLay: Node;//实体层级
    private barLay: Node;//名字层
    private skyLay: Node;//顶层影子
    private labLay: Node;//文本层

    private moving = false;
    private curHomeId: number;

    protected onLoad(): void {
        this.find("drawer").active = false;
        this.groundLay = this.find("groundLay");
        this.shadowLay = this.find("shadowLay");
        this.pveLay = this.find("pveLay");
        this.entityLay = this.find("entityLay");
        this.barLay = this.find("barLay");
        this.skyLay = this.find("skyLay");
        this.labLay = this.find("labLay");
        this.waitUI = this.find("waitting");
        this.hitTest = this.find("hitTest");
        this.hitTest.active = true;
        this.hitTest.on(Input.EventType.TOUCH_MOVE, this.onMove, this);
        this.hitTest.on(Input.EventType.TOUCH_CANCEL, this.onTouch, this);
        this.hitTest.on(Input.EventType.TOUCH_START, this.onTouch, this);
        this.hitTest.on(Input.EventType.TOUCH_END, this.onTouch, this);

        // if (fgui.GRoot.inst) {
        //     fgui.GRoot.inst.on(Node.EventType.MOUSE_WHEEL, this.onWheel, this);
        // } else {
        this.hitTest.on(Node.EventType.MOUSE_WHEEL, this.onWheel, this);
        // }
        this.node.addChild(SceneCamera.instance.node);
        EventMgr.on(Evt_Add_Entity_Bar, this.AddBar, this);
        EventMgr.on("camera_trans", this.onCamereaTrans, this);
    }

    private scaleLeng: number;
    onMove(e: EventTouch) {
        // EventMgr.emit(Evt_Map_Moving);
        this.moving = true;
        if (!this.isCanMove()) return;

        let touchs = e.getTouches();
        if (touchs.length == 1) {
            let dv = e.touch.getDelta();
            if (dv.length() >= 2 || Building.dragSeed != Building.dragLoop) {
                Building.dragSeed++;
                SceneCamera.Move(-dv.x / GameSet.HomeScale, -dv.y / GameSet.HomeScale);
            }
            EventMgr.emit("camera_move", true);
        } else if (touchs.length > 1) {
            let dv = Vec2.distance(touchs[0].getLocation(), touchs[1].getLocation()) / 2;
            if (this.scaleLeng == undefined) {
                this.scaleLeng = dv;
            } else {
                Building.dragSeed++;
                let scale = dv / this.scaleLeng;
                this.scaleLeng = dv;
                scale = scale - 1 + GameSet.HomeScale;
                scale = maxx(this.homeDefine.MinScale, scale);
                scale = minn(this.homeDefine.MaxScale, scale);
                if (isNaN(scale) || scale == Infinity) return;
                // if (abss(scale - GameSet.HomeScale) >= 0.01) {

                SceneCamera.Zoom(scale);
                // }
            }
        }
    }
    onTouch(e: EventTouch) {
        // Logger.log('onTouch', e.type, Building.dragLoop, Building.dragSeed);
        e.preventSwallow = true;
        // Logger.log("onTouch", e.type);
        if (e.type == Input.EventType.TOUCH_START) {
            Building.dragLoop = Building.dragSeed;
        }
        if (e.type == Input.EventType.TOUCH_CANCEL || e.type == Input.EventType.TOUCH_END) {
            EventMgr.emit("camera_move", false);
            this.scaleLeng = undefined;
            if (e.getTouches().length <= 1) {
                // EventMgr.emit(Evt_Map_StopMove);
                this.moving = false;
            }
        }
    }
    onWheel(e: any) {
        if (!this.isCanMove()) return;
        let scaleNum = e.getScrollY();
        let scale = GameSet.HomeScale + scaleNum * 0.0001;
        // Logger.log('onWheel', scale, this.homeDefine.MinScale, this.homeDefine.MaxScale);
        scale = maxx(this.homeDefine.MinScale, scale);
        scale = minn(this.homeDefine.MaxScale, scale);
        SceneCamera.Zoom(scale);
    }
    /**是否可移动相机 */
    private isCanMove(): boolean {
        if (Loading.Showing) return false;
        if (!(PlayerData.fightState == FightState.Home || PlayerData.fightState == FightState.None)) return false;
        if (MarqueePanel.Showing) return true;
        if (PlayerData.isHideUI) return true;
        return Panel.GetPanelNum("HomeUI") < 1;
    }

    /**重写场景显示 */
    static async Show(...args) {
        find("SceneCanvas").addChild(this.$instance.node);
        if (!this.$instance.parent) this.$instance.onShow(...args);
        this.$instance.flush(...args);
        if (this.$loading) return this.$loading;
        return Promise.resolve(this.$instance);
    }

    protected onShow(): void {

    }
    protected onHide(...args: any[]): void {

    }
    public flush(...args: any[]): void {

    }

    private jidi: Building;
    /**初始化 */
    async Init(homeLand: any, sbuildings: { [buildingId: number]: SPlayerDataBuilding }) {
        assetManager.downloader.maxConcurrency = 1;

        // Logger.log("Init>>>", sbuildings);
        if (!this.$hasLoad) await this.initSub;
        this.waitUI.active = true;
        this.homeDefine = homeLand;

        this.reset();

        //初始地形图片
        this.groundLay.removeAllChildren();
        let jsonAsset = await ResMgr.LoadResAbSub("config/home/" + homeLand.Style, JsonAsset);
        let homeLayout: HomeLayout = jsonAsset.json;
        console.log("HomeScene.Init###", homeLand, sbuildings, homeLayout);
        map.SetMapData(homeLayout.nodeWide, homeLayout.nodeHide, homeLayout.gridCol, homeLayout.nodeRow, homeLayout.nodeCol, homeLayout.nodes, homeLayout.buildings, homeLayout.mapBaking);
        this.homeLayout = homeLayout;

        homeLand.MinScale = maxx(homeLand.MinScale, Math.ceil(GameSet.SceneCanvasWidth / homeLayout.width * 10) / 10, Math.ceil(GameSet.SceneCanvasHeight / homeLayout.height * 10) / 10);

        this.receiveBuildings();
        this.receiveAllEntitys();

        for (let i = 0; i < homeLayout.tiles.length; i++) {
            let tile = this.tiles[i];
            if (!tile) {
                tile = new Tile();
                tile.layer = GameSet.Scenelayer;
                this.tiles.push(tile);
            }
            tile.active = false;
            this.showlist = {};
            this.groundLay.addChild(tile);
            let tileSize = homeLayout.tileSize;
            let tx = (i % homeLayout.tileCol) * tileSize;
            let ty = Math.floor(i / homeLayout.tileCol) * tileSize;
            tile.Init(homeLayout.tiles[i], tx + homeLayout.tileSize / 2, ty + homeLayout.tileSize / 2, tileSize);
        }

        GameSet.HomeWidth = homeLayout.width;
        GameSet.HomeHeight = homeLayout.height;
        this.hitTest.getComponent(UITransform).setContentSize(homeLayout.width, homeLayout.height);
        let jdLayout = homeLayout.buildings.filter(buildingLayout => buildingLayout.type == BuildingType.ji_di)[0];
        if (jdLayout) {
            SceneCamera.LookAt(jdLayout.x, jdLayout.y, false);
        } else {
            SceneCamera.LookAt(homeLayout.width / 2, homeLayout.height / 2, false);
        }
        SceneCamera.Zoom(this.homeDefine.InitScale, false);
        this.onCamereaTrans();

        //初始建筑
        for (let i = 0; i < homeLayout.buildings.length; i++) {
            let buildingLayout: BuildingLayout = homeLayout.buildings[i];
            let prefab = buildingLayout.prefab;
            let sbuilding: SPlayerDataBuilding = sbuildings[buildingLayout.buildingId];
            let lvCfg: StdBuilding;
            let stdDefine = CfgMgr.GetBuildingUnLock(buildingLayout.buildingId);
            if (sbuilding && sbuilding.level && prefab) {
                lvCfg = CfgMgr.GetBuildingLv(buildingLayout.buildingId, sbuilding.level);
                if (lvCfg) {
                    prefab = prefab.replace(/\/[^\/]+$/, "/" + lvCfg.Prefab);
                } else if (sbuilding && sbuilding.state == BuildingState.Building) {
                    prefab = prefab.replace(/\/[^\/]+$/, "/00");
                } else if (stdDefine) {
                    prefab = prefab.replace(/\/[^\/]+$/, "/" + stdDefine.Prefab);
                } else {
                    prefab = prefab.replace(/\/[^\/]+$/, "/00");
                }
            } else if (prefab) {
                //未解锁
                prefab = prefab.replace(/\/[^\/]+$/, "/00");
                if (!ResMgr.HasResource(prefab)) {
                    prefab = buildingLayout.prefab;
                }
            }
            console.log("init building ----------", buildingLayout.name, prefab || "");
            let building = this.createBuilding(prefab || "");
            this.buildings.push(building);
            this.AddEntity(building);
            let p = building.Init(homeLayout.homeId, buildingLayout, sbuilding ? sbuilding.level : 0);
            if (sbuilding) {
                if (stdDefine && stdDefine.BuildingSubType == BuildingType.ji_di) await p;
                building.FlushState(sbuilding);
            }
            if (!prefab) building.Load(buildingLayout.url);
            if (buildingLayout.type == BuildingType.ji_di) this.jidi = building;
        }

        // GameSet.HomeWidth = homeLayout.width;
        // GameSet.HomeHeight = homeLayout.height;
        // this.hitTest.getComponent(UITransform).setContentSize(homeLayout.width, homeLayout.height);

        if (this.jidi) {
            SceneCamera.LookAt(this.jidi.position.x, this.jidi.position.y, false);
        } else {
            SceneCamera.LookAt(homeLayout.width / 2, homeLayout.height / 2, false);
        }
        this.waitUI.active = false;
        SceneCamera.Zoom(this.homeDefine.InitScale, false);

        this.onCamereaTrans();
        this.update(0);

        EventMgr.emit(Evt_EnterHome, homeLand.HomeId);
    }

    /**
     * 显示或隐藏建筑
     * @param type 
     * @param value 
     */
    VisibleBuilding(type: BuildingType, value: boolean) {
        for (let building of this.buildings) {
            if (building.type == type) {
                this.hideChildMap[building.uuid] = !value;
                building.active = value;
            }
        }
    }
    private hideChildMap: { [uuid: string]: boolean } = {};

    /**
     * 显示或隐藏所有建筑
     * @param type 
     * @param value 
     */
    VisibleAllBuildings(value: boolean) {
        for (let building of this.buildings) {
            this.hideChildMap[building.uuid] = !value;
            building.active = value;
        }
    }

    /**创建建筑 */
    private createBuilding(prefab: string) {
        let url = prefab || "";
        let buildings = this.buildingPool[url];
        if (!buildings) {
            buildings = [];
            this.buildingPool[url] = buildings;
        }
        let building: Building;
        if (buildings.length) {
            building = buildings.shift();
        } else {
            building = Building.Create(prefab);
        }
        building.homeId = this.homeLayout.homeId;
        building.Reset();
        return building;
    }
    /**回收所有建筑 */
    private receiveBuildings(value?: number | Building) {
        let buildingId: number, building: Building;
        if (value == undefined) {
            for (building of this.buildings) {
                let pool = this.buildingPool[building.prefab || ""];
                if (!pool) {
                    pool = [];
                    this.buildingPool[building.prefab || ""] = pool;
                }
                pool.push(building);
                building.Clean();
                building.parent && building.parent.removeChild(building);
            }
            this.buildings.length = 0;
            return;
        }
        if (typeof (value) == "string") {
            buildingId = value;
            for (let i = this.buildings.length - 1; i >= 0; i--) {
                if (buildingId == undefined || buildingId == building.buildingId) {
                    building = this.buildings[i];
                    this.buildings.splice(i, 1);
                }
            }
        } else {
            building = value as Building;
        }
        let pool = this.buildingPool[building.prefab || ""];
        if (!pool) {
            pool = [];
            this.buildingPool[building.prefab || ""] = pool;
        }
        pool.push(building);
        building.Clean();
        building.parent && building.parent.removeChild(building);
    }
    private receiveAllEntitys() {
        let children = this.entityLay.children;
        for (let child of children) {
            this.entityLay.removeChild(child);
            if (child["receive"]) {
                child["receive"]();
            } else {
                child.destroy();
            }
        }
    }

    async AddResource(wood: number, rock: number, water: number, seed: number) {
        if (wood) {
            PlayAddRes(this.jidi, BuildingType.cai_mu, wood, 120, 100);
            await Second(0.8);
        }
        if (rock) {
            PlayAddRes(this.jidi, BuildingType.cai_kuang, rock, 100, -20);
            await Second(0.8);
        }
        if (water) {
            PlayAddRes(this.jidi, BuildingType.cai_shui, water, -100, 50);
            await Second(0.8);
        }
        if (seed) {
            PlayAddRes(this.jidi, BuildingType.hua_fang, seed, -60);
        }
    }

    /**更新建筑 */
    FlushBuilding(sbuilding: SPlayerDataBuilding) {
        let stdDefine = CfgMgr.GetBuildingUnLock(sbuilding.id);
        let stdLv = CfgMgr.GetBuildingLv(stdDefine.BuildingId, sbuilding.level);//获取建筑等级配置
        let prefab = "00";
        if (stdLv) {
            prefab = stdLv.Prefab;
        } else if (sbuilding && sbuilding.state == BuildingState.Building) {

        } else if (stdDefine) prefab = stdDefine.Prefab;
        if (!prefab) return;
        prefab = GetPrefabFolder(stdDefine.BuildingType) + prefab;
        let target: Building, old: Building;
        for (let obj of this.buildings) {
            if (obj.buildingId == sbuilding.id) {
                if (obj.prefab == prefab) {
                    target = obj;
                } else {
                    old = obj;
                    // this.receiveBuildings(sbuilding.id);
                    let index = this.buildings.indexOf(obj);
                    if (index != -1) this.buildings.splice(index, 1);
                    obj.Clean();
                }
                break;
            }
        }
        if (!target) {
            target = this.createBuilding(prefab);
            this.buildings.push(target);
            this.AddEntity(target);
            if (old) {
                target.setPosition(old.position.x, old.position.y);
                let thisObj = this;
                target.LoadSub.then(() => {
                    thisObj.receiveBuildings(old);
                })
            }
        }
        for (let buildingLayout of this.homeLayout.buildings) {
            if (buildingLayout.buildingId == sbuilding.id) {
                target.Init(this.homeLayout.homeId, buildingLayout, sbuilding.level);
                target.FlushState(sbuilding);
                break;
            }
        }
    }

    /**
     * 刷新工人数量
     * @param buildingId 
     */
    FlushWoker(buildingId: number, workers: SPlayerDataRole[], total: number) {
        for (let building of this.buildings) {
            if (building.buildingId == buildingId) {
                building.Work(workers, total);
            }
        }

    }

    /**
     * 获取建筑位置
     * @param buildingId 
     * @returns 
     */
    GetBuildingPosition(buildingId: number) {
        for (let building of this.buildings) {
            if (building.buildingId == buildingId) {
                return [building.position.x, building.position.y];
            }
        }
        return [];
    }
    TransBuildingPositionToUI(buildingId: number) {
        let target: Node;
        for (let building of this.buildings) {
            if (building.buildingId == buildingId) {
                target = building.body;
                break;
            }
        }
        let [x, y] = Convert(target.position.x, target.position.y, target.parent, this.node.parent);
        let p = SceneCamera.instance.node.position;
        let [x1, y1] = Convert(p.x, p.y, SceneCamera.instance.node.parent, this.node.parent);
        return [x - x1, y - y1];
    }

    /**
     * 获取建筑实例
     * @param buildingId 
     * @returns 
     */
    async GetBuilding(buildingId: number): Promise<Building> {
        while (!this.homeLayout) {
            await Second(0.5);
        }
        for (let building of this.buildings) {
            if (building.buildingId == buildingId) {
                await building.InitSub;
                return building;
            }
        }
        for (let layout of this.homeLayout.buildings) {
            if (layout.buildingId == buildingId) {
                await Second(0.5);
                return this.GetBuilding(buildingId);
            }
        }
        return Promise.resolve(undefined);
    }

    /**
     * 检测建筑是否正在显示中
     * @param buildingId 
     * @returns 
     */
    CheckBuildingShowing(buildingId: number) {
        for (let building of this.buildings) {
            if (building.buildingId == buildingId) {
                return building.activeInHierarchy;
            }
        }
        return false;
    }

    private tick = 0;
    private loop = 0;
    private showlist = {};
    protected onCamereaTrans(scale?: number) {
        let [startx, starty, endx, endy] = SceneCamera.GetViewPort();
        const w = GameSet.Half_Width_SceneCanvas;
        const h = GameSet.Half_Height_SceneCanvas;
        const orthoHeight = SceneCamera.initOrthHeight;
        let d = (SceneCamera.instance.orthoHeight - orthoHeight) / orthoHeight;
        if (scale != undefined) d = (orthoHeight * scale - orthoHeight) / orthoHeight;
        let offsetx = w * d;
        let offsety = h * d;
        startx -= offsetx;
        endx += offsetx;
        starty -= offsety;
        endy += offsety;

        SceneCamera.Move(0, 0, false);
        startx -= this.homeLayout.tileStartX;
        starty -= this.homeLayout.tileStartY;
        // endx -= this.homeLayout.tileStartX;
        // endy -= this.homeLayout.tileStartY;
        let box = new Rect(startx, starty, endx - startx, endy - starty);
        let lx = maxx(Math.floor(startx / this.homeLayout.tileSize), 0);
        let ly = maxx(Math.floor(starty / this.homeLayout.tileSize), 0);
        let rx = Math.floor(endx / this.homeLayout.tileSize);
        let ry = Math.floor(endy / this.homeLayout.tileSize);
        this.loop++;
        for (let y = ly; y <= ry; y++) {
            let row = y * this.homeLayout.tileCol;
            for (let x = lx; x <= rx; x++) {
                let tile = this.tiles[row + x];
                if (!tile) continue;
                tile.loop = this.loop;
                if (!this.showlist[tile.uuid]) {
                    this.showlist[tile.uuid] = tile;
                    tile.Load();
                }
            }
        }
        for (let k in this.showlist) {
            if (this.showlist[k].loop != this.loop) {
                if (this.showlist[k].active) this.showlist[k].active = false;
                delete this.showlist[k];
            }
        }
    }

    /**
     * 刷新层级
     * @param dt 
     * @returns 
     */
    protected update(dt: number): void {
        if (!this.homeLayout || this.waitUI.active) return;
        if (!this.homeLayout || this.homeLayout.tileStartX == undefined) return;
        this.tick += dt;
        if (this.tick < 0.1) return;
        this.tick = 0;
        let [startx, starty, endx, endy] = SceneCamera.GetViewPort();
        const w = GameSet.Half_Width_SceneCanvas;
        const h = GameSet.Half_Height_SceneCanvas;
        const orthoHeight = SceneCamera.initOrthHeight;
        let d = (SceneCamera.instance.orthoHeight - orthoHeight) / orthoHeight;
        let offsetx = w * d;
        let offsety = h * d;
        startx -= offsetx;
        endx += offsetx;
        starty -= offsety;
        endy += offsety;

        SceneCamera.Move(0, 0, false);
        startx -= this.homeLayout.tileStartX;
        starty -= this.homeLayout.tileStartY;
        endx -= this.homeLayout.tileStartX;
        endy -= this.homeLayout.tileStartY;
        let box = new Rect(startx, starty, endx - startx, endy - starty);
        // let lx = Math.floor(startx / this.homeLayout.tileSize);
        // let ly = Math.floor(starty / this.homeLayout.tileSize);
        // let rx = Math.floor(endx / this.homeLayout.tileSize);
        // let ry = Math.floor(endy / this.homeLayout.tileSize);
        // this.loop++;
        // for (let y = ly; y <= ry; y++) {
        //     let row = y * this.homeLayout.tileCol;
        //     for (let x = lx; x <= rx; x++) {
        //         let tile = this.tiles[row + x];
        //         if (!tile) continue;
        //         tile.loop = this.loop;
        //         if (!this.showlist[tile.uuid]) {
        //             this.showlist[tile.uuid] = tile;
        //             tile.Load();
        //         }
        //     }
        // }
        // for (let k in this.showlist) {
        //     if (this.showlist[k].loop != this.loop) {
        //         if (this.showlist[k].active) this.showlist[k].active = false;
        //         delete this.showlist[k];
        //     }
        // }

        let children = this.entityLay.children.concat();
        children.sort((a, b) => {
            return b.position.y - a.position.y;
        })
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            child.setSiblingIndex(i);
            let active = true;
            if (child["$$static"]) {
                continue;
            }else if (this.hideChildMap[child.uuid]) {
                // child.active = false;
                active = false;
            } else if (child instanceof Building) {
                if (child['$hasLoad']) {
                    // child.active = box.intersects(child.boundBox);
                    active = box.intersects(child.boundBox);
                } else {
                    // child.active = true;
                    active = true;
                }
            } else if (child.getComponent(UITransform) && !child['$$static']) {
                // child.active = box.intersects(child.getComponent(UITransform).getBoundingBox());
                active = box.intersects(child.getComponent(UITransform).getBoundingBox());
            }
            if (child.active != active) {
                child.active = active;
            }
        }
    }

    static addCamera(camera: Node) {
        this.$instance.node.addChild(camera);
    }

    /**
     * 添加实体
     * @param entity 
     */
    async AddEntity(entity: Node) {
        this.entityLay.addChild(entity);
        if (entity["GetLab"]) {
            let lab = await entity["GetLab"]();
            this.AddLab(lab);
        }
        if (entity['GetBar']) {
            let bar = await entity['GetBar']();
            this.AddBar(bar);
        }
    }

    /**
     * 添加名字
     * @param entity 
     */
    async AddBar(entity: Node) {
        if (!this.$hasLoad) await this.initSub;
        if (!entity) return;
        this.barLay.addChild(entity);
    }

    async AddLab(entity: Node) {
        if (!entity) return;
        this.labLay.addChild(entity);
    }

    VisibleBarAndLab(visible: boolean) {
        this.barLay.active = visible;
        this.labLay.active = visible;
    }

    VisibleSceneTouch(visible: boolean){
        this.hitTest.active = visible;
    }

    /**
     * 添加影子
     * @param entity 
     */
    AddShadow(entity: Node) {
        this.shadowLay.addChild(entity);
    }

    /**
     * 添加云朵
     * @param entity 
     */
    AddSkyObj(entity: Node) {
        this.skyLay.addChild(entity);
    }

    AddPveMap(map: Node) {
        this.pveLay.addChild(map);
    }

    RemovePveMap() {
        this.pveLay.removeAllChildren();
    }

    onDestroy() {
        if (this.groundLay.children) this.groundLay.removeAllChildren();
        if (this.pveLay.children) this.pveLay.removeAllChildren();
        if (this.entityLay.children) this.entityLay.removeAllChildren();
        if (this.shadowLay.children) this.shadowLay.removeAllChildren();
        if (this.skyLay.children) this.skyLay.removeAllChildren();
        if (this.barLay.children) this.barLay.removeAllChildren();
        while (this.tiles.length) {
            let tile = this.tiles.pop();
            tile.Reset();
            tile.destroy();
        }
        while (this.buildings.length) {
            this.buildings.pop().destroy();
        }
    }

    Visible(value: boolean) {
        this.node.active = value;
    }

    private reset() {
        this.tiles.forEach((tile, i, ary) => { tile.Reset(); });

        this.hideChildMap = {};
        for (let building of this.buildings) {
            building.Clean();
        }

        this.receiveBuildings();
        let children = this.entityLay.children.concat();
        while (children.length) {
            let child = children.pop();
            if (child["receive"]) {
                child["receive"]();
            } else {
                child.destroy();
            }
        }
        this.entityLay.removeAllChildren();

        children = this.shadowLay.children.concat();
        while (children.length) {
            let child = children.pop();
            if (child["receive"]) {
                child["receive"]();
            } else {
                child.destroy();
            }
        }
        this.shadowLay.removeAllChildren();

        children = this.skyLay.children.concat();
        while (children.length) {
            let child = children.pop();
            if (child["receive"]) {
                child["receive"]();
            } else {
                child.destroy();
            }
        }
        this.skyLay.removeAllChildren();

        children = this.pveLay.children.concat();
        while (children.length) {
            let child = children.pop();
            if (child["receive"]) {
                child["receive"]();
            } else {
                child.destroy();
            }
        }
        this.pveLay.removeAllChildren();
    }

    GetBattleInitCamera(): number {
        return this.homeLayout.camera;
    }

    GetAtkIndexs(): { id: number, angle: number }[] {
        return this.homeLayout.atkNode;
    }

    GetDefIndexs(): { id: number, angle: number }[] {
        return this.homeLayout.defNode;
    }

    Camera2JiDiPos() {
        if (this.jidi) {
            SceneCamera.LookAt(this.jidi.position.x, this.jidi.position.y, false);
        } else {
            SceneCamera.LookAt(this.homeLayout.width / 2, this.homeLayout.height / 2, false);
        }
    }

}
