import { _decorator, Button, find, Graphics, native, Node, RenderTexture, Sprite, Texture2D } from 'cc';
import { Panel } from '../../../GameRoot';
import { AdHelper } from '../../../AdHelper';
import { Api_Inster_Image, CallApp, getAdcfg, GetNickName } from '../../../Platform';
import { QrcodeMaker } from '../../../utils/QrcodeMaker';
import { FilmMaker } from '../../../manager/FilmMaker';
import { Base64_Encode, base64ToImage } from '../../../utils/Utils';
import PlayerData from '../../roleModule/PlayerData';
import { SaveImage } from '../../../utils/SaveImage';
const { ccclass, property } = _decorator;

export class AdPanel extends Panel {
    protected prefab: string = 'prefabs/AdPanel';

    onLoad() {
        this.CloseBy("panelCont/closeBtn");

        let qrcode = QrcodeMaker.Create("www.baidu.com", 300, 300);
        qrcode.setPosition(-150,-150)
        this.find("panelCont/qrcode").addChild(qrcode);

        let btn1 = this.find("panelCont/layout/btn1");
        let btn2 = this.find("panelCont/layout/btn2");
        let btn3 = this.find("panelCont/layout/btn3");
        let btn4 = this.find("panelCont/layout/btn4");
        let btn5 = this.find("panelCont/layout/btn5");

        btn1.on(Button.EventType.CLICK, this.onClick, this);
        btn2.on(Button.EventType.CLICK, this.onClick, this);
        btn3.on(Button.EventType.CLICK, this.onClick, this);
        btn4.on(Button.EventType.CLICK, this.onClick, this);
        btn5.on(Button.EventType.CLICK, this.onClick, this);
    }

    protected onShow(): void {

    }

    public flush(...args: any[]): void {

    }

    protected onHide(...args: any[]): void {

    }

    private async onClick(btn: Button) {
        switch (btn.node.name) {
            case "btn1":
                if (AdHelper.hasInit) {
                    let [action, errorCode, errorMsg] = await AdHelper.splash(getAdcfg().splashAdId);
                    console.log("开屏广告", action, errorCode, errorMsg);
                }
                break;
            case "btn2":
                if (AdHelper.hasInit) {
                    let [action, errorCode, errorMsg] = await AdHelper.insertAd(getAdcfg().intertAdid);
                    console.log("插屏广告", action, errorCode, errorMsg);
                }
                break;
            case "btn3":
                if (AdHelper.hasInit) {
                    let [action, errorCode, errorMsg] = await AdHelper.fullscreenAd(getAdcfg().fullScreenAdId);
                    console.log("满屏广告", action, errorCode, errorMsg);
                }
                break;
            case "btn4":
                if (AdHelper.hasInit) {
                    let [action, errorCode, errorMsg] = await AdHelper.rewardAd(getAdcfg().rewardAdId1, 1, "");
                    console.log("奖励广告", action, errorCode, errorMsg);
                }
                break;
            case "btn5":
                SaveImage(this.find("panelCont"));
                break;
        }
    }
    spriteToBase64(sprite, callback) {
        // 创建一个空的canvas，大小与Sprite相同
        let canvas = document.createElement('canvas');
        canvas.width = sprite.node.width;
        canvas.height = sprite.node.height;

        // 获取canvas的2D上下文
        let ctx = canvas.getContext('2d');

        // 绘制Sprite到canvas
        ctx.drawImage(sprite.getTexture().getHtmlElementObj(), 0, 0);

        // 将canvas转换为Base64
        let base64Image = canvas.toDataURL('image/png');

        // 使用回调函数返回Base64字符串
        callback(base64Image);
    }
}


