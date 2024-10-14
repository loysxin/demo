export type BuildingLayout = {
    buildingId: number;
    type: number;
    name: string;
    x: number;
    y: number;
    url?: string;
    prefab?: string;
    location?: number;
    offsetX?: number;
    offsetY?: number;
    trans?: number[];//传送路线
    bounds?: number[];//建筑占地格子
}

export type HomeLayout = {
    homeId?: number;
    name?: string;
    tileStartX?: number;
    tileStartY?: number;
    tileCol?: number;
    tileSize?: number;
    tileScale?: number;
    tiles?: string[];
    width?: number;
    height?: number;
    buildings?: BuildingLayout[];
    nodeCol?: number;
    nodeRow?: number;
    nodeWide?: number;//节点宽度
    nodeHide?: number;//节点高度
    originId?: number;//地图左下角起始格子

    nodes?: number[];//格子数据
    gridCol?: number;//格子横向数量
    gridRow?: number;//格子纵向数量
    patrols?: number[][];//巡逻路径点
    atkNode?: { id: number, angle: number }[];//攻击布阵格子
    defNode?: { id: number, angle: number }[];//防守布阵格子
    camera?: number;//战斗摄像头所处格子
    mapNode?: number[];//地图标点
    mapBaking?: string[]; //地图烘焙数据
}

export type SPlayerDataFusionStone = {
    last_collect_efficiency:{[key:number]:number};
    amount:{[key:number]:number};
    last_collect_time: number;
}

export const Node_Walk = 0; //通路
export const Node_Wall = 1; //墙
export const Node_Building = 2; //建筑
export const Node_Trans = 4; //传送点
export const Node_Patrol = 8; //巡逻点
export const Node_Atk = 16; // 攻击起始位置
export const Node_Def = 32; // 防守位置
export const Node_Cam = 64; // 战斗摄像位置
export const Node_Map = 128; //地图标点

export enum BuildingType {
    other = 0,
    ji_di,      //基地
    cai_mu,     //采木场
    cai_kuang,  //采矿场
    cai_shui,   //采水
    hua_fang,   //花房
    he_cheng,   //合成
    fan_yu,     //繁育
    sheng_chan, //生产
    fang_yu_ta, //防御塔
    other1 = 10,
    bing_ying,  //兵营
    cheng_qiang //城墙大门
}

export function GetBuildingName(folder: string) {
    const names = [
        "",
        "主基地",
        "采木场",
        "采矿场",
        "采水场",
        "花房",
        "合成工坊",
        "繁育巢",
        "生产工坊",
        "防御塔",
        '',
        "兵营",
        "城墙大门"
    ];
    let type = BuildingType[folder] || 0;
    return names[type];
}

/**获取预制目录 */
export function GetPrefabFolder(buildingType: number) {
    let folder = BuildingType[buildingType];
    return 'prefabs/home/buildings/' + folder + "/";
}

/**判断建筑是否可以操作 */
export function CanSet(type: number) {
    const types = [
        BuildingType.ji_di,
        BuildingType.cai_mu,
        BuildingType.cai_kuang,
        BuildingType.cai_shui,
        BuildingType.hua_fang,
        BuildingType.he_cheng,
        BuildingType.bing_ying,
        BuildingType.fan_yu,
        BuildingType.sheng_chan,
        BuildingType.fang_yu_ta,
        BuildingType.cheng_qiang
    ];
    return types.indexOf(type) != -1;
}
