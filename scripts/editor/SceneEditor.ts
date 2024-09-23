import { Color, EventKeyboard, EventMouse, EventTouch, Graphics, Input, JsonAsset, KeyCode, Label, Node, TextAsset, UITransform, Vec2, Vec3, assetManager, find, input, instantiate, path, v2, math } from 'cc';
import { BuildingLayout, BuildingType, GetBuildingName, HomeLayout, Node_Atk, Node_Building, Node_Cam, Node_Def, Node_Map, Node_Patrol, Node_Trans, Node_Walk, Node_Wall } from "../module/home/HomeStruct";
import { Panel } from "../GameRoot";
import { Tile } from "../module/home/entitys/Tile";
import { SceneCamera } from "../module/SceneCamera";
import { Building } from "../module/home/entitys/Building";
import { GridEditor } from "./GridEditor";
import { ResMgr } from "../manager/ResMgr";
import { Tips } from "../module/login/Tips";
import { CfgMgr } from "../manager/CfgMgr";
import { GameSet } from "../module/GameSet";
import { SaveFile, Second } from "../utils/Utils";
import { map } from "../module/home/MapData";
import { FilmMaker } from "../manager/FilmMaker";
import { Mathf } from "../utils/Mathf";
import { map_grid_size } from '../battle/BattleLogic/Def';

let homeJson: HomeLayout;
let buildingTypes: { [type: number]: { BuildingId: number, uuid: string }[] };
let hitTest: Node;

export class SceneEditor extends Panel {
    protected prefab: string = "prefabs/home/HomeScene";

    private tiles: Tile[] = [];
    private buildings: EditorBuilding[] = [];
    private groundLay: Node;
    private entityLay: Node;
    private patrolLay: Node;

    static ins: SceneEditor;

