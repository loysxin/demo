import { MsgTypeRet, MsgTypeSend } from "../MsgType";
import { Tips } from "../module/login/Tips";
import PlayerData, { PlayerDataMap } from "../module/roleModule/PlayerData";
import { Base64ToUints, UintsToBase64 } from "../utils/Utils";
import { Session } from "./Session";

let player_cfg_data: any[] = [];

export function InitGameData(config_data: { [key: number]: number }) {
    let datas = [];
    for (let k in config_data) {
        datas.push(config_data[k] || 0);
    }
    let json: any;
    try {
        let str = UintsToBase64(datas) || "[[0]]";
        json = JSON.parse(str);
    } catch (e) {
        player_cfg_data = [[0]];
        console.error("初始玩家配置数据失败", datas);
        return false;
    }
    // console.log("SyncGameData", datas);
    player_cfg_data = json;
    return true;
}

/**
 * 同步服务器保存的前端数据
 * @param config_data 
 */
export function SyncGameData(config_data: { [key: number]: number }) {
    let datas = [];
    for (let k in config_data) {
        datas.push(config_data[k] || 0);
    }
    let json: any;
    try {
        let str = UintsToBase64(datas) || "[[0]]";
        json = JSON.parse(str);
    } catch (e) {
        console.error("解析玩家配置数据失败", datas);
        throw e;
        return false;
    }
    // console.log("SyncGameData", datas);
    return true;
}

/**
 * 获取前端存于服务器的数据
 * @param key 
 * @returns 
 */
export function GetGameData(key: number) {
    return player_cfg_data[key];
}

/**
 * 保存玩家数据，要求尽量简洁的value结构
 * @param key
 * @param value 
 */
export function SaveGameData(key: number, value: any) {
    let id = Number(key);
    player_cfg_data[id] = value;
    for (let i = 0; i < player_cfg_data.length; i++) {
        if (player_cfg_data[i] == null) {
            player_cfg_data[i] = 0;
        }
    }
    let arr: any;
    try {
        let str = JSON.stringify(player_cfg_data);
        arr = Base64ToUints(str);
        // console.log("player_cfg_data", str);
    } catch (e) {
        throw e;
    }
    // console.log("SaveGameData", id, value);
    let i = 0;
    let config_data = PlayerData.roleInfo.config_data;
    for (; ; i++) {
        if (arr[i] != undefined) {
            config_data[i] = arr[i];
        } else if (config_data[i] != undefined) {
            config_data[i] = 538976288;
        } else {
            break;
        }
    }

    let data = {
        type: MsgTypeSend.SetConfigDataRequest,
        data: {
            config_data: config_data
        }
    }
    Session.Send(data);
}