import { AssetManager, CCBoolean, CCObject, CCString, Color, Component, Layout, Node, Size, Sprite, SpriteFrame, UITransform, _decorator, path } from "cc";
import { minn } from "./Utils";
import Logger from "./Logger";
const { ccclass, property, disallowMultiple, requireComponent } = _decorator;

/**字体 */
type FontSet = { [key: string | number]: SpriteFrame };
/**字体集 */
let FontSets: { [dir: string]: FontSet } = {};

/**数字 */
const FontNbReg = /[0-9]+/;
const FontSyReg = /[\,\.\+\-\*\/\%\&\$\@\￥]/;
/**富文本 */
const HtmlReg = /\<[^\>]+\>/g;


/**解析字体 */
function createFont(spriteFrames: SpriteFrame[], isNumber: boolean = true) {
    let fontSet = {};
    for (let i = 0; i < spriteFrames.length; i++) {
        let spriteFrame = spriteFrames[i];
        let name = spriteFrame.name.replace("$$$", "");
        //Logger.log("createFont", name, spriteFrame);
        if (isNumber) {
            let result = name.match(FontNbReg);
            if (result && result.length) {
                let key = Number(result[0]);
                if (isNaN(key) == false) {
                    fontSet[key] = spriteFrame;
                    continue;
                }
            }
            result = name.match(FontSyReg);
            if (result && result.length) {
                fontSet[result[0]] = spriteFrame;
            }
        } else {
            fontSet[name] = spriteFrame;
        }
    }
    return fontSet;
}

let seed = 0;
let SpriteLabelPool: SpriteLabel[] = [];
let ChPool: Node[] = [];

/**图片字体 */
@ccclass('SpriteLabel')
@disallowMultiple(true)
@requireComponent(Layout)
export class SpriteLabel extends Component {

    @property({ type: CCBoolean, tooltip: "数字模式会自动识别图片名称头部数字为对应的键值，\n非数字模式则需要保证图片名字为对应字符键值" })
    private isNumber = false;

    @property({ type: CCString, tooltip: "字体集目录路径，如果节点已有图片则会使用此图片目录为字体集目录" })
    private fontFolder = undefined;

    get font() {
        if (!this.fontFolder) return "";
        return this.fontFolder.replace("db://assets/res/", "");
    }
    
    set font(value: string) {
        //Logger.log("set folderUrl", this.hasInit);
        this.fontFolder = value.replace("db://assets/res/", "");
        if (this.hasInit) {
            this.onLoad();
        }else{
            let fontSets = [];
            let folder = this.fontFolder;
            if (FontSets[folder]) {
                fontSets.push(FontSets[folder]);
                this.init(fontSets, []);
                this.string = this.value;
            } else {
                let t = this;
                let ab = AssetManager.instance.getBundle("res");
                ab.loadDir(folder, SpriteFrame, (err: Error, data: SpriteFrame[]) => {
                    let fontSet = createFont(data, t.isNumber);
                    FontSets[folder] = fontSet;
                    fontSets.push(FontSets[folder]);
                    t.init(fontSets, []);
                    t.string = t.value;
                });
            }
        }
    }

