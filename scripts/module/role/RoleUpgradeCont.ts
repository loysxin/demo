import { Button, Component, Label, Node, ProgressBar, Sprite, SpriteFrame, Toggle, path } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import PlayerData, { CountPower, RoleCardPower, SPlayerDataItem, SPlayerDataRole } from "../roleModule/PlayerData";
import { CardQuality, CfgMgr, ItemType, StdItem, StdRole, StdRoleLevel } from "../../manager/CfgMgr";
import { CanSet } from "../home/HomeStruct";
import { ResMgr, folder_quality } from "../../manager/ResMgr";
import { AwardItem } from "../common/AwardItem";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import { Tips } from "../login/Tips";
import { MsgPanel } from "../common/MsgPanel";
import { ConditionSub, FormatCondition, SetNodeGray } from "../common/BaseUI";

export class RoleUpgradeCont extends Component {
    private closeBtn:Button;
    private qualBg:Sprite;
    private qualIcon:Sprite;
    private typeIcon:Sprite;
    private nameLab:Label;
    private lvLab:Label;
    private nextLvLab:Label;
    private fightLab:Label;
    private nextFightLab:Label;
    private nextLvCont:Node;
    private expPro:ProgressBar;
    private expProLab:Label;
    private consumeItemLits:AutoScroller;
    private haveItemLits:AutoScroller;
    private noneItemLab:Label;
    private upgradeBtn:Button;
    private upgradeRedPoint:Node;
    private autoBtn:Button;
    private autoCont:Node;
    private subBtn:Button;
    private lvNumLab:Label;
    private addBtn:Button;
    private maxBtn:Button;
    private roleData:SPlayerDataRole;
    private stdRole:StdRole;
    private stdRoleLv:StdRoleLevel;
    private nextLv:StdRoleLevel;
    private _closeUpgradeContCall:Function;
    private isInit:boolean = false;
    private roleId:string;
    private datas:SPlayerDataItem[];
    private selectDatas:SPlayerDataItem[] = [];
    private selectExp:number = 0;
    private miniLvNum:number = 0;
    private maxLvNum:number = 0;
    private curLvNum:number = 0;
    private needExp:number = 0;
    protected onLoad(): void {
        this.closeBtn = this.node.getChildByName("closeBtn").getComponent(Button);
        this.qualBg = this.node.getChildByPath("baseInfoCont/qualBg").getComponent(Sprite);
        this.qualIcon = this.node.getChildByPath("baseInfoCont/qualIcon").getComponent(Sprite);
        this.typeIcon = this.node.getChildByPath("baseInfoCont/typeIcon").getComponent(Sprite);
        this.nameLab = this.node.getChildByPath("baseInfoCont/nameLab").getComponent(Label);
        this.lvLab = this.node.getChildByPath("baseInfoCont/lvLab").getComponent(Label);
        this.fightLab = this.node.getChildByPath("baseInfoCont/fightLab").getComponent(Label);
        this.nextLvCont = this.node.getChildByPath("baseInfoCont/nextLvCont");
        this.nextLvLab = this.node.getChildByPath("baseInfoCont/nextLvCont/nextLvLab").getComponent(Label);
        this.nextFightLab = this.node.getChildByPath("baseInfoCont/nextLvCont/nextFightLab").getComponent(Label);
        this.expPro = this.node.getChildByPath("baseInfoCont/expPro").getComponent(ProgressBar);
        this.expProLab = this.node.getChildByPath("baseInfoCont/expProLab").getComponent(Label);
        this.consumeItemLits = this.node.getChildByPath("consumeCont/consumeItemLits").getComponent(AutoScroller);
        this.haveItemLits = this.node.getChildByPath("consumeCont/haveItemLits").getComponent(AutoScroller);
        this.noneItemLab = this.node.getChildByPath("consumeCont/noneItemLab").getComponent(Label);
        this.autoCont = this.node.getChildByPath("consumeCont/autoCont");
        this.subBtn = this.node.getChildByPath("consumeCont/autoCont/subBtn").getComponent(Button);
        this.addBtn = this.node.getChildByPath("consumeCont/autoCont/addBtn").getComponent(Button);
        this.lvNumLab = this.node.getChildByPath("consumeCont/autoCont/lvNumLab").getComponent(Label);
        this.maxBtn = this.node.getChildByPath("consumeCont/autoCont/maxBtn").getComponent(Button);
        this.autoBtn = this.node.getChildByPath("consumeCont/autoBtn").getComponent(Button);
        this.upgradeBtn = this.node.getChildByPath("consumeCont/upgradeBtn").getComponent(Button);
        this.upgradeRedPoint = this.node.getChildByPath("consumeCont/upgradeBtn/red_point");
        this.haveItemLits.SetHandle(this.updateHaveItemLits.bind(this));
        this.haveItemLits.node.on('select', this.onHaveItemSelect, this);
        this.consumeItemLits.SetHandle(this.updateConsumeItemLits.bind(this));
        this.consumeItemLits.node.on('select', this.onConsumeItemSelect, this);
        this.autoBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.upgradeBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.closeBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.subBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.addBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.maxBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.isInit = true;
        this.autoCont.active = false;
        this.initShow();
    }

