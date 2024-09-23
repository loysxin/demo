import { _decorator, Canvas, CCInteger, Color, Component, EditBox, Input, Label, Layout, Node, Sprite, Toggle, UITransform } from 'cc';
import { EventMgr } from '../../manager/EventMgr';
import { Tips } from '../../module/login/Tips';
import { Convert, IsArray, maxx, Second } from '../../utils/Utils';
import { IsLink, SkillCfg, SkillFrameEvent } from '../../module/home/SkillStruct';
import { FrameType, SkillSetter } from './SkillSetter';
import { Selector } from './Selector';
import { SkillUitls } from './SkillUtils';
import Logger from '../../utils/Logger';
const { ccclass, property } = _decorator;

@ccclass('SkillLineEditor')
export class SkillLineEditor extends Component {

    @property(CCInteger)
    protected type: number;

    private nameBar: Node;
    private editItmes: EditBox[];
    private selectors: Selector[];
    private others: Node[];
    private data: any;
    private index: any;
    private subLay: Node;
    private initW: number;
    private initH: number;
    private layoutH: number;
    public nameBarHide: number;
    private tabbtn: Node;
    private frameEvent:SkillFrameEvent;
    protected onLoad(): void {
        this.init();
        //EventMgr.on("skill_line_change", this.onChange, this);
        EventMgr.on("skill_hide_lab", this.onHideName, this);
        // EventMgr.on("skill_edit_flush", this.flush, this);
        // this.node.on(Node.EventType.PARENT_CHANGED, this.onChangeParent, this);
    }

    protected onChangeParent() {
        if (!this.node.parent) {
            EventMgr.off("skill_edit_flush", this.flush, this);
        } else {
            EventMgr.on("skill_edit_flush", this.flush, this);
        }
    }

    protected flush() { this.onInput(null); }

    get ObjType() {
        if (this.data && this.data.ObjType) return this.data.ObjType;
    }

    init() {
        if (this.subLay) return;
        this.editItmes = [];
        this.selectors = [];
        this.others = [];
        this.nameBar = this.node.getChildByName("name");
        // this.nameBar.active = false;
        let layout = this.node.getChildByName("layout");
        let children = layout.children;
        for (let child of children) {
            if (child.getComponent(Selector)) {
                this.selectors.push(child.getComponent(Selector));
                child.on("open", this.onTop, this);
            } else if (child.getComponent(EditBox)) {
                child.on("editing-did-began", this.onBegan, this);
                child.on("editing-did-ended", this.onInput, this);
                let input = child.getComponent(EditBox);
                this.editItmes.push(input);
            } else {
                this.others.push(child);
            }
        }
        this.subLay = this.node.getChildByName("subLay");
        this.tabbtn = this.node.getChildByPath("tabbtn");
        this.node.getChildByName("delbtn").on(Input.EventType.TOUCH_END, this.onDel, this);
        this.tabbtn.on(Input.EventType.TOUCH_END, this.onTab, this);
        this.initW = this.getComponent(UITransform).contentSize.width;
        this.initH = this.getComponent(UITransform).contentSize.height;
        this.nameBarHide = this.initH;
        this.layoutH = layout.getComponent(UITransform).contentSize.height;
        this.layoutH = maxx(0, this.layoutH - this.initH);
        this.subLay.setSiblingIndex(0);
    }

    start() {

    }

    update(deltaTime: number) {
        // let value = this.nameBar.active;
        // this.tabbtn.getComponent(Sprite).enabled = !value;
        // Logger.log("update",value);
    }

    private onTop() {
        // this.node.setSiblingIndex(this.node.parent.children.length);
        // let parent = this.node.parent;
        // while (parent && parent.name != "itemLay") {
        //     parent.setSiblingIndex(parent.parent.children.length);
        //     parent = parent.parent;
        //     if (parent.getComponent(Canvas)) break;
        // }
    }

    private createLine(objType: number): Node {
        return window['CreateSkillLine'](objType);
    }

    private receiveSubLine() {
        let children = this.subLay.children;
        for (let child of children) {
            let line = child.getComponent(SkillLineEditor);
            if (line) {
                window['ReceiveSKillLine'](line);
            }
        }
        this.subLay.removeAllChildren();
    }

    private setItemString(node: Node, value: string, data: any, fileName: string) {
        if (node.getComponent(EditBox)) {
            node.getComponent(EditBox).string = value;
        } else if (node.getComponent(Selector)) {
            node.getComponent(Selector).string = value;
            SkillUitls.FormatItem(node, data, fileName);
        } else {
            SkillUitls.FormatItem(node, data, fileName);
        }
    }