    private hasInit = false;
    protected async onLoad() {
        //Logger.log("onLoad " + this.fontFolder);
        let layout = this.getComponent(Layout);
        this.SetLayout(layout.type || Layout.Type.HORIZONTAL);

        let fontSets = [];
        let childern = this.node.children;
        let ab = AssetManager.instance.getBundle("res");
        let styles: { color: string, size: number }[] = [];
        let t = this;
        for (let i = 0; i < childern.length; i++) {
            let child = childern[i];
            let sp = child.getComponent(Sprite);
            //Logger.log(child.name, sp.getComponent(UITransform));
            styles.push({ size: sp.getComponent(UITransform).height / sp.spriteFrame.getOriginalSize().height, color: sp.color.toHEX("#rrggbb") });
            let info: any = ab.getAssetInfo(sp.spriteFrame.uuid);
            if (info && info.path) {
                let url = info.path;
                let ls = url.split(/[\\\/]/);
                ls.pop(); ls.pop();
                url = ls.join("/");
                if (FontSets[url]) {
                    fontSets.push(FontSets[url]);
                } else {
                    await new Promise<void>((resolve, reject) => {
                        ab.loadDir(url, SpriteFrame, (err: Error, data: SpriteFrame[]) => {
                            let fontSet = createFont(data, t.isNumber);
                            FontSets[url] = fontSet;
                            resolve();
                        });
                    })
                    fontSets.push(FontSets[url]);
                }
            }
        }
        if (this.font) {
            let folder = this.font;
            if (FontSets[folder]) {
                fontSets.push(FontSets[folder]);
            } else {
                await new Promise<void>((resolve, reject) => {
                    ab.loadDir(folder, SpriteFrame, (err: Error, data: SpriteFrame[]) => {
                        let fontSet = createFont(data, t.isNumber);
                        FontSets[folder] = fontSet;
                        resolve();
                    });
                })
                fontSets.push(FontSets[folder]);
            }
        }
        this.init(fontSets, styles);
        this.string = this.value;
        this.hasInit = true;
    }

