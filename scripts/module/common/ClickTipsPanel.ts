import { EventTouch, Node, Rect, Size, UITransform, Vec2, Vec3} from "cc";
import { Panel } from "../../GameRoot";

export class ClickTipsPanel extends Panel {
    protected prefab: string = "prefabs/panel/ClickTipsPanel";
    private tipsCont:Node;
    //滑动是否关闭TOUCH_END事件
    private moveIsEnd: boolean = false;
    private haveStart: boolean = false;
    private _target:Node;
    private _clickTarget:Node;
    private _targetPatent:Node;
    private _size:Size;
    private _hideCb:()=>void = null;
    private isDelay:boolean;
    protected onLoad(): void {
        this.tipsCont = this.find("tipsCont");
        this._size = this.node.getComponent(UITransform).contentSize;
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

    }
    protected onShow(): void {
        
    }
    /**
     * 
     * @param target tips目标节点
     * @param targetPatent tips目标节点父节点
     * @param clickTarget 点击目标节点
     * @param showWorlPos 显示坐标（世界）
     * @param dir target在点击目标的方向 0：下方 1：上方
     * @param hideCb tips关闭回调
     */
    public flush(target:Node, targetPatent:Node, clickTarget:Node, showWorlPos:Vec3 = null, dir:number = 0, hideCb:() => void): void {
        if(this._clickTarget == clickTarget){
            this.isDelay = true;
            return;
        }
        this.isDelay = false;
        this.resetTarger();
        this._hideCb = hideCb;
        this._target = target;
        this._target.active = true;
        this._target.position = new Vec3(0, 0);
        this._targetPatent = targetPatent;
        this._clickTarget = clickTarget;
        this._target.setParent(this.tipsCont);
        let targetTrans = target.getComponent(UITransform);
        let targetRect:Rect = targetTrans.getBoundingBox();
        this.tipsCont.getComponent(UITransform).setContentSize(targetRect.width, targetRect.height);
        let newPos:Vec3;
        //有指定位置显示就指定位置显示
        if(showWorlPos){
            newPos = showWorlPos;
        }else{
            let clickTargetTrans = this._clickTarget.getComponent(UITransform);
            newPos = this._clickTarget.worldPosition.clone();
            newPos.x = this._size.width / 2;
            let newY:number;
            //出下方
            if(dir == 0){
                newY = newPos.y - clickTargetTrans.height / 2 - targetRect.height / 2;
               //下方超出边界则出上方
               if(newY < 0){
                    newY = newPos.y + clickTargetTrans.height / 2 + targetRect.height / 2;
               }
               newPos.y = newY;
            }else{
                //出上方
                newY = newPos.y + clickTargetTrans.height / 2 + targetRect.height / 2;
                if(newY > this._size.height){
                    newY = newPos.y - clickTargetTrans.height / 2 - targetRect.height / 2;
                }
            }
        }
        this.tipsCont.worldPosition = newPos;
    }
    protected onHide(): void {
        this.resetTarger();
        if(this._hideCb != null) this._hideCb();
        this._hideCb = null;
    }
    private resetTarger():void{
        if(this.tipsCont.children.length > 0){
            let target:Node = this.tipsCont.children[0];
            if(this._targetPatent){
                target.setParent(this._targetPatent);
                target.active = false;
                this._target = null;
                this._clickTarget = null;
                this._targetPatent = null;
            }
        }
    }
    private onTouchStart(touch: EventTouch): void {
        touch.preventSwallow = true;
        this.haveStart = true;
        this.isMove = false;
        this.dis = new Vec2(0, 0);
        //console.log("----->onTouchStart");
    }
    //是否移动状态
    private isMove = null;
    //点击移动距离
    private dis: Vec2 = new Vec2(0, 0);
    private onTouchMove(touch: EventTouch): void {
        touch.preventSwallow = true;
        if (!this.haveStart) return;
        let dis = touch.getDelta();
        this.dis.x += dis.x;
        this.dis.y += dis.y;
        let distance = this.dis.length();
        //滑动区域20像素算作移动
        if (distance >= 20) this.isMove = true;
        //console.log("----->onTouchMove");
    }
    private onTouchEnd(touch: EventTouch): void {
        touch.preventSwallow = true;
        if (!this.haveStart) return;
        if (this.moveIsEnd && this.isMove) return;
        if(this.isDelay){
            this.scheduleOnce(()=>{
                this.Hide();
            }, 0.05)
        }else{
            this.Hide();
        }
        
        this.haveStart = false;
        this.isMove = false;
        //console.log("----->onTouchEnd");
    }
    private onTouchCancel(touch: EventTouch): void {
        touch.preventSwallow = true;
        this.haveStart = false;
        this.isMove = false;
        //console.log("----->onTouchCancel");
    }



}