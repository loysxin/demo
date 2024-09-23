import { debug } from "cc";
import { abss, maxx, randomI } from "../../utils/Utils";
import { BuildingLayout, Node_Building } from "./HomeStruct";
import Logger from "../../utils/Logger";

/**
 * 地图节点数据
 */
export type MapNode = {
    x: number;  //x像素坐标
    y: number;  //y像素坐标
    nx: number; //x地图坐标
    ny: number; //y地图坐标
    idx: number;
    id: number;
    gx: number;
    gy: number;
    type: number;
    dir?: number, f?: number, g?: number, h?: number, v?: number, prev?: MapNode;
}

export type LikeNode = {
    readonly id?: number;
    readonly idx?: number;//节点序号
    readonly x: number;  //x像素坐标
    readonly y: number;  //y像素坐标
    readonly gx?: number;
    readonly gy?: number;
    readonly type?: number;
}

export const Node_Walk = 0; //通路
export const Node_Wall = 1; //墙

export enum Dir {
    ZERO = 0,
    Up,
    Down,
    Left,
    Right,

    Right_Up,
    Right_Down,
    Left_Down,
    Left_Up
}

let $seed: number = 0;
let $from: MapNode;
let $to: MapNode;
let $check: MapNode;
let $child: MapNode;
let $bounds: { [idx: number]: boolean };
let $close: any[];
let $open: MapNode[];

// 四向
const $dir4 = [
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
]

// 八向
const $dir8 = [
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
    { x: 1, y: 1 }
]

export class MapData {
    private xrad: number;
    private yrad: number;
    private wide: number;
    private hide: number;
    private mapData: MapNode[] = [];//地图数据
    private width: number;
    private height: number;
    private nodeCol: number;
    private nodeRow: number;
    private grid: MapNode[] = [];
    private gridCol: number;
    private bakingData: string[] = [];

    /**
     * 初始化地图数据
     * @param wide 
     * @param hide 
     * @param nodes 
     */
    SetMapData(wide: number, hide: number, gridCol: number, row: number, col: number, grids: number[], buildings: BuildingLayout[], mapBaking: string[]) {
        let nodes = [];
        for (let ny = 0; ny < row; ny++) {
            for (let nx = 0; nx < col; nx++) {
                let gy = Math.floor(ny / 2) + nx;
                let gx = gridCol - col + nx - Math.ceil(ny / 2);
                nodes.push(grids[gy * gridCol + gx]);
            }
        }

        this.wide = wide;
        this.hide = hide;
        this.nodeCol = col;
        this.nodeRow = Math.ceil(nodes.length / col);
        this.width = this.nodeCol * wide;
        this.height = this.nodeRow * hide;
        this.xrad = Math.atan2(hide, wide);
        this.yrad = Math.PI / 2 - this.xrad;
        this.gridCol = this.nodeCol + Math.floor(this.nodeRow / 2);
        Logger.log("SetMapData", this.gridCol);
        this.grid.length = 0;
        for (let i = 0; i < nodes.length; i++) {
            let mark = nodes[i];
            let nx = i % col;
            let ny = Math.floor(i / col);
            let offset = ny % 2 == 0 ? wide / 2 : 0;
            let x = offset + nx * wide;
            let y = ny * hide / 2;
            let gx = this.nodeRow - 1 + nx - Math.ceil(ny / 2);//nx + Math.floor(ny / 2);
            let gy = nx + Math.floor(ny / 2);//(this.col - 1 - nx + Math.ceil(ny / 2));
            let node = this.mapData[i];
            if (!node) {
                node = {
                    x: x,
                    y: y,
                    idx: i,
                    nx: nx,
                    ny: ny,
                    gx: gx,
                    gy: gy,
                    id: gy * this.gridCol + gx,
                    type: mark
                }
                this.mapData[i] = node;
            } else {
                node.x = x;
                node.y = y;
                node.nx = nx;
                node.ny = ny;
                node.idx = i;
                node.gx = gx;
                node.gy = gy;
                node.id = gy * this.gridCol + gx;
                node.type = mark;
            }
            if (this.grid[node.id]) throw "重复格子 " + node.id + "," + node.gx + "," + node.gy;
            this.grid[node.id] = node;
        }

        this.bakingData = mapBaking;
        if(this.bakingData == null || this.bakingData.length == 0) {
            console.log("地图没有烘焙数据：");
        }
        // for (let building of buildings) {
        //     for (let idx of building.bounds) {
        //         this.mapData[idx].type = this.mapData[idx].type | Node_Building;
        //     }
        // }
    }

