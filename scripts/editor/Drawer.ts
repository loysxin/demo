import { Color, Component, EventMouse, EventTouch, Graphics, Input, Node, Prefab, UITransform, Vec2, Vec3, find, instantiate, v2, v3 } from "cc";
import { Convert, NoTouch, drawLine } from "../utils/Utils";
import { SceneCamera } from "../module/SceneCamera";
import { ResMgr } from "../manager/ResMgr";
import { GameSet } from "../module/GameSet";
import Logger from "../utils/Logger";

export class Drawer extends Component {

    static ins: Drawer;

    private graphics: Graphics;
    private origin: Node;
    private map: Node;
    singleW: number = 128;
    singleH: number = 64;
    allSize: number = 7168;

    cameraSatrtPos = new Vec3();
    camera: Node
    groundLay: Node;

    gameWidth: number;
    gameHight: number;
    mapGraphics: Graphics;
    Item: Prefab;

    protected async onLoad(): Promise<void> {
        Drawer.ins = this;

        this.graphics = this.getComponent(Graphics);
        if (!this.graphics) this.graphics = this.addComponent(Graphics);

        //     this.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        // }

        // onTouchMove(event: EventTouch) {
        //     let delta = event.getDelta();
        //     Logger.log("Drawer");
        //     SceneCamera.Move(-delta.x, -delta.y);

        // this.drawMap();
        this.groundLay = this.node.parent.getChildByName('groundLay')
        this.Item = await ResMgr.GetResources('prefabs/Item') as Prefab;
    }

    init(map: Node) {
        this.map = map;
        map.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        map.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchStart(event: TouchEvent) {
        Logger.log('--TOUCH_START---1111')
    }

    onTouchEnd(event: EventTouch) {
        let posC = this.camera.getPosition();
        let offset = posC.subtract(this.cameraSatrtPos);
        let p = event.getUILocation();
        let [x, y] = Convert(p.x - GameSet.Half_Width_SceneCanvas, p.y - GameSet.Half_Height_SceneCanvas, this.node.parent, this.groundLay);
        let newVector = new Vec3(x, y);
        let nowPos = newVector.add(offset);
        Logger.log('触摸坐标', nowPos)
        let centerPoint = this.getMapPosByClickPos(nowPos);
        Logger.log('中心点', centerPoint)

        this.drawChoose(centerPoint);
    }

    drawChoose(pos) {
        let newItem = instantiate(this.Item);
        this.map.addChild(newItem);
        newItem.active = true;
        let l = this.gameWidth / 2;
        let p = this.gameHight / 2;
        let pos1 = v3(pos.x + this.gameWidth / 2, pos.y + this.gameHight / 2, 1)
        newItem.setPosition(pos1);
        newItem.on(Input.EventType.MOUSE_DOWN, function (event: EventMouse) {
            if (event.getButton() === EventMouse.BUTTON_LEFT) {
                // 左键点击

            } else if (event.getButton() === EventMouse.BUTTON_RIGHT) {
                // 右键点击
                newItem.destroy();
            }
        }, this);
    }

    getMapPosByClickPos(pos) {
        let startPos = v2(-this.gameWidth / 2, -this.gameHight / 2)
        let row = Math.ceil((pos.x + this.gameWidth / 2) / this.singleW);
        let col = Math.ceil((pos.y + this.gameHight / 2) / this.singleH);
        Logger.log("第几行---->>>", row)
        Logger.log("第几列---->>>", col)
        let mapx = row * this.singleW - this.singleW / 2 + startPos.x;
        let mapy = col * this.singleH - this.singleH / 2 + startPos.y;
        return new Vec2(mapx, mapy);
    }

    Reset(col: number, row: number, wide: number, hide: number, gameWidth: number, gameHeight: number) {
        // this.graphics.rect(0,0,col*wide,row*hide);
        // this.graphics.fill();
        this.gameWidth = gameWidth;
        this.gameHight = gameHeight;
        this.singleW = wide;
        this.singleH = hide;

        for (let x = 0; x < col; x++) {
            this.graphics.moveTo(x * wide, 0);
            this.graphics.lineTo(x * wide, row * hide);
        }
        for (let y = 0; y < row; y++) {
            this.graphics.moveTo(0, y * hide);
            this.graphics.lineTo(col * wide, y * hide);
        }
        this.graphics.close();
        this.graphics.stroke();

        this.mapGraphics = this.map.addComponent(Graphics);
        let size = this.map.getComponent(UITransform).contentSize;
        Logger.log('size', size)
        this.mapGraphics.clear()
        this.mapGraphics.rect(0, 0, size.x, size.y);
        // mapGraphics.fill()
        this.mapGraphics.strokeColor = new Color().fromHEX('#FFFFFF');
        this.mapGraphics.lineWidth = 5;
        this.mapGraphics.close()
        this.mapGraphics.stroke()

    }

    initCamera() {
        this.camera = this.node.parent.getChildByName('Camera');
        this.cameraSatrtPos = this.camera.getPosition();
        Logger.log('this.cameraSatrtPos', this.cameraSatrtPos)
    }
}