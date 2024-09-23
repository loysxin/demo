import { Button, Color, Component, instantiate, Label, Node, ProgressBar, sp, Vec3 } from "cc";
import { SPlayerDataTask, STaskState } from "../roleModule/PlayerData";
import { CfgMgr, StdTask } from "../../manager/CfgMgr";
import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { EventMgr, Evt_TaskShowBoxTips } from "../../manager/EventMgr";

export class TaskActiveBoxItem extends Component {
    private activeNumLab:Label;
    private boxEffect:sp.Skeleton;
    private btn:Button;
    private isInit:boolean;
    private data:SPlayerDataTask;
    private std:StdTask;
    protected onLoad(): void {
        this.btn = this.node.getComponent(Button);
        this.boxEffect = this.node.getChildByName("boxEffect").getComponent(sp.Skeleton);
        this.activeNumLab = this.node.getChildByName("activeNumLab").getComponent(Label);
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        this.updateShow();
    }
    SetData(data:SPlayerDataTask) {
        this.data = data;
        this.updateShow();
    }
    private onBtnClick():void{
        if(!this.data || !this.std) return;
        if(this.data.v >= this.std.CompletionNum && this.data.s == STaskState.unFinsh){
            Session.Send({type: MsgTypeSend.CompleteTask, data:{task_id: this.std.TaskId}}, MsgTypeRet.CompleteTaskRet);
        }else{
            let tipsW:number = 412;
            let itemPos = this.btn.node.worldPosition.clone();
            let showPos:Vec3;
            let offset:number = tipsW / 2 + itemPos.x; 
            if(offset > 1080){
                offset = 1080 - tipsW / 2;
            }else{
                offset = itemPos.x;
            }
            showPos = new Vec3(offset, itemPos.y - 460, 0);
            EventMgr.emit(Evt_TaskShowBoxTips, this.std, showPos, this.btn.node);
        }
        
    }
    private updateShow():void{
        if (!this.isInit || !this.data) return;
        this.std = CfgMgr.GetTaskById(this.data.id);
        this.activeNumLab.string = this.std.CompletionNum.toString();
        let animName:string = "idle";
        let acColor:string = "#FFFFFF";
        if(this.data.v >= this.std.CompletionNum){
            acColor = "#8DFF55";
            if(this.data.s == STaskState.Finsh){
                animName = "open";
            }else{
                animName = "animation";
            }
        }
        this.activeNumLab.color = new Color().fromHEX(acColor);
        this.boxEffect.setAnimation(0, animName, true);
    }
}