    setData(index:number, data: SkillCfg | SkillFrameEvent) {
        this.index = index;
        
        let obj:any;
        
        if(!data["ObjType"]){
            obj = data as SkillCfg;
        }else{
            this.frameEvent = data as SkillFrameEvent;
            switch (this.frameEvent.ObjType) {
                case FrameType.Box:
                    obj = SkillSetter.boxs[this.frameEvent.Id];
                    break;
                case FrameType.Effect:
                    obj = SkillSetter.effects[this.frameEvent.Id];
                    break;
                case FrameType.Shake:
                    obj = SkillSetter.shakes[this.frameEvent.Id];
                    break;
                case FrameType.Bullet:
                    obj = SkillSetter.bullets[this.frameEvent.Id];
                    break;
                case FrameType.Sound:
                    obj = SkillSetter.sounds[this.frameEvent.Id];
                    break;
                case FrameType.Affect:
                    obj = SkillSetter.affects[this.frameEvent.Id];
                    break;
            }
        }
        this.init();
        let layout = this.node.getChildByName("layout");
        this.receiveSubLine();
        for (let k in obj) {
            let child = layout.getChildByName(k);
            let value = obj[k];
            if (child && value != undefined) {
                let subType = IsLink(obj.ObjType, child.name);
                if (subType != undefined) {
                    value = value || [];
                    this.setItemString(child, fileId(value), obj, k);
                    for (let i = 0; i < value.length; i++) {
                        let subObj = value[i];
                        let line = this.createLine(subObj.ObjType);
                        if (!line) {
                            console.warn("创建载体预制失败", subObj.ObjType);
                        } else {
                            line.name = child.name;
                            if (!line.setParent) {
                                debugger;
                            }
                            this.subLay.addChild(line);
                            line.getComponent(SkillLineEditor).hideDelay();
                            line.getComponent(SkillLineEditor).setData(i, subObj);
                        }
                    }
                } else if (IsArray(value)) {
                    if (value.length && value[0].length) {
                        this.setItemString(child, value.join("|"), obj, k);
                    } else {
                        let ls: string[] = value;
                        this.setItemString(child, ls.join("|"), obj, k);
                    }
                } else {
                    this.setItemString(child, String(value), obj, k);
                }
            }
        }
        this.data = obj;
        if(this.frameEvent){
            let delayLab = layout.getChildByName("Delay");
            if (delayLab) {
                delayLab.getComponent(EditBox).string = this.frameEvent.TimeTick.toString();
            }
            let RatioLab = layout.getChildByName("Ratio");
            if(RatioLab){
                if(this.frameEvent){
                    RatioLab.getComponent(EditBox).string = this.frameEvent.Ratio.toString();
                }
                
            }
        }
        
        
        this.layout();
    }

    private onTab() {
        if (!this.nameBar.active) {
            this.onBegan(null);
        } else {
            this.onHideName();
        }
    }

    private onHideName() {
        this.nameBar.active = false;
        this.layout();
        if (this.isSub) {
            this.node.parent.parent.getComponent(SkillLineEditor).onHideName();
        }
        EventMgr.emit("layout_all_line");
    }

    private onBegan(input: EditBox) {
        this.nameBar.active = true;
        this.layout();
        if (this.isSub) {
            this.node.parent.parent.getComponent(SkillLineEditor).onBegan(undefined);
            return;
        }
        EventMgr.emit("layout_all_line", this.node);
    }
    public get bound() {
        if (!this.nameBar || !this.nameBar.active) {
            return [this.initH / 2, this.nameBarHide];
        } else {
            return [46 + this.initH / 2, this.nameBarHide];
        }
    }
    private layout() {
        this.init();
        const gev = 15;
        let children = this.subLay.children;
        this.nameBarHide = this.nameBar.active ? this.initH + 46 + this.layoutH : this.initH + this.layoutH;// = this.initH + gev;
        let hide = 0;
        for (let child of children) {
            let line = child.getComponent(SkillLineEditor);
            if (line) {
                line.nameBar.active = this.nameBar.active;
                line.node.active = this.nameBar.active;
                line.layout();
                let bound = line.bound;
                child.setPosition(0, -(hide + bound[0]));
                hide += (bound[1] + gev);
            }
        }
        
        if(this.nameBar.active)
        {
            this.nameBarHide += hide;
            this.nameBarHide += this.layoutH;
        }
    }

