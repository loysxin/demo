import { Component, easing, EventTouch, find, Node, path, Sprite, SpriteFrame, tween, UIOpacity, UITransform, Vec2, Vec3, Widget} from "cc";
import { folder_common, ResMgr } from "./manager/ResMgr";

export class HoverMgr extends Component {
    private dragBtn:Node;
    private dragOpacity:UIOpacity;
    private haveStart: boolean = false;
    //是否移动状态
    private isMove:boolean = false;
    //点击移动距离
    private dis: Vec2 = new Vec2(0, 0);
    private tempPos: Vec3 = new Vec3();
    private isAutoStop:boolean = false;//是否自动停靠中
    private readonly offsetVal:number = 100;
    private static _inst: HoverMgr = null;
    protected onLoad(): void {
        console.error("初始化---->");
        this.dragBtn = new Node("dragBtn");
        this.dragOpacity = this.dragBtn.addComponent(UIOpacity);
        let img: Sprite = this.dragBtn.addComponent(Sprite);
        this.node.addChild(this.dragBtn);
        let rootTrans:UITransform = this.node.getComponent(UITransform);
        this.dragBtn.position = new Vec3(rootTrans.width / 2, 0);
        ResMgr.LoadResAbSub(path.join(folder_common, "hover_btn", "spriteFrame"), SpriteFrame, sf => {
            img.spriteFrame = sf;
            
        });
        
        this.dragBtn.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.dragBtn.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.dragBtn.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.dragBtn.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }
    private onTouchStart(touch: EventTouch): void {
        if(this.isAutoStop) return;
        this.haveStart = true;
        this.isMove = false;
        this.dis = new Vec2(0, 0);
        this.dragOpacity.opacity = 150;
    }
    
    private onTouchMove(touch: EventTouch): void {
        if (!this.haveStart) return;
        let dis = touch.getDelta();
        this.dis.x += dis.x;
        this.dis.y += dis.y;
        let distance = this.dis.length();
        //以移动像素判断是否移动了
        if (distance >= 2){
            this.isMove = true;
            this.tempPos.set(touch.getUILocation().x, touch.getUILocation().y);
            this.dragBtn.setWorldPosition(this.tempPos);
        } 
        //console.log("----->onTouchMove");
    }
    private onTouchEnd(touch: EventTouch): void {
        if (!this.haveStart) return;
        
        this.touchComplete();
        
    }
    private onTouchCancel(touch: EventTouch): void {
        if (!this.haveStart) return;
        this.touchComplete();
        
    }
    private touchComplete():void{
        if (!this.isMove){
            this.toClick();
        }else{
            let pos:Vec3 = this.getLimitPos();
            if(pos){
                this.isAutoStop = true;
                tween(this.dragBtn)
                .to(0.3, { position: pos }, { easing: easing.backOut })
                .call(()=>{
                    this.isAutoStop = false;
                })
                .start();
                
            }
        }
        this.haveStart = false;
        this.isMove = false;
        this.dragOpacity.opacity = 255;
    }
    private getLimitPos():Vec3{
        let rootTrans = this.node.getComponent(UITransform);
        let dragTrans = this.dragBtn.getComponent(UITransform);
        let offsetX:number, offsetY:number;
        offsetX = rootTrans.width / 2 - dragTrans.width / 2 - Math.abs(this.dragBtn.position.x);
        offsetY = rootTrans.height / 2 - dragTrans.height / 2 - Math.abs(this.dragBtn.position.y);
        let tempMini:number = Math.min(offsetX, offsetY);
        let targetPos:Vec3;
        //贴边范围
        if(tempMini <= this.offsetVal){
            targetPos = new Vec3();
            let tempX:number = rootTrans.width / 2;
            let tempY:number = rootTrans.height / 2;
            if (tempMini == offsetX){
                //右
                if(this.dragBtn.position.x > 0){
                    targetPos.set(tempX, this.dragBtn.position.y);
                }else{
                    //左
                    targetPos.set(- tempX, this.dragBtn.position.y);
                }
            }else{
                //上
                if (this.dragBtn.position.y > 0){
                    targetPos.set(this.dragBtn.position.x, tempY);
                }else{
                    //下
                    targetPos.set(this.dragBtn.position.x, -tempY);
                }
            }
        }
        return targetPos;
    }
    private toClick():void{
        console.log("-------->点击")
    }
    public static creat(): void{
        if(this._inst) return;
        let canvas:Node = find("Canvas");
        let node:Node = new Node("Hover_Lay");
        let widget = node.addComponent(Widget);

        widget.left = 0;
        widget.right = 0;
        widget.top = 0;
        widget.bottom = 0;

        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.isAlignBottom = true;
        widget.isAlignTop = true;
        canvas.addChild(node);
        widget.updateAlignment();
        this._inst = node.addComponent(HoverMgr);
    }
    public static get Inst(): HoverMgr {
        return this._inst;
    }
}