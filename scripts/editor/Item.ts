import { _decorator, assetManager, Button, Component, Label, Node, Sprite, SpriteFrame, Texture2D } from 'cc';
import { ResMgr } from '../manager/ResMgr';
import Logger from '../utils/Logger';
const { ccclass, property } = _decorator;

@ccclass('Item')
export class Item extends Component {
    clickback: Function
    myInfo: any;
    itemName: string
    myIcon: Sprite;
    start() {
        this.node.on(Button.EventType.CLICK, () => {
            this.clickback && this.clickback(this.myInfo, this.itemName);
        })
    }

    /**
     * 
     * @param info 显示信息
     * @param callback 回调
     */
    async show(info, callback) {
        this.clickback = callback;
        if (typeof (info) == "string") {
            this.itemName = info.replace(/.*\//g, "");
        } else {
            this.itemName = info.HomeId + "(" + info.Style + ")";
        }
        this.node.getChildByName('map').getComponent(Label).string = this.itemName;
        this.myIcon = this.node.getChildByName('icon').getComponent(Sprite);
        this.myInfo = info;
        Logger.log('this.myInfo', this.myInfo)
        // ResMgr.LoadRemoteSpriteFrame(this.myInfo, (res) => {
        //     this.myIcon.spriteFrame = res;
        // })
        if (this.node.name == 'MapItem' || typeof (info) != "string") return
        let url = 'http://' + this.myInfo
        let check = url.replace(/.*\//g, "");
        if (check.includes('json')) {
            this.myIcon.node.active = false;
            return;
        }
        this.myIcon.spriteFrame = await ResMgr.LoadResAbSub(info+"/spriteFrame",SpriteFrame);
        // assetManager.loadRemote(url, (err, imageAsset) => {
        //     if (err) {
        //         Logger.log(err)
        //         return
        //     }
        //     const spriteFrame = new SpriteFrame();
        //     const texture = new Texture2D();
        //     //@ts-ignore
        //     texture.image = imageAsset;
        //     spriteFrame.texture = texture;
        //     this.myIcon.spriteFrame = spriteFrame;
        // });
    }

    update(deltaTime: number) {

    }
}


