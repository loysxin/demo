import { Button, Node, Event, Label, instantiate, Slider, ProgressBar, Sprite, SpriteFrame } from 'cc';
import { Panel } from "../../GameRoot";
import { CfgMgr } from "../../manager/CfgMgr";
import { CountPower, SPlayerDataSoldier } from "../../module/roleModule/PlayerData";
import { SliderValue } from "../BattleModule/BattleData";
import { BattleReadyLogic } from "./BattleReadyLogic";
import { RemoveBtnClick, maxx } from '../../utils/Utils';
import { ResMgr, folder_head_card } from '../../manager/ResMgr';
import { EventMgr, Evt_SoldierAssignment } from '../../manager/EventMgr';
import { AudioMgr, Audio_CommonClick } from '../../manager/AudioMgr';

export class SendOutTroopsPanel extends Panel {
    protected prefab: string = "prefabs/battle/SendOutTroopsPanel";
    public flush(...args: any[]): void {
    }
    protected onHide(...args: any[]): void {
        this.node.getChildByPath("bg/Label").active = false;
    }

    soldiers : SPlayerDataSoldier[];

    private hero2Soldier: Map<number, number>

    private sliders: SliderValue[] = [];

    maxSoldier : number = 0;
    nowSoldier : number = 0;

    item: Node;
    content: Node;
    soliderNumber: Label;

    protected override onLoad(): void {

        this.content = this.node.getChildByPath("bg/ScrollView/view/content");
        this.item = this.node.getChildByPath("bg/Item/chuzhanItem");
        this.soliderNumber = this.node.getChildByPath("bg/number").getComponent(Label)

        this.node.getChildByPath("bg/closeBtn").on(Button.EventType.CLICK, this.onExitClick, this);
        this.node.getChildByPath("bg/exitBtn").on(Button.EventType.CLICK, this.onWithdrawSoldier, this);
        this.node.getChildByPath("bg/saveBtn").on(Button.EventType.CLICK, this.onSaveClick, this);
    }

    protected override onShow(...arg: any[]): void {
        BattleReadyLogic.ins.isInitLineup = false;
        this.hero2Soldier = BattleReadyLogic.ins.GetSoldiers();
        this.maxSoldier = Array.from(this.hero2Soldier.values()).reduce((accumulator, currentValue) => accumulator + currentValue, 0);

        if(BattleReadyLogic.ins.sliders.length > 0)
            this.sliders = BattleReadyLogic.ins.sliders;
        else
        {
            this.sliders = [];
            this.soldiers = BattleReadyLogic.ins.playerSoldiers.slice();
            this.soldiers.sort((a, b) => {
                return b.id - a.id;
            });
    
            let tmpData = new Map<number, number>(this.hero2Soldier);
            
            for (let i = 0; i < this.soldiers.length; i++) {
                let solider = this.soldiers[i];
                let id = this.setTensDigitToZero(solider.id)
                let tmp : SliderValue = {
                    id: solider.id,
                    count: 0,
                    max: 0,
                    index: i,
                    kucun: solider.count
                }
                if (tmpData.has(id)) {
                    let count = tmpData.get(id);
                    tmp.count = count > tmp.kucun ? tmp.kucun : count;
                    tmp.max = tmp.count;
                    tmpData.set(id, count - tmp.count);
                }
                else 
                    continue;
                this.sliders.push(tmp);
            }
        }

        this.nowSoldier = this.sliders.reduce((accumulator, currentValue) => accumulator + currentValue.count, 0);
        this.updateItems();
    }

    private onExitClick(onExitBtnClick: any, arg: this) {
        AudioMgr.PlayOnce(Audio_CommonClick);
        this.Hide();
    }

    private onSaveClick(onSaveBtnClick: any, arg: this) {

        BattleReadyLogic.ins.sliders = this.sliders;
        EventMgr.emit(Evt_SoldierAssignment);
        this.sliders = []
        this.Hide();
    }

    private onWithdrawSoldier(onSaveBtnClick: any, arg: this) {
        
        let tmpData = new Map<number, number>(this.hero2Soldier);
        for (let i = 0; i < this.sliders.length; i++) {
            let slider = this.sliders[i];
            slider.count = 0;
            let id = this.setTensDigitToZero(slider.id)
            if (tmpData.has(id)) {
                let count = tmpData.get(id);
                slider.max = count > slider.kucun ? slider.kucun : count;
            }
            
        }

        this.updateItems();

    }

