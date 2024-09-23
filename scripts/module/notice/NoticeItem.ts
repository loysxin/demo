import { Button, Component, Label, RichText} from "cc";
import { DateUtils } from "../../utils/DateUtils";
import { NoticeData } from "../roleModule/PlayerData";
export class NoticeItem extends Component {
    private titleLab:Label;
    private arrowBtn:Button;
    private contLab:RichText;
    private isInit:boolean = false;
    private contIsOpen:boolean;
    private data:NoticeData;
    protected onLoad() {
        this.titleLab = this.node.getChildByPath("titleCont/titleLab").getComponent(Label);
        this.arrowBtn = this.node.getChildByPath("titleCont/arrowBtn").getComponent(Button);
        this.contLab = this.node.getChildByName("contLab").getComponent(RichText);
        this.arrowBtn.node.on(Button.EventType.CLICK, this.onArrowClick, this);
        this.isInit = true;
        this.initShow();
    }

    private onArrowClick():void{
        this.contIsOpen = !this.contIsOpen;
        this.updateShow();
    }

    SetData(data:NoticeData, isOpen:boolean = false):void{
        this.data = data;
        this.contIsOpen = isOpen;
        this.initShow();
    }

    private initShow():void{
        if(!this.isInit || !this.data) return;
        this.updateShow();
    }
    private updateShow():void{
        this.titleLab.string = this.data.title;
        if(this.contIsOpen){
            this.contLab.string = this.data.content;
            this.arrowBtn.node.angle = 0;
        }else{
            this.arrowBtn.node.angle = -180;
            let dates:string[] = DateUtils.TimestampToDate(this.data.updateAtUnix * 1000, true);
            this.contLab.string = `${dates[0]}-${dates[1]}-${dates[2]}`;
        }
    }
}