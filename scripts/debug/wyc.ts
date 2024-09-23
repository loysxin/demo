import { _decorator, Canvas, Component, find, JsonAsset, native, Node, RenderTexture, Sprite, TextAsset, Texture2D } from 'cc';
import { base64ToImage, BytesToBase64 } from '../utils/Utils';
import { ResMgr } from '../manager/ResMgr';
import { QrcodeMaker } from '../utils/QrcodeMaker';
import { FilmMaker } from '../manager/FilmMaker';
import { ConsumeItem } from '../module/common/ConsumeItem';

const { ccclass, property } = _decorator;

@ccclass('wyc')
export class wyc extends Component {

    protected async onLoad() {
        // let img = QrcodeMaker.Create("www.baidu.com", 400, 400);
        // find("Canvas").addChild(img);
        this.scheduleOnce(this.test.bind(this), 1);
    }

    async test() {
        let node = find("Canvas/icon");
        let sk = await FilmMaker.Shoot(node);

        // let icon = new Node();
        // icon.addComponent(Sprite).spriteFrame = sk;
        // find("Canvas").addChild(icon);

        let rect = sk.rect;
        let texture: RenderTexture = sk.texture as RenderTexture;
        console.log("icon", texture.width, texture.height, sk.rect.toString());
        let bytes = texture.readPixels();
        
        // let picData = new Uint8Array(w * h * 4);
        // let rowBytes = w * 4;
        // for (let row = 0; row < h; row++) {
        //     let srow = h - 1 - row;
        //     let start = srow * w * 4;
        //     let reStart = row * w * 4;
        //     // save the piexls data
        //     for (let i = 0; i < rowBytes; i++) {
        //         picData[reStart + i] = data[start + i];
        //     }
        // }
        let str = BytesToBase64(bytes);
        console.log("base64", str);

        let icon = new Node();
        let sp = icon.addComponent(Sprite);
        find("Canvas").addChild(icon);
        icon.setPosition(200,200);
        sp.spriteFrame = await base64ToImage(str);
    }


    async start() {
        // await ResMgr.PrevLoad();

        // let node = new Node();
        // find("Canvas").addChild(node);
        // // let jsonAsset = await ResMgr.LoadResAbSub("config/test", JsonAsset);
        // let sp = node.addComponent(Sprite);
        // let sf = await base64ToImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAQCAYAAAAWGF8bAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA7UlEQVQ4ja3UP0oDQRSA8d+OoucwYKNg+pTGIqLHCKhgk4soFimC8RiCRfAOQhRsBMscQMSVBIuZlXVRWNz92jd88x7vT7bo91TYwRCH2MJmJf6BF9xhiqdyMCsJN3CBM4TqL3+wwjVGeIf1kuwWBzVFBQEn2BYryotMLv8hK7MvVidb9Hu7eMBaAyEs0Q1iA5rKJMcwYNCCrGAQ0GlR2Kk7HnXJgzikbfEaxIlvi1nAjdjypiwxDZhj0oJwgnnRlBFmDWT3yfF9BHIcYSwufF1WKbPj5PhxVXKcYw9XeMbnL5I3PKY3XZxKlwa+AKuTL7/A9h2iAAAAAElFTkSuQmCC");
        // sp.spriteFrame = sf;

    }

    update(deltaTime: number) {

    }
}
