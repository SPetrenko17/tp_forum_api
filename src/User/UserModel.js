import BaseModel from "../Base/BaseModel";
import Database from '../database';

const PQ = require('pg-promise').ParameterizedQuery;
export default new class UsersModel extends BaseModel{


    constructor() {
        super('users');
        this._dbContext = Database
    }


    async createUser(nickname, userData) {
        let result = {
            isSuccess: false,
            message: '',
            data: null
        };
        try {
            const query =
                new PQ(`INSERT INTO users (nickname, about, fullname, email) VALUES ($1, $2, $3, $4) RETURNING *`
                ,[nickname, userData.about, userData.fullname, userData.email]);
            result.data = await this._dbContext.db.one(query);
            result.isSuccess = true;
        } catch (error) {
            result.message = error.message;

        }
        return result;
    }

    async getById(id) {
        try {
            const query = new PQ(`SELECT * FROM users WHERE user_id = $1`, [id]);
            return await this._dbContext.db.oneOrNone(query);
        } catch (error) {}
    }
    async getByNickname(nickname) {
        try {
            const query = new PQ(`SELECT * FROM users WHERE nickname = $1`, [nickname]);
            return await this._dbContext.db.oneOrNone(query);
        } catch (error) {}
    }
    async getByNicknameForPost(nickname) {
        try {
            const query = new PQ(`SELECT user_id, nickname FROM users WHERE nickname = $1`, [nickname]);
            return await this._dbContext.db.oneOrNone(query);
        } catch (error) {}
    }

    async updateUser(nickname, userData) {
        try {
            this._columnSet = new this._dbContext.pgp.helpers.ColumnSet([
                this.validateColumn('nickname'), this.validateColumn('about'),
                this.validateColumn('fullname'), this.validateColumn('email')
            ], {table: 'users'});

            let query = this._dbContext.pgp.helpers.update(userData, this._columnSet,
                null, {emptyUpdate: true});

            if (query === true) {
                return true;
            } else {
                query += ` WHERE \"nickname\" = \'${nickname}\' RETURNING *`;
            }
            return await this._dbContext.db.oneOrNone(query);
        }
        catch (error) {}
    }



    /*
    User
     */
    async getUsersByNicknameOrEmail(nickname, email) {
        try {
            const query = new PQ(`SELECT * FROM users WHERE nickname = $1 OR email = $2`,[nickname, email]);
            return await this._dbContext.db.manyOrNone(query);
        } catch (error) {}
    }

    async getUsersFromForum(forum_id, getParams) {
        try {
            let cond = ``;
            if(getParams.since){
                cond = ' AND nickname ';
                if(getParams.desc){
                    cond += `<`;
                } else{
                    cond += `>`;
                }
                cond+= `\'${getParams.since}\'`;
            }
            cond += ` ORDER BY nickname `;
            if(getParams.desc){
                cond += `DESC`;
            }
            if(getParams.limit){
                cond += ` LIMIT ` + getParams.limit.toString();
            }
            return await this._dbContext.db.manyOrNone(`SELECT forum_id, about, email, fullname, nickname FROM users
            INNER JOIN forum_users USING(user_id) WHERE forum_id = ${forum_id} ${cond}`,[])

        } catch (error) {}
    }




}
