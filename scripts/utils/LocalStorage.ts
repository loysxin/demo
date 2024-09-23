import { sys } from "cc";

/**
 * 本地存储二次封装
 */
export default class LocalStorage {

    /**
     * 存储布尔值 
     */
    public static SetBool(cusKey: string, cusValue: boolean) {
        sys.localStorage.setItem(cusKey, cusValue.toString());
    }

    /**
     * 获取布尔值 
     */
    public static GetBool(cusKey: string, cusDefault: boolean = false): boolean {
        const _value = sys.localStorage.getItem(cusKey);
        if (_value) {
            return _value == "true" ? true : false;
        }
        else {
            return cusDefault
        }
    }

    /**
     * 存储Number 
     */
    public static SetNumber(cusKey: string, cusValue: number) {
        sys.localStorage.setItem(cusKey, cusValue.toString());
    }


    /**
     * 获取Number 
     */
    public static GetNumber(cusKey: string, cusDefault: number = 0): number {
        const _value = sys.localStorage.getItem(cusKey);
        if (_value) {
            return Number(_value);
        }
        return cusDefault
    }

    /**
     * 存储字符串 
     */
    public static SetString(cusKey: string, cusValue: string) {
        sys.localStorage.setItem(cusKey, cusValue);
    }

    /**
     * 获取字符串 
     */
    public static GetString(cusKey: string, def: string = ""): string {
        const _value = sys.localStorage.getItem(cusKey);
        if (_value) {
            return _value;
        }
        return def;
    }

    /**
     * 存储Object 
     */
    public static SetObject(cusKey: string, cusValue: Object) {
        sys.localStorage.setItem(cusKey, JSON.stringify(cusValue));
        return cusValue
    }

    /**
     * 获取Object 
     */
    public static GetObject(cusKey: string, cusDefault = null): any {
        const _value = sys.localStorage.getItem(cusKey);
        if (_value) {
            return JSON.parse(_value)
        }
        return cusDefault
    }
    /**
     * 设置玩家数据
     * @param playerId 
     * @param key 
     * @param data 
     */
    public static SetPlayerData(playerId:string, key:string, data:any):void{
        let value = this.GetObject(playerId);
        if(!value){
            value = {};
        }
        value[key] = data; 
        this.SetObject(playerId, value);
    }
    /**
     * 获取玩家数据
     * @param playerId 
     * @param key 属性名
     */
    public static GetPlayerData(playerId:string, key:string):any{
        let value = this.GetObject(playerId);
        return value ? value[key] : null; 
    }

    public static RemoveItem(cusKey: string) {
        sys.localStorage.removeItem(cusKey);
    }

    public static Clear() {
        sys.localStorage.clear();
    }

}