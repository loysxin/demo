import { Component, EventMouse, EventTouch, Graphics, Input, Label, Node, UITransform, find, instantiate, math } from "cc";
import { HomeLayout, Node_Atk, Node_Building, Node_Def, Node_Patrol, Node_Trans, Node_Walk, Node_Wall, Node_Cam, Node_Map } from "../module/home/HomeStruct";
import { SceneCamera } from "../module/SceneCamera";
import { SceneEditor, SelectBuilding, SelectPatrol } from "./SceneEditor";
import { GameSet } from "../module/GameSet";
import { EditFacePanel } from "./EditFacePanel";
import { EditSet } from "./EditSet";
import { PI2, RadToDeg, abss } from "../utils/Utils";
import Logger from "../utils/Logger";

export class GridEditor extends Component {
    static ins: GridEditor;

    private editoring: boolean = false;
    private type: number = 0;
    private index: number;
    private width: number;
    private height: number;
    private wide: number;
    private hide: number;
    private nodeCol: number;
    private nodeRow: number;
    private xrad: number;
    private yrad: number;
    private hitTest: Node;
    private tileLay: Node;
    private graphics: Graphics;
    private nodes: number[] = [];
    private tiles: Node[] = [];
    private degree: number;

    private camTile: Node;
    private camNode: number;
    private atkNode: { id: number, angle: number }[] = [];
    private defNode: { id: number, angle: number }[] = [];
    private mapNode: number[] = [];

    public wall: Node;
    public building: Node;
    public patrol: Node;
    public trans: Node;
    public atk: Node;
    public def: Node;
    public cam: Node;
    
    public map: Node;
    protected onLoad(): void {
        if (GridEditor.ins) throw "error";
        GridEditor.ins = this;
        this.node.layer = 1;
        this.graphics = this.getComponent(Graphics);
        this.wall = find("SceneCanvas/wall");
        this.building = find("SceneCanvas/building");
        this.patrol = find("SceneCanvas/patrol");
        this.trans = find("SceneCanvas/trans");
        this.atk = find("SceneCanvas/atk");
        this.def = find("SceneCanvas/def");
        this.cam = find("SceneCanvas/cam");
        this.map = find("SceneCanvas/map");

        this.hitTest = this.node.getChildByName("hitTest");
        this.tileLay = this.node.getChildByName("grid");
    }

    private removeAllTiles() {
        while (this.tiles.length) {
            let tile = this.tiles.pop();
            if (tile) {
                tile.parent && tile.parent.removeChild(tile.parent);
                tile.destroy();
            }
        }
    }