    private onInput(input: EditBox) {
        this.init();
        if (input && this.data.ObjType == 0) {
            input.string = this.data[input.node.name];
            // this.onHideName();
            EventMgr.emit("layout_all_line");
            // EventMgr.emit("skill_hide_lab");
            return;
        }
        if (input && input.node.name == "Id") {
            input.string = this.data.Id;
            // this.onHideName();
            EventMgr.emit("layout_all_line");
            // EventMgr.emit("skill_hide_lab");
            return;
        }

        if (input && input.node.name == "ActionId") {
            if(Number(input.string) == undefined || Number(input.string) <= 0) return;

            SkillSetter.nowSkill.ActionId = Number(input.string);
            EventMgr.emit("skill_reset", SkillSetter.nowSkill);
            return;
        }


        let delay: number;
        let ratio:number;
        for (let child of this.editItmes) {
            let name = child.node.name;
            let value = child.string;
            if (name == "Delay") {
                delay = Number(value) || 0;
            }else if(name == "Ratio"){
                ratio = Number(value) || 0;
            }
            else if (name == "Affect")
            {
                let values = value != "" ? value.split("|") : [];
                this.data[name] = []
                let affects = this.data[name];
                for (let ids of values) {
                    let id = Number(ids);
                    if(SkillSetter.totalAffects.hasOwnProperty(id))
                    {
                        let table = SkillSetter.totalAffects[id];
                        let affect = SkillSetter.NewAffect(table);
                        affects.push(affect);
                    }
                }
            }
            else {
                let subType = IsLink(this.data.ObjType, name);
                if (subType != undefined) {
                    let values = value != "" ? value.split("|") : [];
                    this.data[name] = [];
                    let index = 0;
                    for (let ids of values) {
                        let id = Number(ids);
                        
                        let frameEvent:SkillFrameEvent;
                        switch (subType) {
                            case FrameType.Box:
                                frameEvent = SkillSetter.NewFrameEvent(id, FrameType.Box, 0, 1);
                                break;
                            case FrameType.Effect:
                                frameEvent = SkillSetter.NewFrameEvent(id, FrameType.Effect, 0, 1);
                                break;
                            case FrameType.Shake:
                                frameEvent = SkillSetter.NewFrameEvent(id, FrameType.Shake, 0, 1);
                                break;
                            case FrameType.Bullet:
                                frameEvent = SkillSetter.NewFrameEvent(id, FrameType.Bullet, 0, 1);
                                break;
                            case FrameType.Sound:
                                frameEvent = SkillSetter.NewFrameEvent(id, FrameType.Sound, 0, 1);
                                break;
                        }
                        if(frameEvent)
                        {
                            SkillSetter.AddChild(frameEvent, false);
                            this.data[name][index] = frameEvent;
                            index++;
                        }
                        /* if (frameEvent) {
                            if (this.data[name].indexOf(subObj) == -1) this.data[name].push(subObj);
                        } else if (subType != 0) {
                            
                            if (subObj && this.data[name].indexOf(subObj) == -1) this.data[name].push(subObj);
                        } */
                    }
                } else if (IsArray(this.data[name])) {
                    value = String(value);
                    let ary: any[] = value.split("|");
                    for (let i = 0; i < ary.length; i++) {
                        if (!isNaN(Number(ary[i]))) {
                            ary[i] = Number(ary[i]);
                        }
                    }
                    this.data[name] = ary;
                } else {
                    if (isNaN(Number(value))) {
                        this.data[name] = value;
                    } else {
                        this.data[name] = Number(value);
                    }
                }
            }
        }
        // Logger.log("onInput", this.data);
        if (this.type > 0) {
            this.frameEvent.Ratio = ratio;
            this.frameEvent.TimeTick = delay;
            this.setData(this.index, this.frameEvent);
            //this.data["ObjType"] = this.type;
            //EventMgr.emit("skill_line_change", this.index, this.data, this.frameEvent);
        }else{
            this.setData(this.index, this.data);
        }
        // this.onHideName();
        EventMgr.emit("layout_all_line", this.node);
        // EventMgr.emit("skill_hide_lab");
    }

    private isSub = false;
    protected hideDelay() {
        this.isSub = true;
        let delayInput = this.node.getChildByName("layout/Delay");
        if (delayInput) delayInput.active = false;
        let delayLab = this.node.getComponent("name/name0");
        if (delayLab) delayLab.node.active = false;
        this.node.getChildByName("Label").getComponent(Label).color = new Color().fromHEX("#FFFF00");
    }

    /* private onChange(index: number, delay: number, data: any, frameEvent:SkillFrameEvent) {
        Logger.log("onChange", this.data == data, data, this.data)
        if (!this.data || this.data == data) {
            if (this.data.TimeTick != delay) {
                this.setData(index, data, delay);
            } else {
                this.setData(index, this.data, this.data.TimeTick);
            }
        }
    } */

    private onDel() {
        this.init();
        let node = this.node;
        Tips.Show("确认删除此项?", () => {
            if (this.isSub) {
                let parent = node.parent.parent.getComponent(SkillLineEditor);
                let lst = parent.data[node.name];
                if(this.index < lst.length){
                    lst.splice(this.index, 1);
                }
                node.parent && node.parent.removeChild(node);
                EventMgr.emit("skill_reset", SkillSetter.nowSkill);
            } else {
                node.parent && node.parent.removeChild(node);
                EventMgr.emit("skill_line_del", this.frameEvent ? this.frameEvent : this.data, this.index);
            }
            node.destroy();
        });
    }
}


function fileId(arr: { Id: number }[]) {
    if (!arr) return "";
    let ls = [];
    for (let obj of arr) {
        ls.push(obj.Id);
    }
    return ls.join("|");
}