    /**根据朝向获取节点 */
    GetDir(curr: LikeNode, dir: Dir) {
        switch (dir) {
            case Dir.Up:
                return this.gett(curr.gx, curr.gy + 1) as LikeNode;

            case Dir.Down:
                return this.gett(curr.gx, curr.gy - 1) as LikeNode;

            case Dir.Left:
                return this.gett(curr.gx - 1, curr.gy) as LikeNode;

            case Dir.Right:
                return this.gett(curr.gx + 1, curr.gy) as LikeNode;

            case Dir.Left_Up:
                return this.gett(curr.gx - 1, curr.gy + 1) as LikeNode;

            case Dir.Left_Down:
                return this.gett(curr.gx - 1, curr.gy - 1) as LikeNode;

            case Dir.Right_Up:
                return this.gett(curr.gx + 1, curr.gy + 1) as LikeNode;

            case Dir.Right_Down:
                return this.gett(curr.gx + 1, curr.gy - 1) as LikeNode;
        }
    }

    private gett(x: number, y?: number) {
        if (y == undefined) return this.grid[x];
        if (x >= this.gridCol || x < 0 || y < 0) return undefined;
        return this.grid[y * this.gridCol + x];
    }
    private check(child: MapNode, fat: MapNode, d = 1) {
        if (!child || child == $from) return false;
        if (child.idx == $to.idx || $bounds[child.idx]) {
            $to.prev = fat;
            $to.v = $seed;
            return true;
        }
        if (child.type != Node_Walk) return false;
        let f = fat.g + d + Math.abs(child.gx - $to.gx) + Math.abs(child.gy - $to.gy);
        if (child.v != $seed) {
            $open.push(child);
            child.g = fat.g + d;
            child.f = f + this.countDir(child, fat);
            child.v = $seed;
            child.prev = fat;
        } else if (child.f > f) {
            if ($close[child.idx]) {
                $close[child.idx] = false;
                $open.push(child);
            }
            child.g = fat.g + d;
            child.f = f + this.countDir(child, fat);
            child.prev = fat;
        }
        return false;
    }
    private countDir(child: MapNode, fat: MapNode) {
        let dir = 0;
        if (child.gx == fat.gx) {
            if (child.gy > fat.gy) dir = Dir.Up;
            else dir = Dir.Down;
        } else if (child.gy == fat.gy) {
            if (child.gx > fat.gx) dir = Dir.Right;
            else dir = Dir.Left;
        } else if (child.gx < fat.gx) {
            if (child.gy > fat.gy) dir = Dir.Left_Up;
            else dir = Dir.Left_Down;
        } else if (child.gy > fat.gy) {
            dir = Dir.Right_Up;
        } else {
            dir = Dir.Right_Down;
        }
        child.dir = dir;
        if (!fat.dir || dir == fat.dir) return 0;
        return 0.00001;
    }

    /**
     * 寻路
     * @param cols 
     * @param fromIdx 
     * @param toIdx 
     * @returns 
     */
    SearchPath(fromIdx: number, toIdx: number, bounds?: number[]) {
        // let loop = 0;
        $bounds = {};
        if (bounds) {
            for (let idx of bounds) $bounds[idx] = true;
        }
        $seed++; this.nodeCol = this.nodeCol; $from = this.mapData[fromIdx]; $to = this.mapData[toIdx];
        $from.g = 0;
        $from.dir = 0;
        $close = [], $open = [$from];
        while ($open.length) {
            $check = $open.pop();
            $close[$check.idx] = true;
            for (let d of $dir4) {
                if (this.check(this.gett($check.gx + d.x, $check.gy + d.y), $check)) break;
            }
            $open.sort((a, b) => { return b.f - a.f });
            // if (++loop > 1000000) return [];
        }
        if ($to.v != $seed) {
            console.warn("程序预埋点<searchPath>，请联系前端！");
            return [$to];
        }
        let paths: LikeNode[] = [$to];
        while ($to != $from) {
            $to = $to.prev;
            if ($to == $from) break;
            paths.push($to);
        }
        paths.reverse();
        return paths;
    }

