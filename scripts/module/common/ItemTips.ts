import { Button, Label, Node, RichText, Sprite, SpriteFrame, UITransform, Widget, path } from "cc";
import { Panel } from "../../GameRoot";
import { SPlayerDataItem, SPlayerDataSkill, SThing } from "../roleModule/PlayerData";
import { CardQuality, CfgMgr, Fetch, StdActiveSkill, StdItem, ThingItemId, ThingType } from "../../manager/CfgMgr";
import { ResMgr, folder_icon, folder_item, folder_quality, folder_skill } from "../../manager/ResMgr";
import { AutoScroller } from "../../utils/AutoScroller";
import { Goto } from "../../manager/EventMgr";


export class ItemTips extends Panel {
    protected prefab: string = "prefabs/common/ItemTips";
    private bg: Sprite;
    private icon: Sprite;
    private nameLab: Label;
    private cd_time: Label;
    private tipsLab: RichText;
    private getNode:Node;
    private ScrollView: AutoScroller;

    private cont:Node
    protected onLoad() {
        this.cont = this.find("cont");
        this.bg = this.find("cont/bg").getComponent(Sprite);
        this.icon = this.find("cont/bg/icon").getComponent(Sprite);
        this.nameLab = this.find("cont/nameLab").getComponent(Label);
        this.cd_time = this.find("cont/cd_time").getComponent(Label);
        this.tipsLab = this.find("cont/layout/tipsNode/tipsLab").getComponent(RichText);
        this.getNode = this.find("cont/layout/getNode");
        this.ScrollView = this.find("cont/layout/getNode/ScrollView").getComponent(AutoScroller);
        this.ScrollView.SetHandle(this.updateItem.bind(this));
        this.CloseBy("mask");

    }

    static ShowHideNode(data: SThing | SPlayerDataItem | StdItem) {
        this.Show(data, false);
    }

    protected onShow(): void {

    }
    public async flush(data: SThing | SPlayerDataItem | StdItem, is_show_getNode:boolean = true): Promise<void> {
        if (!this.$hasLoad) await this.initSub;
        let std_item: StdItem
        if(data["Items"] != undefined){
            std_item = data as StdItem;
        }else if(data["id"] != undefined){
            std_item = CfgMgr.Getitem((data as SPlayerDataItem).id);
        }else{
            let _data = data as SThing
            if (_data.item) {
                std_item = CfgMgr.Getitem(_data.item.id);
            } else if (_data.resource) {
                if (_data.resource.rock) {
                    std_item = CfgMgr.Getitem(ThingItemId.ItemId_7);
                } else if (_data.resource.seed) {
                    std_item = CfgMgr.Getitem(ThingItemId.ItemId_9);
                } else if (_data.resource.water) {
                    std_item = CfgMgr.Getitem(ThingItemId.ItemId_8);
                } else if (_data.resource.wood) {
                    std_item = CfgMgr.Getitem(ThingItemId.ItemId_6);
                }
            }else if(_data.currency){
                switch (_data.currency.type) {
                    case 0://彩虹体
                    std_item = CfgMgr.Getitem(ThingItemId.ItemId_1);
                        break;
                    case 2://金币
                    std_item = CfgMgr.Getitem(ThingItemId.ItemId_2);
                        break;
                    case 3://原石
                    std_item = CfgMgr.Getitem(ThingItemId.ItemId_3);
                        break;

                }
            }else if(_data.gold){
                std_item = CfgMgr.Getitem(ThingItemId.ItemId_2);
            }else if(_data.gemstone){
                std_item = CfgMgr.Getitem(ThingItemId.ItemId_3);
            }
        }
        
        if (!std_item) return;
        this.nameLab.string = std_item.ItemName;
        this.cd_time.string = std_item.LockTime + "";
        this.tipsLab.string = std_item.Remark + "";
        this.bg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, CardQuality[std_item.Quality] + "_bag_bg", "spriteFrame"), SpriteFrame);
        this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_item, std_item.Icon, "spriteFrame"), SpriteFrame);
        if(is_show_getNode){
            this.getNode.active = true;
            this.cont.getComponent(UITransform).height = 709;
            if (std_item.SkipGet && std_item.SkipGet.length > 0) {
                let datas: Fetch[] = [];
                for (let index = 0; index < std_item.SkipGet.length; index++) {
                    let data = CfgMgr.GetFetchData(std_item.SkipGet[index]);
                    datas.push(data);
                }
                this.ScrollView.UpdateDatas(datas);
            }
        }else{
            this.getNode.active = false;
            this.cont.getComponent(UITransform).height = 709 - 300;
        }
        this.cont.children.forEach((node) => {
            if (node.getComponent(Widget)) {
                node.getComponent(Widget).updateAlignment();
            }
        })
    }


    private updateItem(item: Node, data: Fetch, index: number,) {
        if(data && data.Desc && data.Win){
            item.getChildByName("descLab").getComponent(RichText).string = data.Desc;
            let btn = item.getChildByName("btn_go")
            btn.off("click",)
            btn.on("click", ()=>{
                if(data.Win == "ResourcesPanel" || data.Win == "JidiPanel" || data.Win == "SoldierProductionPanel"){
                    this.closeOther();
                }
                Goto(data.Win, ...data.Param);
                this.Hide()}, this)
        }
    }

    protected onHide(...args: any[]): void {
    }
}