    protected update(dt: number): void {
        this.nowSoldier = this.sliders.reduce((accumulator, currentValue) => accumulator + currentValue.count, 0);
        this.soliderNumber.string = `${this.nowSoldier}/${this.maxSoldier}`;

        let tatolBattlePower = this.sliders.reduce((accumulator, currentValue) => {
            let battlePower = CountPower(currentValue.id, 1) * currentValue.count;
            return accumulator + battlePower;
        }, 0);
        this.node.getChildByPath("bg/battlePower").getComponent(Label).string = `${Math.floor(tatolBattlePower)}`;
    }

    

    private updateItems()
    {
        let itemCount = this.content.children.length;
        for(let i = itemCount; i < this.sliders.length; i++){
            let item = instantiate(this.item)
            this.content.addChild(item);
        }

        
        if(this.sliders.length <= 0)
        {
            this.node.getChildByPath("bg/Label").active = true;
            this.node.getChildByPath("bg/Label").getComponent(Label).string = CfgMgr.GetText("soldier_1");
        }
        else
            this.node.getChildByPath("bg/Label").active = false;

        this.loadingItems();
    }

    async loadingItems()
    {
        for(let index = 0; index < this.content.children.length; index++)
        {
                let item = this.content.children[index];
                if(index >= this.sliders.length)
                {
                    item.active = false;
                    continue;
                }
                
                item.active = true;
                let input = item.getChildByName("value").getComponent(Label);
                let name = item.getChildByName("name").getComponent(Label);
    
                let slider = item.getChildByName("Slider").getComponent(Slider);
                let bar = item.getChildByName("Slider").getComponent(ProgressBar);
                let config = CfgMgr.GetRole()[this.sliders[index].id];
                name.string = config.Name;
                slider.max = Math.min(this.sliders[index].kucun, this.hero2Soldier.get(this.setTensDigitToZero(config.RoleType)));
                slider.value = this.sliders[index].count;
                slider.index = index;
                slider.progress = slider.value / slider.max;
                bar.progress = slider.progress;
                input.string = slider.value.toString();
                slider.inputNode = input;
    
                let addBtn = item.getChildByName("addBtn");
                addBtn.off(Button.EventType.CLICK);
                addBtn.on(Button.EventType.CLICK, ()=>{
                    slider.progress = Math.min(1, (slider.value + 1) / slider.max);
                    this.onSliderChange(slider);
                }, this);
    
                let jianBtn = item.getChildByName("jianBtn");
                jianBtn.off(Button.EventType.CLICK);
                jianBtn.on(Button.EventType.CLICK, ()=>{
                    slider.progress = Math.max(0, (slider.value - 1) / slider.max);
                    this.onSliderChange(slider);
                }, this);
    
                slider.node.off('slide');
                slider.node.on('slide', ()=>{ this.onSliderChange(slider)}, this);
                item.getChildByName("text").getComponent(Label).string = `/${slider.max}`;
                item.getChildByPath("head/icon").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub(folder_head_card+`${config.Icon}/spriteFrame`, SpriteFrame);
        
            }

    }


    private onSliderChange(slider: Slider) {
        let sliderData = this.sliders[slider.index];
        let nowValue = Math.round(slider.progress *  slider.max);
        if(nowValue > sliderData.max) nowValue = sliderData.max;
        slider.inputNode.string = nowValue.toString();
        sliderData.count = nowValue;
        this.changeSliderMax(sliderData);
    
        slider.value = nowValue;
    
        slider.progress = slider.value / slider.max;

        slider.node.getComponent(ProgressBar).progress = slider.progress;
    }

    private changeSliderMax(slider: SliderValue)
    {
        let baseId = this.setTensDigitToZero(slider.id);
        let maxCount = this.hero2Soldier.get(baseId);
        let tmpData = this.sliders.filter(s => this.setTensDigitToZero(s.id) === this.setTensDigitToZero(slider.id));
        maxCount -= tmpData.reduce((accumulator, currentValue) => accumulator + currentValue.count, 0);;
        
        tmpData.forEach(s => {
            if(s.id != slider.id)
            {
                let add = maxCount > s.kucun - s.count ? s.kucun - s.count : maxCount;
                s.max = s.count + add;
                //maxCount -= add;
            };
        })

    }

    private setTensDigitToZero(num: number): number {
        const hundredsAndAbove = Math.floor(num / 100);
        const ones = num % 10;
        return hundredsAndAbove * 100 + ones;
    }

}




