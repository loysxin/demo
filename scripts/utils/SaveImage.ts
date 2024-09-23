import { Node, RenderTexture, native } from "cc";
import { ANDROID, HUAWEI, IOS } from "cc/env";
import { FilmMaker } from "../manager/FilmMaker";
import { Base64_Encode } from "./Utils";
import PlayerData from "../module/roleModule/PlayerData";
import { Api_Check_Permission, Api_Inster_Image, CallApp } from "../Platform";
import { EventMgr } from "../manager/EventMgr";

async function saveImage(display: Node) {
    console.log("Save image start");
    let scale = display.getScale();
    display.setScale(scale.x, -scale.y, scale.z);
    let sf = await FilmMaker.Shoot(display);
    display.setScale(scale.x, scale.y, scale.z);
    let tex: RenderTexture = sf.texture as RenderTexture;
    let bytes = tex.readPixels();
    let fileName = Base64_Encode("com.chaoyou.zljq" + PlayerData.roleInfo.player_id);
    let path = native.fileUtils.getWritablePath() + fileName + ".png";
    native.saveImageData(bytes, tex.width, tex.height, path).then(() => {
        console.log("Save image success");
        CallApp({ api: Api_Inster_Image, path: path, fileName: fileName }, data => {
            console.log("Api_Inster_Image", data);
            EventMgr.emit("save_image_complete");
        });
    }).catch(() => {
        console.log("Save image Fail");
    });
}

/**
 * 保存图片到本地
 * @param display 
 */
export function SaveImage(display: Node) {
    if (ANDROID || IOS || HUAWEI || native) {
        CallApp({ api: Api_Check_Permission }, ()=>{
            setTimeout(() => {
                saveImage(display);
            }, 200);
        });
    }

}