    Load(cfg: HomeLayout) {
        this.node.active = true;
        this.hitTest.on(Input.EventType.TOUCH_MOVE, this.onMove, this);
        // this.hitTest.on(Input.EventType.TOUCH_START, this.onMove, this);
        this.hitTest.on(Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.hitTest.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        this.Reset(cfg.width, cfg.height, cfg.nodeWide, cfg.nodeHide);
        let nodes = this.parseToNode(cfg.gridCol, cfg.nodes, cfg.nodeCol, cfg.nodeRow);//;
        this.nodes.length = 0;
        Logger.log("GridEditor.Load", this.nodes);
        for (let i = 0; i < nodes.length; i++) {
            this.nodes.push(0);
            let type = nodes[i];
            if (type) {
                this.type = type;
                this.index = i;
                let origin: Node;
                this.building.setPosition(-20000, -20000);
                this.wall.setPosition(-20000, -20000);
                this.patrol.setPosition(-20000, -20000);
                this.trans.setPosition(-20000, -20000);
                if (this.type == Node_Wall) {
                    this.tileLay.addChild(this.wall);
                    origin = this.wall;
                } else if (this.type == Node_Building) {
                    this.tileLay.addChild(this.building);
                    origin = this.building;
                } else {
                    continue;
                }
                let px: number, py: number;
                let nx = i % this.nodeCol;
                let ny = Math.floor(i / this.nodeCol);
                if ((ny + 1) % 2 == 0) {
                    px = nx * this.wide;
                    py = ny * this.hide / 2;
                } else {
                    px = this.wide / 2 + nx * this.wide;
                    py = ny * this.hide / 2;
                }
                origin.setPosition(px, py);
                this.onSet(null);
            }
        }
        this.atkNode = cfg.atkNode;
        let index = 0;
        for (let atk of this.atkNode) {
            let i = atk.id;
            let px: number, py: number;
            let nx = i % this.nodeCol;
            let ny = Math.floor(i / this.nodeCol);
            if ((ny + 1) % 2 == 0) {
                px = nx * this.wide;
                py = ny * this.hide / 2;
            } else {
                px = this.wide / 2 + nx * this.wide;
                py = ny * this.hide / 2;
            }
            let node = instantiate(this.atk);
            node.active = true;
            node.setPosition(px, py);
            this.tileLay.addChild(node);
            node.getChildByName("Label").getComponent(Label).string = (++index).toString();
            node.getChildByName("face").angle = atk.angle - 45;
            this.tiles[i] = node;
        }
        this.defNode = cfg.defNode;
        index = 0;
        for (let def of this.defNode) {
            let i = def.id;
            let px: number, py: number;
            let nx = i % this.nodeCol;
            let ny = Math.floor(i / this.nodeCol);
            if ((ny + 1) % 2 == 0) {
                px = nx * this.wide;
                py = ny * this.hide / 2;
            } else {
                px = this.wide / 2 + nx * this.wide;
                py = ny * this.hide / 2;
            }
            let node = instantiate(this.def);
            node.active = true;
            node.setPosition(px, py);
            this.tileLay.addChild(node);
            node.getChildByName("Label").getComponent(Label).string = (++index).toString();
            node.getChildByName("face").angle = def.angle - 45;
            this.tiles[i] = node;
        }

        this.camNode = cfg.camera;
        this.camTile = instantiate(this.cam);
        this.camTile.active = true;
        this.camTile.name = "tile_cam";
        this.tileLay.addChild(this.camTile);
        let px: number, py: number;
        let nx = this.camNode % this.nodeCol;
        let ny = Math.floor(this.camNode / this.nodeCol);
        if ((ny + 1) % 2 == 0) {
            px = nx * this.wide;
            py = ny * this.hide / 2;
        } else {
            px = this.wide / 2 + nx * this.wide;
            py = ny * this.hide / 2;
        }
        this.camTile.setPosition(px, py);

        this.mapNode = cfg.mapNode;
        index = 0;
        for (let map of this.mapNode) {
            let i = map;
            let px: number, py: number;
            let nx = i % this.nodeCol;
            let ny = Math.floor(i / this.nodeCol);
            if ((ny + 1) % 2 == 0) {
                px = nx * this.wide;
                py = ny * this.hide / 2;
            } else {
                px = this.wide / 2 + nx * this.wide;
                py = ny * this.hide / 2;
            }
            let node = instantiate(this.map);
            node.active = true;
            node.setPosition(px, py);
            this.tileLay.addChild(node);
            this.tiles[i] = node;
        }
    }

    Reset(width: number, height: number, wide: number, hide: number) {
        // this.graphics.lineWidth = 20;
        this.graphics.clear();
        this.removeAllTiles();
        this.width = width;
        this.height = height;
        this.wide = wide;
        this.hide = hide;
        this.xrad = Math.atan2(hide, wide);
        this.yrad = Math.PI / 2 - this.xrad;
        let rw = wide / 2, rh = hide / 2;
        this.nodeCol = Math.ceil(width / wide);
        this.nodeRow = Math.ceil(height / hide);
        let num = this.nodeRow + this.nodeCol;
        let xleng = num * rw, yleng = num * rh;
        let leftx = -this.nodeRow * rw;
        let lefty = this.nodeRow * rh;
        Logger.log("GridEditor.Reset", width, height, num);
        for (let x = 0; x <= num; x++) {
            let startx = leftx + x * rw;
            let starty = lefty + x * rh;
            this.graphics.moveTo(startx, starty);
            this.graphics.lineTo(startx + xleng, starty - yleng);

            starty = lefty - x * rh;
            this.graphics.moveTo(startx, starty);
            this.graphics.lineTo(startx + xleng, starty + yleng);
        }
        this.graphics.close();
        this.graphics.stroke();
        Logger.log("Reset===", height, hide, rh);
        this.nodeRow = Math.ceil(height / rh) + 1;

        let len = this.nodeCol * this.nodeRow;
        this.nodes = [];//new Array(this.col * this.row);
        for (let i = 0; i < len; i++) {
            this.nodes.push(0);
        }

        this.degree = 45;//Math.abs(math.toDegree(Math.atan2(hide, wide)));
        Logger.log("degree===", this.degree);

        this.hitTest.getComponent(UITransform).setContentSize(width, height);

        this.wall.setScale(wide / 100, hide / 100);
        this.building.setScale(wide / 100, hide / 100);
        this.patrol.setScale(wide / 100, hide / 100);
        this.trans.setScale(wide / 100, hide / 100);
        this.atk.setScale(wide / 100, hide / 100);
        this.def.setScale(wide / 100, hide / 100);
        this.cam.setScale(wide / 100, hide / 100);
        return [this.nodeCol, this.nodeRow];
    }

    HitTest(x: number, y: number) {
        if (x < 0 || y < 0 || x > this.width || y > this.height) {
            Logger.log("HitTest", x, y, this.wide, this.height);
            return [];
        }
        let nx = Math.floor(x / this.wide);
        let ny = Math.floor(y / this.hide);
        let ox = nx * this.wide + this.wide / 2;
        let oy = ny * this.hide + this.hide / 2;
        let rad = Math.atan2(y - oy, x - ox);
        let index: number;
        ny *= 2;
        // Logger.log("hitTest", x, y, ox, oy, nx, ny, rad, this.xrad, this.yrad);
        if (rad > -this.xrad && rad <= this.xrad) {
            // Logger.log("右");
            // 右
            index = Math.min(this.nodeRow, ny + 1) * this.nodeCol + Math.min(this.nodeCol, nx + 1);
        } else if (rad > this.xrad && rad <= this.xrad + this.yrad * 2) {
            // Logger.log("上");
            // 上 
            index = Math.min(this.nodeRow, ny + 2) * this.nodeCol + nx;
        } else if (rad > this.xrad + this.yrad * 2 || rad <= -this.yrad - this.xrad) {
            // Logger.log("左");
            // 左
            index = Math.min(this.nodeRow, ny + 1) * this.nodeCol + nx;
        } else {
            // Logger.log("下");
            // 下
            index = ny * this.nodeCol + nx;
        }
        let px: number, py: number;
        nx = index % this.nodeCol;
        ny = Math.floor(index / this.nodeCol);
        if ((ny + 1) % 2 == 0) {
            px = nx * this.wide;
            py = ny * this.hide / 2;
        } else {
            px = this.wide / 2 + nx * this.wide;
            py = ny * this.hide / 2;
        }
        return [px, py, index];
    }

    GetNode(index: number) {
        if (index < 0 || index >= this.nodeCol * this.nodeRow) return [];
        let nx = index % this.nodeCol;
        let ny = Math.floor(index / this.nodeCol);
        let offset = ny % 2 == 0 ? this.wide / 2 : 0;
        let x = offset + nx * this.wide;
        let y = ny * this.hide / 2;
        return [x, y];
    }

    Show() {
        this.node.active = this.editoring;
    }
    Hide() {
        this.node.active = false;
    }

    StartDraw(value: number) {
        Logger.log("StartDraw");
        this.editoring = true;
        this.node.active = true;
        this.type = value;
        this.hitTest.on(Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.hitTest.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
    StopDraw() {
        Logger.log("StopDraw");
        this.editoring = false;
        this.node.active = false;
        this.hitTest.off(Input.EventType.TOUCH_MOVE, this.onMove, this);
        this.hitTest.off(Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.hitTest.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onMouseDown(e: EventMouse) {
        if (EditSet.pause) return;
        if (e.getButton() == EventMouse.BUTTON_RIGHT) {
            this.hitTest.off(Input.EventType.TOUCH_MOVE, this.onMove, this);
            this.building.setPosition(-20000, -20000);
            this.wall.setPosition(-20000, -20000);
            this.patrol.setPosition(-20000, -20000);
            this.trans.setPosition(-20000, -20000);
            this.atk.setPosition(-20000, -20000);
            this.def.setPosition(-20000, -20000);
            this.cam.setPosition(-20000, -20000);
            this.map.setPosition(-20000, -20000);
            this.onMove(e, true);
        } else {
            this.onMove(e);
            this.hitTest.on(Input.EventType.TOUCH_MOVE, this.onMove, this);
        }
    }

    onTouchEnd(e: EventTouch) {
        Logger.log("touchend");
        this.hitTest.off(Input.EventType.TOUCH_MOVE, this.onMove, this);
    }

    onMove(e: EventTouch | EventMouse, isDel: boolean = false) {
        if (EditSet.pause) return;
        let origin: Node;
        let type = this.type;
        this.building.setPosition(-20000, -20000);
        this.wall.setPosition(-20000, -20000);
        this.patrol.setPosition(-20000, -20000);
        this.trans.setPosition(-20000, -20000);
        this.atk.setPosition(-20000, -20000);
        this.def.setPosition(-20000, -20000);
        this.cam.setPosition(-20000, -20000);
        this.map.setPosition(-20000, -20000);
        if (type == Node_Wall && !isDel) {
            this.tileLay.addChild(this.wall);
            origin = this.wall;
        } else if (type == Node_Building && !isDel) {
            this.tileLay.addChild(this.building);
            origin = this.building;
        } else if (type == Node_Trans && !isDel) {
            this.trans.active = true;
            this.tileLay.addChild(this.trans);
            origin = this.trans;
        } else if (type == Node_Patrol) {
            this.patrol.active = true;
            this.tileLay.addChild(this.patrol);
            origin = this.patrol;
        } else if (type == Node_Atk) {
            this.atk.active = true;
            this.tileLay.addChild(this.atk);
            origin = this.atk;
        } else if (type == Node_Def) {
            this.def.active = true;
            this.tileLay.addChild(this.def);
            origin = this.def;
        } else if (type == Node_Cam) {
            this.cam.active = true;
            this.tileLay.addChild(this.cam);
            origin = this.cam;
        }
        else if (type == Node_Map) {
            this.map.active = true;
            this.tileLay.addChild(this.map);
            origin = this.map;
        }

        let scale = SceneEditor.ins.node.getScale().x;
        let p = e.getUILocation();
        let o = SceneCamera.instance.node.position;
        let tx = o.x + (p.x - GameSet.Half_Width_SceneCanvas) / scale, ty = o.y + (p.y - GameSet.Half_Height_SceneCanvas) / scale;
        let px, py, index;
        if (this.type != undefined) {
            [px, py, index] = this.HitTest(tx, ty);
        }
        if (px == undefined) return;
        this.index = index;
        if (origin && !isDel) {
            this.tileLay.addChild(origin);
            origin.setPosition(px, py);
        }
        if (origin) origin.active = false;
        this.onSet(e, isDel);
    }

    onSet(e: EventTouch | EventMouse, isDel: boolean = false) {
        if (this.index == undefined) return;
        let tile: Node, type = this.type;
        if (isDel) type = Node_Walk;
        // Logger.log("onSet", type, Node_Trans, SelectBuilding, SelectPatrol, SelectTrans);
        switch (type) {
            case Node_Wall:
                tile = instantiate(this.wall);
                tile.name = "tile_wall";
                console.log("onSet===", this.index);
                break;
            case Node_Building:
                tile = instantiate(this.building);
                tile.name = "tile_building";
                break;
            case Node_Trans:
                tile = instantiate(this.trans);
                tile.name = "tile_trans";
                break;
            case Node_Walk:
                if (SelectBuilding) {
                    if (this.type == Node_Building) {
                        SelectBuilding.DelNode(this.index);
                    } else {
                        SelectBuilding.DelTrans(this.index);
                    }
                } else if (SelectPatrol) {
                    SelectPatrol.DelNode(this.index);
                } else {
                    let del = this.tiles[this.index];
                    if (del) {
                        this.nodes[this.index] = Node_Walk;
                        this.tiles[this.index] = undefined;
                        if (del.parent) del.parent.removeChild(del);
                        del.destroy();

                        let index = this.fileObj(this.atkNode, this.index);
                        if (index != -1) this.atkNode.splice(index, 1);
                        index = this.fileObj(this.defNode, this.index);
                        if (index != -1) this.defNode.splice(index, 1);
                    }
                    // if (this.camNode == this.index) {
                    //     this.camNode = undefined;
                    //     if (this.camTile) {
                    //         this.camTile.parent && this.camTile.parent.removeChild(this.camTile);
                    //         this.camTile.destroy();
                    //     }
                    // }
                }
                break;
            case Node_Patrol:
                if (SelectPatrol) {
                    tile = instantiate(this.patrol);
                    tile.name = "tile_Patrol";
                }
                break;
            case Node_Atk:
                tile = instantiate(this.atk);
                tile.name = "tile_atk";
                break;
            case Node_Def:
                tile = instantiate(this.def);
                tile.name = "tile_def";
                break;
            case Node_Cam:
                this.camTile = instantiate(this.cam);
                this.camTile.name = "tile_cam";
                this.tileLay.addChild(this.camTile);
                this.camNode = this.index;
                this.camTile.active = true;
                return;
            case Node_Map:
                tile = instantiate(this.map);
                tile.name = "tile_map"; 
                break;
            default:
                return;
        }
        if (tile) {
            tile.active = true;
            if (SelectBuilding) {
                if (this.type == Node_Building) {
                    SelectBuilding.SetNode(this.index, tile);
                } else {
                    SelectBuilding.SetTrans(this.index, tile);
                }
            } else if (SelectPatrol) {
                SelectPatrol.SetNode(this.index, tile);
            } else {
                if (this.nodes[this.index] == this.type) return;
                let old = this.tiles[this.index];
                if (old) {
                    let i = this.fileObj(this.atkNode, this.index);
                    if (i != -1) this.atkNode.splice(i, 1);
                    i = this.fileObj(this.defNode, this.index);
                    if (i != -1) this.defNode.splice(i, 1);
                    this.tiles[this.index] = undefined;
                    old.destroy();
                }
                this.tileLay.addChild(tile);
                this.tiles[this.index] = tile;
                if (type == Node_Atk) {
                    let atk = { id: this.index, angle: 0 };
                    this.atkNode.push(atk);
                    this.flushFightNodes();
                    EditFacePanel.Show(tile, angle => {
                        Logger.log("face===", angle, angle - this.degree);
                        angle -= this.degree;
                        atk.angle = angle;
                        tile.getChildByName("face").angle = angle;
                    }, this);
                } else if (type == Node_Def) {
                    let def = { id: this.index, angle: 0 };
                    this.defNode.push(def);
                    this.flushFightNodes();
                    EditFacePanel.Show(tile, angle => {
                        angle -= this.degree;
                        def.angle = angle;
                        tile.getChildByName("face").angle = angle;
                    }, this);
                }else if(type == Node_Map){
                    this.mapNode.push(this.index);
                }
                else {
                    this.nodes[this.index] = this.type;
                }
            }
        }
    }

    private flushFightNodes() {
        for (let i = 0; i < this.atkNode.length;) {
            let index = this.atkNode[i].id;
            let tile = this.tiles[index];
            let label = tile.getChildByName("Label").getComponent(Label);
            label.string = (++i).toString();
        }
        for (let i = 0; i < this.defNode.length;) {
            let index = this.defNode[i].id;
            let tile = this.tiles[index];
            let label = tile.getChildByName("Label").getComponent(Label);
            label.string = (++i).toString();
        }
    }

    private fileObj(nodes: { id: number, angle: number }[], id: number) {
        for (let i = 0; i < nodes.length; i++) {
            let obj = nodes[i];
            if (obj.id == id) return i;
        }
        return -1;
    }



    OutPut() {
        let camera = this.camNode || 0;
        let originId: number, gridCol: number, gridRow: number, grids: number[];
        [originId, gridCol, gridRow, grids] = this.parseToGrid(this.nodeCol, this.nodeRow, this.nodes);
        // Logger.log("output", originId, gridCol, gridRow, this.nodeCol, this.nodeRow, nodes.length);
        Logger.log("output===", this.nodes);
        Logger.log("outputGrid===", grids);
        return { col: this.nodeCol, row: this.nodeRow, originId: originId, gridCol: gridCol, gridRow: gridRow, camera: camera, atkNode: this.atkNode, defNode: this.defNode, nodes: grids, mapNode: this.mapNode };
    }

    parseToNode(gridCol: number, grids: number[], nodeCol: number, nodeRow: number) {
        let nodes = [];
        for (let ny = 0; ny < nodeRow; ny++) {
            for (let nx = 0; nx < nodeCol; nx++) {
                let gy = Math.floor(ny / 2) + nx;
                let gx = gridCol - nodeCol + nx - Math.ceil(ny / 2);
                nodes.push(grids[gy * gridCol + gx]);
            }
        }
        Logger.log("parseToNode", nodes);
        return nodes;
    }
    parseToGrid(nodeCol: number, nodeRow: number, nodes: number[]): any[] {
        let gridCol = nodeCol + Math.floor(nodeRow / 2);
        let rowHalf = gridCol - nodeCol;
        let grid: number[] = [];
        let originX: number, originY: number;
        Logger.log("parseToGrid", nodeCol, nodeRow, gridCol, rowHalf);
        for (let i = 0; i < nodes.length; i++) {
            let mark = nodes[i];
            let nx = i % nodeCol;
            let ny = Math.floor(i / nodeCol);
            let gx = rowHalf + nx - Math.ceil(ny / 2);
            let gy = nx + Math.floor(ny / 2);
            let id = gy * gridCol + gx;
            // let node = {
            //     gx: gx,
            //     gy: gy,
            //     type: mark
            // }
            if (grid[id] != undefined) throw "重复格子 " + id + "," + gx + "," + gy;
            grid[id] = mark;
            if (i == 0) {
                originX = gx;
                originY = gy;
            }
        }
        for (let i = 0; i < grid.length; i++) {
            if (grid[i] == null || grid[i] == undefined) {
                grid[i] = Node_Wall;
            }
        }
        return [originY * gridCol + originX, gridCol, Math.ceil(grid.length / gridCol), grid];
    }
}