    /**
     * 设置角色数据
     * @param roleId
     */
    SetData(roleId: string):void {
        this.roleId = roleId;
        this.initShow();

    }
    private async initShow():Promise<void>{
        if(!this.isInit || !this.roleId) return;
        this.autoCont.active = false;
        this.roleData = PlayerData.GetRoleByPid(this.roleId);
        this.stdRole = CfgMgr.GetRole()[this.roleData.type];
        this.qualBg.spriteFrame = await ResMgr.LoadResAbSub(path.join("sheets/icons/quality/" + `card_line_${this.roleData.quality}`, "spriteFrame"), SpriteFrame);
        this.qualIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, CardQuality[this.roleData.quality] + "_big", "spriteFrame"), SpriteFrame);
        this.typeIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join("sheets/icons/pos" + this.stdRole.PositionType, "spriteFrame"), SpriteFrame);
        this.nameLab.string = this.stdRole.Name;
        this.updateItem();
        this.updateShow();
        
    }
    private onBtnClick(btn:Button) {
        switch (btn) {
            case this.closeBtn:
                this._closeUpgradeContCall();
                break;   
            case this.autoBtn:
                if(!this.autoCont.active){
                    if(!this.checkIsCanAddItem()){
                        
                        return;
                    } 
                    
                }
                this.autoCont.active = !this.autoCont.active;
                if(this.autoCont.active){
                    let itemExp:number = 0;
                    let items:SPlayerDataItem[] = PlayerData.GetItemTypeDatas(ItemType.exp);
                    for (const itemData of items) {
                        let stdItem:StdItem = CfgMgr.Getitem(itemData.id);
                        itemExp += stdItem.ItemEffect1 * itemData.count;
                    }
                    let maxLv:StdRoleLevel = CfgMgr.GetRoleExpMaxLevel(this.roleData.type, this.roleData.level, this.roleData.experience + itemExp);
                    if(maxLv){
                        if(maxLv.Level > this.roleData.level){
                            this.miniLvNum = this.roleData.level + 1;
                        }else{
                            this.miniLvNum = this.roleData.level;
                        }
                        this.maxLvNum = maxLv.Level;
                    }else{
                        this.miniLvNum = this.roleData.level;
                        this.maxLvNum = this.roleData.level;
                    }
                    this.curLvNum = this.miniLvNum;
                    this.updateAutoLv();
                }
                break;
            case this.upgradeBtn:
                if (!this.selectDatas || this.selectDatas.length < 1){
                    if(this.selectExp + this.roleData.experience < this.needExp){
                        MsgPanel.Show(`升级经验不足 ${this.needExp}`);
                        return;
                    }
                }
                let data = {
                    type: MsgTypeSend.UpgradeRole,
                    data: {
                        role_id: this.roleId,
                        items: this.selectDatas,
                    }
                }
                Session.Send(data);
                break;
            case this.subBtn:
                if(this.curLvNum > this.miniLvNum){
                    this.curLvNum --;
                    this.updateAutoLv();
                }
                break
            case this.addBtn:
                if(this.curLvNum < this.maxLvNum){
                    this.curLvNum ++;
                    this.updateAutoLv();
                }
                break;
            case this.maxBtn:
                if(this.curLvNum != this.maxLvNum){
                    this.curLvNum = this.maxLvNum;
                    this.updateAutoLv();
                }
                break;

        }
            
    }
    private updateAutoLv():void{
        this.lvNumLab.string = `${this.curLvNum}级`;
        this.resetSelect();
        
    }
    private updateShow():void{
        let maxLv:number = CfgMgr.GetRoleMaxLevel(this.roleData.type);
        //满级
        if (maxLv == this.roleData.level) {
            this._closeUpgradeContCall();
            return;
        }
        
        this.stdRoleLv = CfgMgr.GetRoleLevel(this.roleData.type, this.roleData.level);
        let isCanUp:boolean = true;
        if(this.stdRoleLv.ConditionId && this.stdRoleLv.ConditionId){
            let condData:ConditionSub = FormatCondition(this.stdRoleLv.ConditionId[0], this.stdRoleLv.ConditionLv[0], "基地等级达到%s后可升级");
            if(condData.fail){
                this._closeUpgradeContCall();
                return;
            }
        }
        this.fightLab.string = CountPower(this.roleData.type, this.roleData.level,this.roleData).toString();
        //突破
        if(this.stdRoleLv.BreakItem && this.stdRoleLv.BreakItem.length > 0){
            this._closeUpgradeContCall();
            return;
        }
        this.nextLv = CfgMgr.GetRoleExpMaxLevel(this.roleData.type, this.roleData.level, this.roleData.experience + this.selectExp);
        this.lvLab.string = `Lv.${this.roleData.level}`;
        let curExp = this.roleData.experience + this.selectExp;
        if(this.nextLv && this.nextLv.Level == this.roleData.level){
            this.nextLv = CfgMgr.GetRoleLevel(this.roleData.type, this.roleData.level + 1);
        }
        this.upgradeRedPoint.active = PlayerData.CheckRoleIsCanUp(this.roleId);
        if(this.nextLv){
            this.nextFightLab.string = RoleCardPower(this.roleData.type, this.roleData.quality, this.nextLv.Level, this.roleData).toString();
            this.nextLvCont.active = true;
            this.autoBtn.node.active = true;
            this.upgradeBtn.node.active = true;
            this.nextLvLab.string = `Lv.${this.nextLv.Level}`;
            this.needExp = CfgMgr.GetRoleTargetLevelMaxExp(this.roleData.type, this.roleData.level, this.nextLv.Level);
            this.expProLab.string = `${curExp}/${this.needExp}`;
            this.expPro.progress = curExp / this.needExp;
        }else{
            this.autoCont.active = false;
            this.nextLvCont.active = false;
            this.autoBtn.node.active = false;
            this.upgradeBtn.node.active = false;
            this.expProLab.string = `${this.roleData.experience}`;
            this.expPro.progress = this.roleData.experience;
        }
        
    }
    private checkIsCanAddItem():boolean{
        if(this.nextLv && this.nextLv.BreakItem && this.nextLv.BreakItem.length){
            let curExp = this.roleData.experience + this.selectExp;
            if(curExp >= this.stdRoleLv.Exp){
                MsgPanel.Show("经验已溢出，无法继续添加");
                return false;
            }
        }
        return true;
    }
    private resetSelect():void{
        let nexExp:number = CfgMgr.GetRoleTargetLevelMaxExp(this.roleData.type, this.roleData.level, Math.max(this.curLvNum, this.roleData.level + 1));
        //当前已有足够升级经验无需再添加物品
        if(this.roleData.experience > nexExp){
            this.updateItem();
        }else{
            let items:SPlayerDataItem[] = PlayerData.GetItemTypeDatas(ItemType.exp);
            let offsetVal:number = nexExp - this.roleData.experience;
            this.datas = [];
            this.selectDatas = [];
            this.selectExp = 0;
            let stdItem:StdItem;
            let itemExp:number = 0;
            let selectItem:SPlayerDataItem;
            let haveItem:SPlayerDataItem;
            for (const itemData of items) {
                stdItem = CfgMgr.Getitem(itemData.id);
                if(itemExp < offsetVal){
                    let countNum:number = 0;
                    for (let index = 0; index < itemData.count; index++) {
                        itemExp += stdItem.ItemEffect1;
                        countNum ++;
                        if(itemExp >= offsetVal){
                            break;
                        }
                    }
                    selectItem = {id:itemData.id, count:countNum};
                    this.selectDatas.push(selectItem);
                    haveItem = {id:itemData.id, count:itemData.count - countNum};
                    this.datas.push(haveItem);
                   
                }else{
                    haveItem = {id:itemData.id, count:itemData.count};
                    this.datas.push(haveItem);
                }
            }
            this.selectExp = itemExp;
            this.setItemData(this.haveItemLits, this.datas);
            this.setItemData(this.consumeItemLits, this.selectDatas);
        }
        this.updateShow();
    }
    private setItemData(list:AutoScroller, datas:SPlayerDataItem[]):void{
        list.UpdateDatas(datas);
        list.ScrollToHead(0);
    }
    private updateItem():void{
       let items:SPlayerDataItem[] = PlayerData.GetItemTypeDatas(ItemType.exp);
       this.datas = [];
       this.selectDatas = [];
       this.selectExp = 0;
       for (let item of items) {
            let newItem:SPlayerDataItem = {id: item.id, count:item.count};
            this.datas.push(newItem);
       }
       this.noneItemLab.node.active = !items || items.length < 1;
       this.setItemData(this.haveItemLits, this.datas);
       this.setItemData(this.consumeItemLits, this.selectDatas);
    }
    protected updateHaveItemLits(item:Node, data: SPlayerDataItem) {
        let awardItem = item.getComponent(AwardItem);
        if (!awardItem) awardItem = item.addComponent(AwardItem);
        let stdItem:StdItem = CfgMgr.Getitem(data.id);
        
        awardItem.SetData({itemData:data});
        
    }
    protected updateConsumeItemLits(item:Node, data: SPlayerDataItem) {
        let awardItem = item.getComponent(AwardItem);
        if (!awardItem) awardItem = item.addComponent(AwardItem);
        let stdItem:StdItem = CfgMgr.Getitem(data.id);
        
        awardItem.FormatCountCb((num:number)=>{
            return`x${num}`;
        });
        awardItem.SetData({itemData:data});
    }
    protected onHaveItemSelect(index: number, item: Node) {
        let itemData = this.datas[index];
        if (itemData.count < 1){
            MsgPanel.Show("数量不足");
            return;
        }
        if(!this.checkIsCanAddItem()) return;
        
        this.updateSelectList(itemData, 1);
    }
    protected onConsumeItemSelect(index: number, item: Node) {
        let itemData = this.selectDatas[index];
        if (itemData.count < 1){
            MsgPanel.Show("数量不足");
            return;
        }
        this.updateSelectList(itemData, 2);
        
    }
    private updateSelectList(data:SPlayerDataItem, type:number):void{
        let findIndex:number = -1;
        let selectItem:SPlayerDataItem;
        let dataItem:SPlayerDataItem;
        let stdItem:StdItem = CfgMgr.Getitem(data.id);
        if(type == 1){
            for (let index = 0; index < this.selectDatas.length; index++) {
                selectItem = this.selectDatas[index];
                if(selectItem.id == data.id){
                    findIndex = index;
                    selectItem.count ++;
                    this.selectExp += stdItem.ItemEffect1;
                    break;
                }
            }
            if(findIndex < 0){
                let newItem:SPlayerDataItem = {id:data.id, count:1};
                this.selectDatas.push(newItem);
                this.selectExp += stdItem.ItemEffect1;
            }
            for (let index = 0; index < this.datas.length; index++) {
                dataItem = this.datas[index];
                if(dataItem.id == data.id){
                    dataItem.count --;
                    break;
                }
            }
        }else{
            for (let index = 0; index < this.selectDatas.length; index++) {
                selectItem = this.selectDatas[index];
                if(selectItem.id == data.id){
                    findIndex = index;
                    break;
                }
            }
            if(findIndex > -1){
                let oldItem:SPlayerDataItem = this.selectDatas[findIndex];
                oldItem.count --;
                this.selectExp -= stdItem.ItemEffect1;
                if(oldItem.count < 1){
                    this.selectDatas.splice(findIndex, 1);
                }
                for (let index = 0; index < this.datas.length; index++) {
                    dataItem = this.datas[index];
                    if(dataItem.id == data.id){
                        dataItem.count ++;
                        break;
                    }
                }
            } 
        }
        this.setItemData(this.haveItemLits, this.datas);
        this.setItemData(this.consumeItemLits, this.selectDatas);
        this.updateShow();
    }
    set CloseUpgradeContCall(value:Function) {
        this._closeUpgradeContCall = value;
    }
}