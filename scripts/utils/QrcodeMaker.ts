import { _decorator, Component, Node, Graphics, Color, UITransform } from 'cc';
import { QRCode } from './QRCode';

const { ccclass, property } = _decorator;
let QRErrorCorrectLevel = {
    L: 1,
    M: 0,
    Q: 3,
    H: 2
};

export class QrcodeMaker {
    static Create(url: string, width: number, height: number) {
        let node = new Node();
        let trans = node.addComponent(UITransform);
        let graphic: Graphics = node.addComponent(Graphics);
        trans.setContentSize(width, height);

        var qrcode = new QRCode(-1, QRErrorCorrectLevel.H);
        qrcode.addData(url);
        qrcode.make();

        var ctx = graphic.getComponent(Graphics)!;
        ctx.fillColor = Color.BLACK;
        var tileW = graphic.getComponent(UITransform)!.width / qrcode.getModuleCount();
        var tileH = graphic.getComponent(UITransform)!.height / qrcode.getModuleCount();

        // 绘制
        for (var row = 0; row < qrcode.getModuleCount(); row++) {
            for (var col = 0; col < qrcode.getModuleCount(); col++) {
                if (qrcode.isDark(row, col)) {
                    var w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW));
                    var h = (Math.ceil((row + 1) * tileW) - Math.floor(row * tileW));
                    ctx.rect(Math.round(col * tileW), Math.round(row * tileH), w, h);
                    ctx.fill();
                } else {
                    // ctx.fillColor = cc.Color.WHITE;
                }
                var w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW));
            }
        }
        return node;
    }
}