    protected onLoad(): void {
        if (SceneEditor.ins) throw "error";
        SceneEditor.ins = this;

        this.groundLay = this.find("groundLay");
        this.find("drawer").addComponent(GridEditor);
        GridEditor.ins.node.active = false;
        this.entityLay = this.find("entityLay");

        this.patrolLay = instantiate(this.entityLay);
        this.patrolLay.name = "巡逻层";
        this.node.addChild(this.patrolLay);
        this.patrolLay.layer = 1;
        this.patrolLay.setSiblingIndex(2);

        hitTest = this.find("hitTest");
        hitTest.setSiblingIndex(this.node.children.length);
        hitTest.on(Input.EventType.TOUCH_START, this.onTouch, this);
        hitTest.on(Node.EventType.MOUSE_WHEEL, this.onWheel, this);
        hitTest.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    /**
     * 显示面板
     */
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

    onDestroy() {
        this.groundLay.removeAllChildren();
        this.entityLay.removeAllChildren();
        while (this.tiles.length) {
            this.tiles.pop().destroy();
        }
        while (this.buildings.length) {
            this.buildings.pop().destroy();
        }
    }

    private onTouch(e: TouchEvent) {
        this.UnSelectBuilding();
    }

    onTouchMove(e: EventTouch) {
        let dv = e.touch.getDelta();
        // SceneCamera.Move(-dv.x / GameData.HomeScale * 2, -dv.y / GameData.HomeScale * 2);
        let p = SceneCamera.instance.node.position;
        let x = p.x - dv.x / GameSet.HomeScale * 2;
        let y = p.y - dv.y / GameSet.HomeScale * 2;
        // console.log("onTouchMove", x, y);
        SceneCamera.instance.node.setPosition(x, y);
    }

    onWheel(e: any) {
        console.log("onWheel", e);
        let scaleNum = e.getScrollY();
        // console.log('scaleNum', scaleNum)
        let scaleX = this.node.scale.x + scaleNum * 0.0001;
        if (scaleX <= 0) {
            scaleX = 0.1;
        }
        let scaleY = this.node.scale.y + scaleNum * 0.0001;
        if (scaleY <= 0) {
            scaleY = 0.1;
        }
        this.node.setScale(new Vec3(scaleX, scaleY, 1));
    }

    onKey(e: any) {
        let keyDown = e.type == "keydown";
        // console.log(KeyCode[e.keyCode] + "," + keyDown);
        // console.log(e);
        switch (e.keyCode) {
            case KeyCode.CTRL_LEFT:
                break;
            case KeyCode.DELETE:
            case KeyCode.BACKSPACE:
                if (keyDown) {
                    if (SelectBuilding) {
                        this.DelBuilding(SelectBuilding);
                        this.UnSelectBuilding();
                    }
                    if (SelectPatrol) {
                        this.DelPatrol(SelectPatrol);
                        this.UnSelectPatrol();
                    }
                }
                break;
            case KeyCode.SPACE:
                if (hitTest.active != keyDown) {
                    hitTest.active = keyDown;
                }
                break;
            case KeyCode.ESCAPE:
                if (keyDown) {
                    this.UnSelectBuilding();
                    for (let building of this.buildings) {
                        building.active = true;
                    }
                    if (SelectPatrol && SelectPatrol.IsEmpty()) {
                        this.DelPatrol(SelectPatrol);
                        this.UnSelectPatrol();
                    }
                    this.HideNodeEditor();
                    this.UnSelectPatrol();
                }
                break;
            case KeyCode.NUM_0:
            case KeyCode.DIGIT_0:
                if (keyDown) {
                    this.UnSelectBuilding();
                    this.SetNodeEditor(Node_Walk);
                }
                break;
            case KeyCode.NUM_1:
            case KeyCode.DIGIT_1:
                if (keyDown) {
                    this.UnSelectBuilding();
                    this.SetNodeEditor(Node_Wall);
                }
                break;
            case KeyCode.NUM_2:
            case KeyCode.DIGIT_2:
                if (keyDown) {
                    if (SelectBuilding) {
                        for (let building of this.buildings) {
                            if (building != SelectBuilding) building.active = false;
                        }
                        GridEditor.ins.StartDraw(Node_Building);
                    }
                }
                break;
            case KeyCode.NUM_4:
            case KeyCode.DIGIT_4:
                if (keyDown) {
                    if (SelectBuilding) {
                        for (let building of this.buildings) {
                            if (building != SelectBuilding) building.active = false;
                        }
                        GridEditor.ins.StartDraw(Node_Trans);
                    }
                }
                break;
            case KeyCode.ARROW_DOWN:
                if (keyDown && SelectBuilding) {
                    SelectBuilding.onMove(v2(0, -1));
                    // let p = SelectBuilding.position;
                    // let d = SelectBuilding.HasBound() ? homeJson.nodeHide / 2 : 1;
                    // SelectBuilding.setPosition(p.x, p.y - d);
                }
                break;
            case KeyCode.ARROW_LEFT:
                if (keyDown && SelectBuilding) {
                    SelectBuilding.onMove(v2(-1, 0));
                    // let p = SelectBuilding.position;
                    // let d = SelectBuilding.HasBound() ? homeJson.nodeWide : 1;
                    // SelectBuilding.setPosition(p.x - d, p.y);
                }
                break;
            case KeyCode.ARROW_RIGHT:
                if (keyDown && SelectBuilding) {
                    SelectBuilding.onMove(v2(1, 0));
                    // let p = SelectBuilding.position;
                    // let d = SelectBuilding.HasBound() ? homeJson.nodeWide : 1;
                    // SelectBuilding.setPosition(p.x + d, p.y);
                }
                break;
            case KeyCode.ARROW_UP:
                if (keyDown && SelectBuilding) {
                    SelectBuilding.onMove(v2(0, 1));
                    // let p = SelectBuilding.position;
                    // let d = SelectBuilding.HasBound() ? homeJson.nodeHide / 2 : 1;
                    // SelectBuilding.setPosition(p.x, p.y + d);
                }
                break;
        }
    }

    async LoadMap(path: string) {
        this.onDestroy();
        // const response = await fetch("http://" + url);
        // let json = await response.json();
        let jsonAsset = await ResMgr.LoadResAbSub("config/home/" + path, JsonAsset);
        let cfg: HomeLayout = JSON.parse(JSON.stringify(jsonAsset.json)) as HomeLayout;
        console.log("loadMap===", cfg);
        let tiles = [];
        for (let tile of cfg.tiles) {
            let url = tile;
            if (url.search("sytle/") == -1) url.replace(cfg.name, "style/" + cfg.name)
            // tiles.push(path.join(host, "get", url));
            tiles.push(url);
        }
        console.log("cfg", cfg);

        homeJson = cfg;
        this.gridToNode();
        this.ResetTile(cfg.tileSize, cfg.tileCol, tiles, homeJson.nodeWide, homeJson.nodeHide);
        GridEditor.ins.Load(cfg);
        buildingTypes = {};
        let homeland = CfgMgr.Get("homeland_building");
        let homebuilds = [];
        for (let k in homeland) {
            let obj = homeland[k];
            if (obj.HomeId == cfg.homeId) {
                homebuilds.push(obj);
            }
        }
        for (let buildcfg of homebuilds) {
            let type = buildcfg.BuildingType;
            let list = buildingTypes[type];
            if (!list) {
                list = [];
                buildingTypes[type] = list;
            }
            list.push({ BuildingId: buildcfg.BuildingId, uuid: undefined });
            console.log("ResetEditor", buildcfg.BuildingId, type);
        }

        input.on(Input.EventType.KEY_DOWN, this.onKey, this);
        input.on(Input.EventType.KEY_UP, this.onKey, this);

        for (let build of cfg.buildings) {
            // build.url = host + "/get/" + build.url;
            let building = this.addBuilding(build);
            building.SetBuildingOffset(build);
        }

        for (let nodes of cfg.patrols) {
            let patrol = new EditorPatrol();
            patrol.Init(nodes);
            this.patrolLay.addChild(patrol);
        }
        this.UnSelectPatrol();
        this.patrolLay.active = false;

        this.onKey({ type: "keydown", keyCode: KeyCode.ESCAPE });
    }

    get homeId() {
        if (homeJson) return homeJson.homeId;
        return 101;
    }

    private stdBuildings: any;
    CreateNew(cfg: any, stdBuildings: any) {
        this.onDestroy();
        homeJson = {};
        homeJson.homeId = cfg.HomeId;
        homeJson.name = cfg.Style;
        homeJson.tiles = [];
        homeJson.buildings = [];
        homeJson.nodes = [];
        homeJson.patrols = [];

        this.stdBuildings = stdBuildings;
        buildingTypes = {};
        for (let cfg of stdBuildings) {
            let type = cfg.BuildingType;
            let list = buildingTypes[type];
            if (!list) {
                list = [];
                buildingTypes[type] = list;
            }
            list.push({ BuildingId: cfg.BuildingId, uuid: undefined });
            console.log("ResetEditor", cfg.BuildingId, type);
        }

        input.on(Input.EventType.KEY_DOWN, this.onKey, this);
        input.on(Input.EventType.KEY_UP, this.onKey, this);
    }

    ResetTile(size: number, col: number, urls: string[], nodeWide: number, nodeHide: number) {
        let width = size * col;
        let height = size * (Math.ceil(urls.length / col));
        let startX = 0;
        let startY = 0;
        console.log("ResetTile========", size, width, height);

        hitTest.getComponent(UITransform).setContentSize(width, height);

        homeJson.tileCol = col;
        homeJson.tileSize = size;
        homeJson.tileStartX = startX;
        homeJson.tileStartY = startY;
        homeJson.tiles = [];

        this.groundLay.removeAllChildren();
        while (this.tiles.length) {
            this.tiles.pop().destroy();
        }
        for (let i = 0; i < urls.length; i++) {
            let url = urls[i];
            if (url.search("style/") == -1) url = url.replace(homeJson.name, "style/" + homeJson.name);
            let tile = new Tile();
            tile.layer = 1;
            this.tiles.push(tile);
            this.groundLay.addChild(tile);
            let tx = startX + (i % col) * size + size / 2;
            let ty = startY + Math.floor(i / col) * size + size / 2;
            tile.Init(url, tx, ty, size);
            homeJson.tiles.push(url.replace(/.*get\//, "").replace("style/", ""));
            tile.Load();
        }
        SceneCamera.LookAt(width / 2, height / 2);
        console.log('homeJson', homeJson);
        homeJson.width = width;
        homeJson.height = height;
        homeJson.nodeWide = nodeWide;
        homeJson.nodeHide = nodeHide;
        GridEditor.ins.Reset(width, height, nodeWide, nodeHide);
    }

    static addCamera(camera: Node) {
        this.ins.node.addChild(camera);
    }

    protected update(dt: number): void {
        if (!homeJson || homeJson.tileStartX == undefined) return;
        let [startx, starty, endx, endy] = SceneCamera.GetViewPort();
        startx -= homeJson.tileStartX;
        starty -= homeJson.tileStartY;
        endx -= homeJson.tileStartX;
        endy -= homeJson.tileStartY;
        // console.log("update", startx, starty, endx, endy, homeJson.tileStartX, homeJson.tileStartY);
        this.tiles.forEach((tile, i, ary) => { tile.active = false });

        let tileSize = homeJson.tileSize;
        let lx = Math.floor(startx / tileSize);
        let ly = Math.floor(starty / tileSize);
        let rx = Math.ceil(endx / tileSize);
        let ry = Math.ceil(endy / tileSize);
        for (let y = ly; y <= ry; y++) {
            let row = y * homeJson.tileCol;
            for (let x = lx; x <= rx; x++) {
                let tile = this.tiles[row + x];
                tile && tile.Load();
            }
        }

        this.buildings.sort((a, b) => {
            return b.position.y - a.position.y;
        })
        if (SelectBuilding) {
            let index = this.buildings.indexOf(SelectBuilding);
            if (index != -1) {
                this.buildings.splice(index, 1);
                this.buildings.push(SelectBuilding);
            }
        }
        for (let i = 0; i < this.buildings.length; i++) {
            this.buildings[i].setSiblingIndex(i);
        }
    }

    /**打开网格编辑 */
    SetNodeEditor(value: number) {
        GridEditor.ins.StartDraw(value);
    }
    /**关闭网格编辑 */
    HideNodeEditor() {
        GridEditor.ins.StopDraw();
    }

    /**增加巡逻点 */
    AddPatrol() {
        this.UnSelectBuilding();
        this.patrolLay.active = true;
        let patrol = new EditorPatrol();
        patrol.Init();
        this.patrolLay.addChild(patrol);
        patrol.Select();
    }
    /**删除巡逻 */
    DelPatrol(patrol: Node) {
        patrol.parent && patrol.parent.removeChild(patrol);
        if (SelectPatrol == patrol) SelectPatrol.UnSelect();
        SelectPatrol = undefined;
    }
    /**编辑巡逻点 */
    SetPatrolEditor() {
        this.HideNodeEditor();
        this.UnSelectBuilding();
        this.patrolLay.active = true;
        let patrols = this.patrolLay.children;
        for (let patrol of patrols) {
            patrol.active = true;
        }
    }
    /**退出巡逻点编辑 */
    UnSelectPatrol() {
        this.patrolLay.active = false;
        if (SelectPatrol) {
            SelectPatrol.UnSelect();
            SelectPatrol = undefined;
        }
    }

    /**取消选择 */
    UnSelectBuilding() {
        if (SelectBuilding) {
            SelectBuilding.UnSelect();
            SelectBuilding = undefined;
        }
    }

    SetAtk() {
        this.UnSelectBuilding();
        this.HideNodeEditor();
        this.UnSelectPatrol();
        GridEditor.ins.StartDraw(Node_Atk);
    }

    SetDef() {
        this.UnSelectBuilding();
        this.HideNodeEditor();
        this.UnSelectPatrol();
        GridEditor.ins.StartDraw(Node_Def);
    }

    SetCam() {
        this.UnSelectBuilding();
        this.HideNodeEditor();
        this.UnSelectPatrol();
        GridEditor.ins.StartDraw(Node_Cam);
    }

    SetMap(){
        this.UnSelectBuilding();
        this.HideNodeEditor();
        this.UnSelectPatrol();
        GridEditor.ins.StartDraw(Node_Map);
    }

    AddBuilding(url: string, std?: BuildingLayout) {
        if (!homeJson) return;
        let p = SceneCamera.instance.node.position;
        let cfg: BuildingLayout = std;
        if (!cfg) {
            cfg = {
                buildingId: undefined,
                type: undefined,
                name: "",
                url: url,
                x: p.x,
                y: p.y,
                trans: []
            }
        }

        let building = this.addBuilding(cfg);
        if (!building) return;
        building.Select();
        return building;
    }
    /**创建建筑 */
    private addBuilding(cfg: BuildingLayout, buildingId?: number) {
        if (!homeJson) return;
        let url = cfg.url;
        let folder = "";
        if (cfg.url) {
            folder = path.dirname(cfg.url).split(/[\\\/]/).pop();
            // if (folder == "others") folder = path.basename(cfg.url).replace(path.extname(cfg.url), "");
        }
        let prefab = cfg.prefab;
        if (!prefab && BuildingType[folder]) {
            let std = CfgMgr.GetBuildingUnLock(cfg.buildingId)
            if (std && std.Prefab) {
                prefab = path.join("prefabs/home/buildings", folder, std.Prefab);
            } else {
                let infos = assetManager.resources.getDirWithPath("prefabs/home/buildings/" + folder + "/");
                if (infos.length) prefab = infos.pop().path;
            }
        } else if (folder == "others") {
            let filename = path.basename(cfg.url).replace(path.extname(cfg.url), "");
            let temp = "prefabs/home/buildings/others/" + filename;
            if (ResMgr.HasResource(temp)) prefab = temp;
        }
        console.log("addBuilding", ResMgr.HasResource(prefab), cfg.url, folder, prefab);
        if (!prefab || !ResMgr.HasResource(prefab)) {
            prefab = undefined;
            cfg.url = url;
        } else {
            cfg.url = undefined;
        }
        cfg.prefab = prefab;
        let building: EditorBuilding = EditorBuilding.Create(prefab);
        let type = cfg.type ? cfg.type : BuildingType[folder];

        let targetId: number;
        if (cfg.buildingId == undefined) {
            let list = buildingTypes[type] || [];
            for (let obj of list) {
                if (obj.uuid == undefined) {
                    targetId = obj.BuildingId;
                    obj.uuid = building.uuid;
                    break;
                }
            }
            if (targetId == undefined) {
                targetId = 0;
            }
        } else {
            targetId = cfg.buildingId;
        }
        if (targetId == undefined) {
            building.destroy();
            Tips.Show("建筑添加失败,请添加本场景指定建筑!");
            return;
        }

        this.entityLay.addChild(building);
        this.buildings.push(building);

        cfg.type = type;
        cfg.buildingId = targetId;

        let name = GetBuildingName(folder);
        building.name = name;
        if (!cfg.name || cfg.name == "") cfg.name = name;

        let x = cfg.x, y = cfg.y;
        if (x == undefined) {
            x = SceneCamera.instance.node.position.x;
            y = SceneCamera.instance.node.position.y;
        }

        let [px, py, idx] = GridEditor.ins.HitTest(x, y);
        if (!cfg.location) cfg.location = idx;

        building.UnSelect();
        building.Init(this.homeId || 101, cfg);
        if (prefab) {
            building.SetPrefab(prefab);
        } else {
            building.Load(cfg.url);
        }
        return building;
    }

    /**删除建筑 */
    DelBuilding(building: EditorBuilding) {
        let index = this.buildings.indexOf(building);
        if (index != -1) this.buildings.splice(index, 1);
        let list = buildingTypes[building.type];
        if (list) {
            for (let obj of list) {
                if (obj.uuid == building.uuid) {
                    obj.uuid = undefined;
                    break;
                }
            }
        }
        if (building.parent) building.parent.removeChild(building);
        building.destroy();
    }

    HasBuilding(buildingId: number) {
        for (let building of this.buildings) {
            if (building.buildingId == buildingId) return true;
        }
        return false;
    }

    async Save() {
        homeJson.buildings.length = 0;
        for (let i = 0; i < homeJson.tiles.length; i++) {
            let url = homeJson.tiles[i];
            homeJson.tiles[i] = url.replace("style/", "");
        }
        for (let building of this.buildings) {
            homeJson.buildings.push(building.OutPut());
        }
        homeJson.patrols = [];
        for (let child of this.patrolLay.children) {
            let patrol: EditorPatrol = child as EditorPatrol;
            if (!patrol.IsEmpty()) homeJson.patrols.push(patrol.Output());
        }

        let grid = GridEditor.ins.OutPut();
        homeJson.nodeCol = grid.col;
        homeJson.nodeRow = grid.row;
        homeJson.nodes = grid.nodes;
        homeJson.gridCol = grid.gridCol;
        homeJson.gridRow = grid.gridRow;
        homeJson.originId = grid.originId;
        homeJson.atkNode = grid.atkNode;
        homeJson.defNode = grid.defNode;
        homeJson.camera = grid.camera;
        homeJson.mapNode = grid.mapNode;

        this.nodeTogrid();
        this.mapBaking();

        let data = JSON.stringify(homeJson);
        console.log("Save>>>", data);
        SaveFile(data, homeJson.name + ".json");
    }

    private nodeTogrid() {
        map.SetMapData(homeJson.nodeWide, homeJson.nodeHide, homeJson.gridCol, homeJson.nodeRow, homeJson.nodeCol, homeJson.nodes, homeJson.buildings, homeJson.mapBaking);
        for (let std of homeJson.buildings) {
            std.location = map.GetNode(std.location).id;
            for (let i = 0; i < std.trans.length; i++) {
                std.trans[i] = map.GetNode(std.trans[i]).id;
            }
            for (let i = 0; i < std.bounds.length; i++) {
                std.bounds[i] = map.GetNode(std.bounds[i]).id;
            }
        }
        for (let i = 0; i < homeJson.patrols.length; i++) {
            let ls = homeJson.patrols[i];
            for (let n = 0; n < ls.length; n++) {
                ls[n] = map.GetNode(ls[n]).id;
            }
        }
        for (let i = 0; i < homeJson.atkNode.length; i++) {
            homeJson.atkNode[i].id = map.GetNode(homeJson.atkNode[i].id).id;
        }
        for (let i = 0; i < homeJson.defNode.length; i++) {
            homeJson.defNode[i].id = map.GetNode(homeJson.defNode[i].id).id;
        }
        homeJson.camera = map.GetNode(homeJson.camera).id;

        for (let i = 0; i < homeJson.mapNode.length; i++) {
            homeJson.mapNode[i] = map.GetNode(homeJson.mapNode[i]).id;
        }
    }
    private gridToNode() {
        map.SetMapData(homeJson.nodeWide, homeJson.nodeHide, homeJson.gridCol, homeJson.nodeRow, homeJson.nodeCol, homeJson.nodes, homeJson.buildings, homeJson.mapBaking);
        for (let std of homeJson.buildings) {
            std.location = map.GetGrid(std.location).idx;
            for (let i = 0; i < std.trans.length; i++) {
                std.trans[i] = map.GetGrid(std.trans[i]).idx;
            }
            for (let i = 0; i < std.bounds.length; i++) {
                std.bounds[i] = map.GetGrid(std.bounds[i]).idx;
            }
        }
        for (let i = 0; i < homeJson.patrols.length; i++) {
            let ls = homeJson.patrols[i];
            for (let n = 0; n < ls.length; n++) {
                ls[n] = map.GetGrid(ls[n]).idx;
            }
        }
        for (let i = 0; i < homeJson.atkNode.length; i++) {
            homeJson.atkNode[i].id = map.GetGrid(homeJson.atkNode[i].id).idx;
        }
        for (let i = 0; i < homeJson.defNode.length; i++) {
            homeJson.defNode[i].id = map.GetGrid(homeJson.defNode[i].id).idx;
        }
        homeJson.camera = map.GetGrid(homeJson.camera).idx;

        if(!homeJson.mapNode) homeJson.mapNode = [];
        for (let i = 0; i < homeJson.mapNode.length; i++) {
            homeJson.mapNode[i] = map.GetGrid(homeJson.mapNode[i]).idx;
        }
    }

    //地图格子尺寸
    map_grid_size = map_grid_size;
    private mapBaking(){
        if(homeJson.mapNode.length < 2) 
        {
            console.log("没有找到烘焙点");
            return;
        }
        if(!homeJson.mapBaking) homeJson.mapBaking = []
        homeJson.mapBaking.length = 0;
        const point1 = map.GetGrid(homeJson.mapNode[0]);
        const point2 = map.GetGrid(homeJson.mapNode[1]);
        let tmp = map.HitTestNode(point1.x, point2.y);
        if(tmp.length < 3)
        {
            console.log("没有找到烘焙点");
            return;
        }  
        let point3 = tmp[3];
        const map1 = Mathf.transform2dTo3d([point1.x, point1.y]);
        const map2 = Mathf.transform2dTo3d([point2.x, point2.y]);
        const map3 = Mathf.transform2dTo3d([point3.x, point3.y]);
        const dirX = map1[0] - map3[0] > 0 ? 1 : -1;
        const dirY = map2[1] - map1[1] > 0 ? 1 : -1;
        const countX = Math.abs(map3[0] - map1[0]) / this.map_grid_size * 2;
        const countY = Math.abs(map2[1] - map1[1]) / this.map_grid_size;
        for (let i = 0; i < countX; i++) {
            let posX = map3[0] + i * this.map_grid_size * dirX;
            for (let j = 0; j < countY; j++) {
                let posY = map1[1] + j * this.map_grid_size * dirY;
                const pos3d = Mathf.transform3dTo2d([posX, posY, 0]);
                let node = map.HitTestNode(pos3d[0], pos3d[1]);
                if(node.length > 3 && node[3]["type"] == 1)
                {
                    const key = this.PositionToGrid(new Vec3(posX, posY));
                    homeJson.mapBaking.push(key);
                }
            }
        }
    }

    private PositionToGrid(position) : string
    {
        let posX = position.x / map_grid_size;
        let posY = position.y / map_grid_size;
        posX = posX < 0 ? Math.ceil(posX) : Math.floor(posX)
        posY = posY < 0 ? Math.ceil(posY) : Math.floor(posY)
        return `${posX},${posY}`

    }
}

export var SelectBuilding: EditorBuilding;
let selectPoint: { dx: number, dy: number };
let rightDownOffset: { x: number, y: number } = undefined;
let buildMark: Node;
export class EditorBuilding extends Building {

    private nodes: { [index: number]: Node } = {};
    private location: number;
    private path: number[] = [];
    private pathNode: Node[] = [];
    private drawer: Graphics;

    protected onLoad(): void {
        super.onLoad();

        let node = new Node("origin");
        node.layer = 1;
        this.addChild(node);
        let origin = node.addComponent(Graphics);
        origin.strokeColor = new Color().fromHEX('#FF0000');
        origin.lineWidth = 10;
        let wide = 60;
        origin.moveTo(-wide, 0);
        origin.lineTo(wide, 0);
        origin.moveTo(0, wide);
        origin.lineTo(0, -wide);
        origin.close();
        origin.stroke();

        let line = new Node("line");
        line.layer = 1;
        this.addChild(line);
        this.drawer = line.addComponent(Graphics);
        this.drawer.lineWidth = 10;
        this.drawer.strokeColor = new Color().fromHEX('#FF0000');
    }
    onTouch() { }

    GetLocation() {
        if (this.bounds.length) {
            return this.bounds[Math.floor(this.bounds.length / 2)];
        } else {
            return this.localtion;
        }
    }

    checkLock() { }
    async Init(homeId: number, cfg: BuildingLayout) {
        if (!buildMark) {
            buildMark = find("SceneCanvas/building");
        }
        if (!this.$hasLoad) await this.loadSub;
        this.buildingid = cfg.buildingId;
        this.buildingType = cfg.type;
        console.log("Init===", this.buildingType, this.type);
        this.setPosition(cfg.x, cfg.y);
        let hitTest = this.find("hitTest") || this.body;
        hitTest.on(Input.EventType.TOUCH_START, this.Select, this);
        hitTest.on(Input.EventType.TOUCH_END, this.onEnd, this);
        hitTest.on(Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        if (cfg.offsetX != undefined && cfg.offsetY != undefined) {
            console.log("Building.SetOffset", cfg.offsetX, cfg.offsetY);
            this.$proxy.node.setPosition(cfg.offsetX, cfg.offsetY);
        }
        this.name = cfg.name;
        if (cfg.name) {
            this.nameLabel.string = cfg.name + "(" + cfg.buildingId + ")";
        } else {
            this.nameLabel.string = cfg.name;
        }

        if (cfg.location != undefined) {
            this.location = cfg.location;
        } else {
            let [px, py, idx] = GridEditor.ins.HitTest(cfg.x, cfg.y);
            if (px != undefined) {
                px = 0; py = 0; idx = 0;
            }
            this.location = 0;
        }

        let bounds = cfg.bounds || [];
        // console.log("addBuilding", bounds.length);
        let p = this.position;
        for (let index of bounds) {
            let [px, py] = GridEditor.ins.GetNode(index);
            console.log("addBuilding", !this.nodes[index], index, px, py);
            if (!this.nodes[index]) {
                let tile = instantiate(GridEditor.ins.building);
                tile.setPosition(px - p.x, py - p.y);
                this.nodes[index] = tile;
                this.addChild(tile);
            }
        }

        this.path = [];
        this.pathNode = [];
        let trans = cfg.trans || [];
        for (let i of trans) {
            let tile = instantiate(GridEditor.ins.trans);
            let [x, y] = GridEditor.ins.GetNode(i);
            tile.setPosition(x, y);
            this.SetTrans(i, tile);
        }

        // this.select.node.setScale(1, -1, 1);
        // this.select.spriteFrame = await FilmMaker.Shoot(this.body);
    }

    HasBound() {
        for (let k in this.nodes) {
            if (k) return true;
        }
        return false;
    }

    SetNode(index: number, tile: Node) {
        if (this.nodes[index]) {
            tile.destroy();
            return;
        }
        let px = this.position.x, py = this.position.y;
        let p = tile.getPosition();
        tile.setPosition(p.x - px, p.y - py);
        this.nodes[index] = tile;
        this.addChild(tile);
    }
    DelNode(index: number) {
        let obj = this.nodes[index];
        if (!obj) return;
        obj.destroy();
        delete this.nodes[index];
    }

    SetTrans(index: number, tile: Node) {
        if (this.path[this.path.length - 1] == index) return;
        let px = this.position.x, py = this.position.y;
        let p = tile.getPosition();
        tile.setPosition(p.x - px, p.y - py);
        this.addChild(tile);
        this.path.push(index);
        this.pathNode.push(tile);
        let label = new Node();
        label.layer = 1;
        label.name = "Label";
        label.addComponent(Label).fontSize = 40;
        label.getComponent(Label).color = new Color().fromHEX('#000000');
        tile.addChild(label);

        this.drawer.clear();
        let node = this.pathNode[0];
        node.getChildByName("Label").getComponent(Label).string = "0";
        this.drawer.moveTo(node.position.x, node.position.y);
        for (let i = 1; i < this.pathNode.length; i++) {
            let node = this.pathNode[i];
            node.getChildByName("Label").getComponent(Label).string = i.toString();
            this.drawer.lineTo(node.position.x, node.position.y);
        }
        this.drawer.stroke();
    }
    DelTrans(index: number) {
        let i = this.path.lastIndexOf(index);
        if (i != -1) {
            let tile = this.pathNode[i];
            tile.parent && tile.parent.removeChild(tile);
            this.path.splice(i, 1);
            this.pathNode.splice(i, 1);
            // tile.off(Input.EventType.TOUCH_END, this.Select, this);
        }
        this.drawer.clear();
        let node = this.pathNode[0];
        if (node) {
            node.getChildByName("Label").getComponent(Label).string = "0";
            this.drawer.moveTo(node.position.x, node.position.y);
        }
        for (let i = 1; i < this.pathNode.length; i++) {
            let node = this.pathNode[i];
            node.getChildByName("Label").getComponent(Label).string = i.toString();
            this.drawer.lineTo(node.position.x, node.position.y);
        }
        this.drawer.stroke();
    }

    async SetBuildingOffset(cfg: BuildingLayout) {
        if (!this.$hasLoad) await this.loadSub;
        if (cfg.offsetX != undefined && cfg.offsetY != undefined) {
            console.log("Building.SetOffset", cfg.offsetX, cfg.offsetY);
            this.$proxy.node.setPosition(Number(cfg.offsetX), Number(cfg.offsetY));
        }
    }

    async SetName(value: string, index: number) {
        if (!this.$hasLoad) await this.loadSub;
        this.buildingid = index;
        this.name = value;
        if (value) {
            this.nameLabel.string = value + "(" + index + ")";
        } else {
            this.nameLabel.string = value;
        }
    }

    private url: string;
    private prf: string;
    async Load(url: string, action?: string) {
        console.log("LoadImg", url);
        if (!url || url == "undefined") return;
        this.prf = undefined;
        this.url = url;
        return super.Load(url, action);
    }
    SetPrefab(prefab: string) {
        this.prf = prefab;
        this.url = undefined;
    }

    onMouseDown(e: EventMouse) {
        if (e.getButton() == EventMouse.BUTTON_RIGHT) {
            // 偏移
            let p = e.getUILocation();
            rightDownOffset = v2(-p.x, -p.y);
            console.log("onMouseDown", -p.x, -p.y);
        } else {
            rightDownOffset = undefined;
        }
    }

    async Select(e?: EventTouch) {
        if (!this.$hasLoad) await this.loadSub;
        if (SelectBuilding && SelectBuilding != this) return;
        if (SelectBuilding != this) {
            if (SelectBuilding) {
                console.log("unSelect");
                SelectBuilding.select.node.active = false;
                SelectBuilding.off(Input.EventType.TOUCH_MOVE, this.onMove, SelectBuilding);
            }
            SelectBuilding = this;
            this.select.node.active = true;
            // let hitTest = this.find("hitTest") || this.body;
            this.on(Input.EventType.TOUCH_MOVE, this.onMove, this);
            console.log("Select", SelectBuilding.name);
        }
    }

    async UnSelect() {
        if (!this.$hasLoad) await this.loadSub;
        this.select.node.active = false;
    }

    onMove(evt: EventTouch | Vec2) {
        let d: Vec2;
        if (evt instanceof EventTouch) {
            d = evt.getUIDelta();
        } else {
            d = evt;
        }
        if (SelectBuilding == this) {
            if (rightDownOffset) {
                let p = this.$proxy.node.position;
                this.$proxy.node.setPosition(p.x - d.x, p.y - d.y);
                this.setPosition(this.position.x + d.x, this.position.y + d.y);
                for (let key in this.nodes) {
                    let obj = this.nodes[key];
                    let idx = Number(key);
                    let [px, py] = GridEditor.ins.GetNode(idx);
                    if (px == undefined) {
                        obj.destroy();
                        delete this.nodes[key];
                    } else {
                        obj.setPosition(px - this.position.x, py - this.position.y);
                    }
                }
            } else {
                let [px, py, idx] = GridEditor.ins.HitTest(this.position.x + d.x, this.position.y + d.y);
                if (!this.HasBound()) {
                    this.location = idx || 0;
                    this.setPosition(this.position.x + d.x, this.position.y + d.y);
                } else {
                    this.location = idx || 0;
                    this.setPosition(this.position.x + d.x, this.position.y + d.y);
                    for (let key in this.nodes) {
                        let obj = this.nodes[key];
                        let idx = Number(key);
                        let [px, py] = GridEditor.ins.GetNode(idx);
                        if (px == undefined) {
                            obj.destroy();
                            delete this.nodes[key];
                        } else {
                            obj.setPosition(px - this.position.x, py - this.position.y);
                        }
                    }
                }
            }
        }
    }

    onEnd(e: EventTouch) {
    }

    OutPut() {
        let bounds = [];
        for (let k in this.nodes) {
            bounds.push(Number(k));
        }

        if (this.location == undefined) {
            let [px, py, idx] = GridEditor.ins.HitTest(this.position.x, this.position.y);
            this.location = idx;
        }
        console.log("output===", this.type);
        let obj: BuildingLayout = {
            buildingId: this.buildingid,
            name: this.name,
            type: this.type,
            prefab: this.prf,
            url: this.url,
            x: this.position.x,
            y: this.position.y,
            location: this.location || 0,
            bounds: bounds || [],
            offsetX: this.$proxy.node.position.x,
            offsetY: this.$proxy.node.position.y,
            trans: this.path.concat()
        }
        return obj;
    }
}

class EditorTile extends Tile {
    async Load() {
        this.active = true;
        if (!this.loading) {
            this.loading = true;
            let seed = ++this.seed;
            this.sprite.spriteFrame = undefined;
            if (this.url.search("http") != 0) this.url = "http://" + this.url;
            let res = await ResMgr.LoadRemoteSpriteFrame(this.url);
            if (seed == this.seed) {
                this.sprite.spriteFrame = res;
            }
        }
    }
}

export var SelectPatrol: EditorPatrol;

/**巡逻点编辑 */
class EditorPatrol extends Node {

    private drawer: Graphics;
    private nodes: number[];
    private tiles: Node[];

    Init(cfg?: number[]) {
        this.layer = 1;
        this.addComponent(UITransform);
        this.drawer = this.addComponent(Graphics);
        this.drawer.lineWidth = 10;
        this.drawer.strokeColor = new Color().fromHEX('#FF0000');
        this.nodes = [];
        this.tiles = [];
        this.on(Input.EventType.TOUCH_END, this.Select, this);

        if (cfg) {
            for (let index of cfg) {
                let [x, y] = GridEditor.ins.GetNode(index);
                let tile = instantiate(GridEditor.ins.patrol);
                tile.setPosition(x, y);
                console.log("Patrol.Init", x, y, tile);
                this.SetNode(index, tile);
            }
        }
    }

    Select(e?: EventTouch) {
        GridEditor.ins.StartDraw(Node_Patrol);
        console.log("SelectPatrol", SelectPatrol == this);
        if (SelectPatrol == this) return;
        let patrols = this.parent.children;
        for (let patrol of patrols) {
            if (patrol != this) {
                patrol.active = false;
            } else {
                patrol.active = true;
            }
        }
        SelectPatrol = this;
    }

    UnSelect() {
        if (!this.parent) return;
        let patrols = this.parent.children;
        for (let patrol of patrols) {
            patrol.active = true;
        }
        SelectPatrol = undefined;
    }

    SetNode(index: number, tile: Node) {
        if (this.nodes[this.nodes.length - 1] == index) return;
        console.log("SetPatrol", index, tile);
        tile.on(Input.EventType.TOUCH_END, this.Select, this);
        this.nodes.push(index);
        this.tiles.push(tile);
        this.addChild(tile);
        let label = new Node();
        label.layer = 1;
        label.name = "Label";
        label.addComponent(Label).fontSize = 40;
        label.getComponent(Label).color = new Color().fromHEX('#000000');
        tile.addChild(label);
        this.drawer.clear();
        let node = this.tiles[0];
        node.getChildByName("Label").getComponent(Label).string = "0";
        this.drawer.moveTo(node.position.x, node.position.y);
        for (let i = 1; i < this.tiles.length; i++) {
            let node = this.tiles[i];
            node.getChildByName("Label").getComponent(Label).string = i.toString();
            this.drawer.lineTo(node.position.x, node.position.y);
        }
        this.drawer.stroke();
    }

    DelNode(index: number) {
        let i = this.nodes.lastIndexOf(index);
        if (i != -1) {
            let tile = this.tiles[i];
            tile.parent && tile.parent.removeChild(tile);
            this.tiles.splice(i, 1);
            this.nodes.splice(i, 1);
            tile.off(Input.EventType.TOUCH_END, this.Select, this);
        }
        this.drawer.clear();
        let node = this.tiles[0];
        if (node) {
            node.getChildByName("Label").getComponent(Label).string = "0";
            this.drawer.moveTo(node.position.x, node.position.y);
        }
        for (let i = 1; i < this.tiles.length; i++) {
            let node = this.tiles[i];
            node.getChildByName("Label").getComponent(Label).string = i.toString();
            this.drawer.lineTo(node.position.x, node.position.y);
        }
        this.drawer.stroke();
    }

    IsEmpty() { return this.nodes.length == 0; }
    Output() {
        return this.nodes;
    }

    destroy(): boolean {
        for (let child of this.children) {
            child.off(Input.EventType.TOUCH_END, this.Select, this);
        }
        return super.destroy();
    }
}