    /**获取最近的点 */
    NearestNode(idx: number, distance = 0, type = 0) {
        $close = [];
        let start = this.mapData[idx];
        $open = [start];
        while ($open.length) {
            $check = $open.shift();
            $close.push($open);
            for (let d of $dir8) {
                $child = this.gett($check.gx + d.x, $check.gy + d.y);
                if ($child && $child.type == type && maxx(abss($child.x - start.x), abss($child.y - start.y)) >= distance) {
                    return $child;
                } else if ($child && $close.indexOf($child) == -1) {
                    $open.push($child);
                }
            }
        }
        return undefined;
    }

    /**获取随机点 */
    RandomNode(idx: number, rx: number, ry: number) {
        let node = this.mapData[idx];
        let x = node.gx + randomI(-rx, rx), y = node.gy + randomI(-ry, ry)
        let check = this.gett(x, y);
        // Logger.log("MapRandom", node.nx, node.ny, node.gx, node.gy, x, y, check);
        return this.NearestNode(check.idx);
    }

    /**
     * 获取菱形格子
     * @param id 
     * @returns 
     */
    GetGrid(id: number): LikeNode;
    GetGrid(gx: number, gy: number): LikeNode;
    GetGrid(...args: number[]) {
        let gx = args[0], gy = args[1];
        if (gy == undefined) return this.grid[gx];
        if (gx >= this.gridCol - 1 || gx < 0 || gy < 0) return undefined;
        return this.grid[gx * this.gridCol + gy];
    }

    /**获取地图格子 */
    GetNode(idx: number): LikeNode;
    GetNode(x: number, y?: number): LikeNode;
    GetNode(...args: number[]) {
        let x = args[0], y = args[1];
        if (y == undefined) return this.mapData[x] as LikeNode;
        if (x >= this.nodeCol - 1 || x < 0 || y < 0) return undefined;
        return this.mapData[y * this.nodeCol + x] as LikeNode;
    }

    /**碰撞格子 */
    HitTestNode(x: number, y: number) {
        if (x < 0 || y < 0 || x > this.width || y > this.height) {
            return [];
        }
        let nx = Math.floor(x / this.wide);
        let ny = Math.floor(y / this.hide);
        let ox = nx * this.wide + this.wide / 2;
        let oy = ny * this.hide + this.hide / 2;
        let rad = Math.atan2(y - oy, x - ox);
        let index: number;
        ny *= 2;
        if (rad > -this.xrad && rad <= this.xrad) {
            // 右
            index = Math.min(this.nodeRow, ny + 1) * this.nodeCol + Math.min(this.nodeCol, nx + 1);
        } else if (rad > this.xrad && rad <= this.xrad + this.yrad * 2) {
            // 上 
            index = Math.min(this.nodeRow, ny + 2) * this.nodeCol + nx;
        } else if (rad > this.xrad + this.yrad * 2 || rad <= -this.yrad - this.xrad) {
            // 左
            index = Math.min(this.nodeRow, ny + 1) * this.nodeCol + nx;
        } else {
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
        return [px, py, index, this.mapData[index]];
    }

    CountDir(angle: number) {
        angle = (angle + 360) % 360;
        if (angle <= 90) {
            return { lr: 1, isBack: true };
        } else if (angle <= 180) {
            return { lr: 1, isBack: false };
        } else if (angle <= 270) {
            return { lr: -1, isBack: false };
        } else {
            return { lr: -1, isBack: true }
        }
    }

    GetMapBakingData(){
        if(this.bakingData == null || this.bakingData.length == 0)
            console.log("GetMapBakingData error");
        return this.bakingData;
    }
    
}

export const map = new MapData();