    private _grayscale: boolean = false;
    private fontSet: FontSet[] = [];
    private stylels: { color: string, size: number }[] = [];
    private value: string = "";
    private chs: Sprite[] = [];
    private init(fontsets: FontSet[], styles: { color: string, size: number }[] = []) {
        this._grayscale = false;
        if(this.fontSet)
            this.fontSet.length = 0;
        else
            this.fontSet = [];
        this.fontSet.push(...fontsets);
        this.stylels = styles;
        this.originalSize = 1;
        for (let fontset of fontsets) {
            for (let k in fontset) {
                this.originalSize = Math.max(this.originalSize, fontset[k].getOriginalSize().height);
            }
        }
        if(this.chs)
            this.chs.length = 0;
        else
            this.chs = [];
        if (this.node.children?.length > 0) {
            let children = this.node.children.concat();
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                let sprite = child.getComponent(Sprite);
                if (!sprite) {
                    this.node.removeChild(child);
                } else {
                    if (this.chs.indexOf(sprite) == -1) {
                        this.chs.push(sprite);
                    }
                }
            }
        }
        // this.fontSize = this.size || this.originalSize;
        let layout = this.getComponent(Layout);
        this.SetLayout(layout.type || Layout.Type.HORIZONTAL);
    }

    /**获取字符串内容 */
    get string() {
        return this.value;
    }
    /**设置字符串 */
    set string(value: any) {
        if (value == undefined) {
            console.error(value);
        }
        this.value = value.replace(HtmlReg, "");
        if (!this.fontSet || !this.fontSet.length) return;
        let strs = value.split("");
        let chs = this.chs;
        let i = 0;
        let layout = this.getComponent(Layout);
        let defaultFont = this.fontSet[this.fontSet.length - 1];
        let sy = undefined;
        for (; i < strs.length; i++) {
            let fontset = this.fontSet[i] || defaultFont;
            let ch = chs[i];
            if (ch) {
                ch.node.active = true;
                ch.spriteFrame = fontset[strs[i]];
                // ch.node.setSiblingIndex(i);
            } else {
                let node = ChPool.length > 0 ? ChPool.pop() : new Node();
                ch = node.addComponent(Sprite);
                ch.spriteFrame = fontset[strs[i]];
                ch.sizeMode = Sprite.SizeMode.RAW;
                ch.trim = false;
                chs[i] = ch;
                ch.node.active = true;
                ch.node.layer = this.node.layer;
                this.node.addChild(node);
                // node.setSiblingIndex(i);
            }
            ch.grayscale = this._grayscale;
            let colorValue = this.stylels.length ? this.stylels[minn(i, this.stylels.length - 1)].color || this.colorValue : this.colorValue;
            ch.color = (new Color()).fromHEX(colorValue);
            let scale = this.stylels.length ? this.stylels[minn(i, this.stylels.length - 1)].size || this.sizeScale : this.sizeScale;

            if (ch.spriteFrame) {
                var size = ch.spriteFrame.getOriginalSize();
            } else {
                console.warn("找不到字符图片:" + strs[i]);
                var size = new Size(ch.getComponent(UITransform).width, ch.getComponent(UITransform).height);
            }
            let w = size.width * scale;
            let h = size.height * scale;
            if (sy == undefined) sy = h / 2;
            // Logger.log(ch.name, this.stylels.length, this.sizeScale, scale);
            ch.getComponent(UITransform).setContentSize(w, h);

            let rect = ch.spriteFrame['_rect'];
            let originalSize = ch.spriteFrame['_originalSize'];
            let offsetX = -1 * (originalSize.width / 2 - rect.width / 2);
            //let offsetY = originalSize.height / 2 - rect.height / 2;
            if (!this.stylels[i]) {
                ch.trim = false;
                if (layout.type == Layout.Type.HORIZONTAL) {
                    //ch.node.setPosition(0, offsetY * scale);
                }
            }
        }
        for (; i < this.node.children.length; i++) {
            let child = this.node.children[i];
            child.active = false;
        }
        layout.updateLayout(true);
    }

    /**
     * 设置文本的横纵方向
     * @param type 
     */
    SetLayout(type: 1 | 2 | 3 = 1) {
        let layout = this.getComponent(Layout);
        layout.type = type;
        if (type == Layout.Type.HORIZONTAL) {
            layout.alignHorizontal = false;
            layout.resizeMode = Layout.ResizeMode.CONTAINER;
            layout.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
            layout.affectedByScale = true;
        } else if (type == Layout.Type.VERTICAL) {
            layout.alignVertical = true;
            layout.resizeMode = Layout.ResizeMode.CONTAINER;
            layout.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
            layout.affectedByScale = true;
        } else {
            layout.resizeMode = Layout.ResizeMode.NONE;
            layout.startAxis = Layout.AxisDirection.HORIZONTAL;
            layout.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
            layout.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
        }
        this.string = this.value;
    }

    set grayscale(value: boolean) {
        if (this._grayscale == value) return;
        this._grayscale = value;
        this.string = this.value;
    }
    get grayscale() { return this._grayscale; }

    /**获取横向间隔 */
    get spacingX() {
        let layout = this.getComponent(Layout);
        return layout.spacingX;
    }
    /**设置横向间隔 */
    set spacingX(value: number) {
        let layout = this.getComponent(Layout);
        layout.spacingX = value;
    }

    /**获取纵向间隔 */
    get spacingY() {
        let layout = this.getComponent(Layout);
        return layout.spacingY;
    }
    /**设置纵向间隔 */
    set spacingY(value: number) {
        let layout = this.getComponent(Layout);
        layout.spacingY = value;
    }

    private size: number = 0;
    private originalSize: number = 0;
    private sizeScale: number = 1;
    /**获取字体尺寸 */
    get fontSize() {
        return this.originalSize * this.sizeScale;
    }
    /**设置字体尺寸 */
    set fontSize(value: number) {
        this.size = value;
        if (!this.fontSet || !this.fontSet.length) return;

        this.sizeScale = value / this.originalSize;
        this.string = this.value;
    }

    /**重置所有尺寸 */
    ResetSize(value: number) {
        for (let style of this.stylels) {
            style.size = undefined;
        }
        this.fontSize = value;
    }

    private colorValue = "#ffffff";
    /**获取字体颜色 */
    get color() {
        return this.colorValue;
    }
    /**设置字体颜色 */
    set color(value: string) {
        this.colorValue = value.replace("0x", "#");
        if (this.colorValue.charAt(0) != "#") this.colorValue = "#" + this.colorValue;
        if (!this.fontSet || !this.fontSet.length) return;
        this.string = this.value;
    }
    /**重置所有颜色 */
    ResetColor(value: string, str?: string) {
        for (let style of this.stylels) {
            style.color = undefined;
        }
        this.color = str == undefined ? value : str;
    }
}

