import { User } from "../../../login/entity/User";
import UserData from "../../../login/entity/UserData";

export default class CurrUserManager {
    private static _instance: CurrUserManager;

    public static getInstance() {
        if (!this._instance) {
            this._instance = new CurrUserManager();
        }
        return this._instance;
    }

    public static getCurrentUserId() : number | -1{
        const user = UserData.get();
        if(user){
            return user.userId;
        }
        return -1;
    }  

    public static getCurrentUser() : User | null{
        const user = UserData.get();
        if(user){
            return user;
        }
        return null;
    }  

    public userInfo: any = null;
}