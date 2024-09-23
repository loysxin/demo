import { _decorator, UITransform, Node, Toggle, Layout, HorizontalTextAlignment, Vec3, sp, path, ScrollView, instantiate, Vec2 } from 'cc';
import { Panel } from '../../GameRoot';
import { SPlayerDataItem, SThing } from '../roleModule/PlayerData';
import { AutoScroller } from '../../utils/AutoScroller';
import { UpdateBagItem } from './BaseUI';
import { BagItem } from '../bag/BagItem';
import { EventMgr, Evt_OpenBoxGetRewardPanel } from '../../manager/EventMgr';
import { ResMgr } from '../../manager/ResMgr';
import { Second } from '../../utils/Utils';
import { AudioMgr, Audio_BoxOpen, Audio_GetReward } from '../../manager/AudioMgr';
import { CfgMgr, ThingItemId, ThingType } from '../../manager/CfgMgr';
import { ItemUtil } from '../../utils/ItemUtils';

export class RewardTips extends Panel {
    protected prefab: string = "prefabs/common/RewardTips";

    private eff_tittle: sp.Skeleton
    private eff_bg: sp.Skeleton
    private eff_box: sp.Skeleton
    private sureBtn: Node;
    protected initW: number;
    protected initH: number;
    protected content: UITransform;
    protected scroller: ScrollView;
    private item: Node;

    private data: (SPlayerDataItem | SThing)[]
    private isShowBox: boolean;
    private callBack: Function;
    private initX:number;
    private initY:number;

    protected onLoad(): void {
        this.sureBtn = this.find(`sureBtn`)
        this.CloseBy(this.sureBtn);
        this.eff_tittle = this.find("eff_tittle", sp.Skeleton);
        this.eff_bg = this.find("eff_bg", sp.Skeleton);
        this.eff_box = this.find("effNode/eff_box", sp.Skeleton);
        this.content = this.find("ScrollView/view/content", UITransform);
        this.initH = this.content.contentSize.height;
        this.scroller = this.find("ScrollView", ScrollView);
        this.item = this.find("ScrollView/view/content/item");
        this.initX = this.sureBtn.position.x;
        this.initY = this.sureBtn.position.y;

        // this.scroller.SetHandle(this.UpdateBagItem.bind(this));  
    }
    protected onShow(): void {
    }
    public async flush(datas: (SPlayerDataItem | SThing)[], isShowBox: boolean = false, callBack?: Function, box_type?:number) {
        console.log("获取奖励弹窗----->");
        if (!this.$hasLoad) await this.initSub;
        this.isShowBox = isShowBox;
        this.eff_tittle.node.active = !isShowBox;
        this.eff_bg.node.active = !isShowBox;
        this.callBack = callBack;
        this.data = this.itemSort(datas);
        if (isShowBox) {
            AudioMgr.PlayOnce(Audio_BoxOpen);
            this.sureBtn.active = false;
            this.eff_box.node.active = true;
            this.eff_box.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/effect", "ui_TreasureChest_" + box_type, "ui_TreasureChest_" + box_type), sp.SkeletonData);
            this.eff_box.setTrackCompleteListener(this.eff_box.setAnimation(0, "Start", false), this.showEffect.bind(this))
        } else {
            this.sureBtn.position = new Vec3(this.initX, this.initY + this.eff_box.getComponent(UITransform).height / 2, 0);
            this.eff_box.node.active = false;
            this.showEffect();
        }
    }

    private showTittleEffect() {
        this.eff_tittle.setAnimation(0, "Loop", true)
    }
    private showBgEffect() {
        this.eff_bg.setAnimation(0, "Loop", true)
    }
    private async showEffect() {
        AudioMgr.PlayOnce(Audio_GetReward);
        this.eff_tittle.node.active = true;
        this.eff_bg.node.active = true;
        this.sureBtn.active = true;
        this.eff_tittle.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/effect", "ui_congratulationstitle", "ui_congratulationstitle"), sp.SkeletonData);
        this.eff_tittle.setAnimation(0, "Start", false)
        this.eff_tittle.setCompleteListener(this.showTittleEffect.bind(this))
        this.eff_bg.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/effect", "ui_emissionlight", "ui_emissionlight"), sp.SkeletonData);
        this.eff_bg.setAnimation(0, "Start", false)
        this.eff_bg.setCompleteListener(this.showBgEffect.bind(this))
        if (this.isShowBox) {
            this.eff_box.setAnimation(0, "Loop", true);
        }
        this.showReward();
    }

