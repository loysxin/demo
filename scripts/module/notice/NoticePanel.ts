import { instantiate, Node, ScrollView} from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { NoticeData } from "../roleModule/PlayerData";
import { NoticeItem } from "./NoticeItem";
import { FrameTask } from "../../utils/FrameTask";
import { Http, SendGetAllNotice } from "../../net/Http";
export class NoticePanel extends Panel {
    protected prefab: string = "prefabs/panel/notice/NoticePanel";
    private list:ScrollView;
    private tempItem:Node;
    private noneListCont:Node;
    private readonly MAX_LEN:number = 20;//最大公告长度
    protected onLoad() {
        this.list = this.find("list", ScrollView);
        this.tempItem = this.find("tempItem");
        this.noneListCont = this.find("noneListCont");
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
    }
    protected onShow(): void {
        
    }
    protected onHide(...args: any[]): void {
        
    }
    
    public async flush(isAuto:boolean = false): Promise<void> {
        if(isAuto){
            this.updateShow();
        }else{
            let noticeDatas = await Http.Send(SendGetAllNotice);
            let list:NoticeData[] = noticeDatas["data"] || [];
            PlayerData.SetNoticeDatas(list);
            this.updateShow();
        }
        
    }
    private updateShow():void{
        let datas:NoticeData[] = PlayerData.GetNoticeDatas();
        let data:NoticeData;
        let topList:NoticeData[] = [];//置顶
        let defList:NoticeData[] = [];
        let endTime:number;
        for (let index = 0; index < datas.length; index++) {
            data = datas[index];
            if(data.displayDuration > 0){
                endTime = data.updateAtUnix + data.displayDuration * 86400;
                if(endTime <= PlayerData.GetServerTime()) continue;
            }
            
            if(data.isPinned){
                topList.push(data);
            }else{
                defList.push(data);
            }
        }
        topList.sort((a:NoticeData, b:NoticeData) => {
            return b.updateAtUnix - a.updateAtUnix;
        });
        defList.sort((a:NoticeData, b:NoticeData) => {
            return b.updateAtUnix - a.updateAtUnix;
        });
        let newDatasList:NoticeData[] = topList.concat(defList);
        let contList:Node[] = this.list.content.children;
        let len:number = newDatasList.length;
        let maxLen = Math.max(len, contList.length);
        FrameTask.ins.ToTask(this.createItem, this, maxLen, newDatasList, 0, 0.05);
        this.noneListCont.active = newDatasList.length <= 0;
    }
    private createItem(count:number, datas:NoticeData[]) {
        let node:Node;
        node = this.list.content.children[count];
        if(!node){
            node = instantiate(this.tempItem);
            this.list.content.addChild(node);
        }
        if(count < datas.length){
            let itemCom:NoticeItem = node.getComponent(NoticeItem);
            if(!itemCom) itemCom = node.addComponent(NoticeItem);
            itemCom.SetData(datas[count]);
            node.active = true;
            this.list.content.addChild(node);
        }else{
            node.active = false;
        }
    }
}