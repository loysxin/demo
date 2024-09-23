import { Node, Rect, Sprite, SpriteFrame, UITransform, sp } from "cc";
import { ResMgr } from "../../../manager/ResMgr";
import { EventMgr, Evt_Map_Tile_Complete } from "../../../manager/EventMgr";
import { Second } from "../../../utils/Utils";

export class Tile extends Node {

    private static version: number = 0;
    private static loadnum: number = 0;

    protected seed = 0;
    protected loading = false;
    protected url: string;
    protected sprite: Sprite;
    private trans: UITransform;
    private wide = 512;
    loop = 0;

    Init(url: string, x: number, y: number, wide: number) {
        if (!this.sprite) this.sprite = this.addComponent(Sprite);
        if (this.url != url) {
            this.url = url;
            if (this.loading) this.seed++;
            this.loading = false;
            this.sprite.spriteFrame = undefined;
        }
        this.setPosition(x, y);
        this.wide = wide;
        this.getComponent(UITransform).setContentSize(this.wide, this.wide);
        this.on(Node.EventType.PARENT_CHANGED, this.onParentChange, this);
    }

    protected onParentChange() {

    }

    async Load() {
        this.active = true;
        if (!this.loading) {
            this.loading = true;
            let v = Tile.version;
            let seed = ++this.seed;
            this.sprite.spriteFrame = undefined;
            let url = this.url.replace(/(\.png)|(\.jpg)/, "");
            Tile.loadnum++;
            // console.log("tile.Load**************", url);
            let res = await ResMgr.LoadResAbSub(url + "/spriteFrame", SpriteFrame);
            if (seed == this.seed) this.sprite.spriteFrame = res;
            this.getComponent(UITransform).setContentSize(this.wide, this.wide);
            if (v != Tile.version) return;
            Tile.loadnum--;
            // console.log("Tile.loadnum***********", Tile.loadnum);
            if (Tile.loadnum <= 0) {
                EventMgr.emit(Evt_Map_Tile_Complete);
            }
        } else {
        }
    }

    Intersects(rect: Rect) {
        if (!this.trans) this.trans = this.getComponent(UITransform);
        return this.trans.getBoundingBox().intersects(rect);
    }

    Reset() {
        this.url = undefined;
        Tile.version++;
        Tile.loadnum = 0;
    }
}