    private async showReward() {
        // this.scroller.node.off("scrolling")
        this.content.node.getComponent(Layout).enabled = true;
        if (this.data.length <= 4) {
            this.content.node.getComponent(Layout).type = Layout.Type.HORIZONTAL;
            this.content.node.getComponent(Layout).resizeMode = Layout.ResizeMode.CONTAINER
            this.item.position = new Vec3(this.item.position.x, -274)
        } else {
            this.content.setContentSize(184 * 4, this.initH);
            this.content.node.getComponent(Layout).type = Layout.Type.GRID
            this.content.node.getComponent(Layout).resizeMode = Layout.ResizeMode.CONTAINER
            this.content.node.getComponent(Layout).startAxis = Layout.AxisDirection.HORIZONTAL
            this.item.position = new Vec3(this.item.position.x, -91)
        }
        this.content.node.getComponent(Layout).updateLayout(true);
        this.scroller.content.removeAllChildren();
        for (let i = 0; i < this.data.length; i++) {
            let item = instantiate(this.item);
            this.UpdateBagItem(item, this.data[i]);
            // await Second(0);
            this.scroller.content.addChild(item);
        }
    }

    /**
     * 更新道具item
     * @param item 
     * @param data 
     */
    private async UpdateBagItem(item: Node, data: SPlayerDataItem | SThing) {
        let bagItem = item.getComponent(BagItem);
        if (!bagItem) bagItem = item.addComponent(BagItem);
        bagItem.setIsShowSelect(false);
        bagItem.setIsShowTips(true);
        bagItem.SetData(data);
    }

    /**排序 */
    private itemSort(datas: (SPlayerDataItem | SThing)[]){
        let item_data = []
        if((datas[0] as SPlayerDataItem).id){
            item_data = datas as SPlayerDataItem[];
            item_data.sort((a,b)=>{
                if(a.id){
                    let acfg = CfgMgr.Getitem(a.id)
                    let bcfg = CfgMgr.Getitem(b.id)
                    if(acfg.Quality == bcfg.Quality){
                        return b.id - a.id;
                    }
                    return bcfg.Quality - acfg.Quality;
                }
            })
        }else{
            item_data = datas as SThing[];
            for (let index = 0; index < item_data.length; index++) {
                const element = item_data[index];  
                switch (element.type) {
                    case ThingType.ThingTypeItem:
                        element.sort = CfgMgr.Getitem(element.item.id).Quality
                        break;
                    case ThingType.ThingTypeEquipment: 
                        break;
                    case ThingType.ThingTypeRole:
                        element.sort = element.role.quality
                        break;
                    case ThingType.ThingTypeResource:
                        ItemUtil.resTypeInfo
                        if (element.resource.rock) {
                            element.sort = CfgMgr.Getitem(ThingItemId.ItemId_7).Quality
                        } else if (element.resource.seed) {
                            element.sort = CfgMgr.Getitem(ThingItemId.ItemId_9).Quality
                        } else if (element.resource.water) {
                            element.sort = CfgMgr.Getitem(ThingItemId.ItemId_8).Quality
                        } else if (element.resource.wood) {
                            element.sort = CfgMgr.Getitem(ThingItemId.ItemId_6).Quality
                        }
                        break;
                    case ThingType.ThingTypesFuncValue:
                        element.sort = CfgMgr.Getitem(ThingItemId.ItemId_16).Quality
                        break;
                    case ThingType.ThingTypeCurrency:
                        switch (element.currency.type) {
                            case 0://彩虹体
                            element.sort = CfgMgr.Getitem(ThingItemId.ItemId_1).Quality
                                break;
                            case 2://金币
                            element.sort = CfgMgr.Getitem(ThingItemId.ItemId_2).Quality
                                break;
                            case 3://原石
                                element.sort = CfgMgr.Getitem(ThingItemId.ItemId_3).Quality
                                break;
                        }
                break;
                }
            }
            item_data.sort((a,b)=>{
                return b.sort - a.sort;
            })  
        }
        return item_data;
    }

    protected onHide(...args: any[]): void {
        if (this.callBack) this.callBack();
        if (this.isShowBox) {
            EventMgr.emit(Evt_OpenBoxGetRewardPanel);
        } else {
            this.sureBtn.position = new Vec3(this.initX, this.initY, 0);
        }
        this.eff_tittle.setAnimation(0, "Start", false)
        this.eff_bg.setAnimation(0, "Start", false)
        this.eff_box.setAnimation(0, "Start", false)
        this.content.node.removeAllChildren();
    }
}


