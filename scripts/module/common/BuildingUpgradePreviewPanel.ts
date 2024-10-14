import { instantiate, Sprite, Node, Label, Color, SpriteFrame, path, Button} from "cc";
import { Panel } from "../../GameRoot";
import { AutoScroller } from "../../utils/AutoScroller";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { ItemTips } from "./ItemTips";
import { CfgMgr, StdBuilding } from "../../manager/CfgMgr";
import { DateUtils } from '../../utils/DateUtils';
import { FormatRewards } from "./BaseUI";
import { formatNumber, ToFixed } from "../../utils/Utils";

export class BuildingUpgradePreviewPanel extends Panel {
    protected prefab: string = "prefabs/ui/BuildingUpgradePreviewPanel";

    private buildingItem_scroller: AutoScroller;
    _nowLevel: number;
    _buildingName: string;
    _buildingItem: Node;
    _tittle: Label;


    protected onLoad(): void {
        this.buildingItem_scroller = this.node.getChildByName("ScrollView").getComponent(AutoScroller);
        this.buildingItem_scroller.SetHandle(this.updateLevelItem.bind(this));
        this.node.getChildByName("closeBtn").on(Button.EventType.CLICK, () => {
            this.Hide();
        });
        this._tittle = this.node.getChildByPath("bg/tittle").getComponent(Label);
    }
    protected onShow() {
    }

    public async flush(buildingId: number, level: number, buildingName: string) {
        const buildings = CfgMgr.GetBuildingsById(buildingId);
        const buildingsArray: StdBuilding[] = [];
        this._nowLevel = level;
        this._buildingName = buildingName;
        this._tittle.string = `${this._buildingName}等级预览`;
        for (const level in buildings) {
            if (buildings.hasOwnProperty(level)) {
                buildingsArray.push(buildings[level]);
            }
        }
        
        if(!buildingsArray.length) 
        {
            this.buildingItem_scroller.node.active = false;
            return;
        }
        this.buildingItem_scroller.node.active = true;
        this.buildingItem_scroller.UpdateDatas(buildingsArray);
        let max = buildingsArray.length;
        let nowIndex = this._nowLevel - 1;
        let index = Math.max(0, nowIndex - 1);
        index = Math.min(index, max - 3);

        this.buildingItem_scroller.ScrollToIndex(index);
    }
    protected onHide(...args: any[]): void {

    }

    private async updateLevelItem(item:Node, config: StdBuilding){
        if(!config) return;
        let isNowLevel = config.Level == this._nowLevel;
        let text = item.getChildByName('text').getComponent(Label);
        text.string = `${this._buildingName}  Lv.${config.Level}`;
        text.color = isNowLevel?  new Color().fromHEX("#0F2DC5") : new Color().fromHEX("#2F7387");
        item.getChildByName("nowLevelIcon").active = isNowLevel;
        item.getChildByPath("label/time/value").getComponent(Label).string = DateUtils.FormatTime(config.ConstructDuration, "%{h}时%{m}分%{s}秒");
        //item.getChildByPath("label/caiji/value").getComponent(Label).string = config.AttrValue && config.AttrValue.length > 0 ? `${ToFixed(config.AttrValue[0] * 100)}%` : "0%";
        item.getChildByPath("label/caiji/value").getComponent(Label).string = config.AttrValue && config.AttrValue.length > 0 ? `${ToFixed(config.AttrValue[0])}` : "0"; 

        let point = item.getChildByName("point");
        point.children.forEach((child:Node) => {
            child.active = false;
        })
        let name = isNowLevel ? "now" : config.Level > this._nowLevel ? "future" : "finish";
        name = config.Level == 1 ? name == "finish" ? "oneFinish" : "oneNow" : name;
        point.getChildByName(name).active = true;

         let caiLiaoItemContent = item.getChildByPath("CaiLiaoScrollView/view/content");
        let caiLiaoItem = caiLiaoItemContent.children[0];
        const caiLiaoAttrSubs = FormatRewards(config);
        for(let i = caiLiaoItemContent.children.length; i < caiLiaoAttrSubs.length; i++){
            let child = instantiate(caiLiaoItem);
            child.setPosition(0, 0, 0);
            caiLiaoItemContent.addChild(child);
        }

        for(let i = 0; i < caiLiaoItemContent.children.length; i++){
            let child = caiLiaoItemContent.children[i];
            if(i >= caiLiaoAttrSubs.length){
                child.active = false;
                continue;
            }
            child.active = true;
            child.getChildByName("icon").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(caiLiaoAttrSubs[i].icon, SpriteFrame);
            child.getChildByName("value").getComponent(Label).string = formatNumber(caiLiaoAttrSubs[i].value, 2);
        }

        let jiangLiIitemContent = item.getChildByPath("JiangLIScrollView/view/content");
        const taskConfig = CfgMgr.GetTaskById(config.RewardsPreview);
        if(!config.RewardsPreview || config.RewardsPreview <= 0 || !taskConfig)
        {
            jiangLiIitemContent.active = false;
            return;
        }
        jiangLiIitemContent.active = true;

        const jiangLiAttrSubs = FormatRewards(taskConfig);
        let jiangLiIitem = jiangLiIitemContent.children[0];
        for(let i = jiangLiIitemContent.children.length; i < jiangLiAttrSubs.length; i++){
            let child = instantiate(jiangLiIitem);
            child.setPosition(0, 0, 0);
            jiangLiIitemContent.addChild(child);
        }

        for(let i = 0; i < jiangLiIitemContent.children.length; i++){
            let child = jiangLiIitemContent.children[i];
            if(i >= jiangLiAttrSubs.length){
                child.active = false;
                continue;
            }
            child.active = true;
            if(jiangLiAttrSubs[i].quality)
                child.getChildByName("bg").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(path.join(folder_icon, "quality", jiangLiAttrSubs[i].quality + "_bag_bg", "spriteFrame") , SpriteFrame);
            child.getChildByName("icon").getComponent(Sprite).spriteFrame = await ResMgr.LoadResAbSub<SpriteFrame>(jiangLiAttrSubs[i].icon, SpriteFrame);
            child.getChildByName("count").getComponent(Label).string = jiangLiAttrSubs[i].value.toString();
            child.off(Button.EventType.CLICK);
            child.on(Button.EventType.CLICK, ()=>{ ItemTips.Show(jiangLiAttrSubs[i]) }, this);
        }

    }


    
}


