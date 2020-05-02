'use strict';

import Database from '../database';
import BaseModel from "../Base/BaseModel";
// import {validateColumn} from "../utils/utils";

const PQ = require('pg-promise').ParameterizedQuery;


export default new class ThreadsModel extends BaseModel {

    constructor() {
        super('threads')
        this._dbContext = Database
    }

    async createThread(threadData, user, forum) {

        let result = {
            isSuccess: false,
            message: '',
            data: null
        };
        try {
            const query = new PQ(`INSERT INTO threads (
                slug,
                author_id, author_nickname,
                forum_id, forum_slug, 
                created, title, message) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`);
            query.values = [
                threadData.slug,
                user.user_id, user.nickname,
                forum.forum_id, forum.slug,
                threadData.created, threadData.title, threadData.message];

            result.data = await this._dbContext.db.one(query);

            await this._dbContext.db.oneOrNone(`
            INSERT INTO forum_users (forum_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT ON CONSTRAINT unique_user_in_forum DO NOTHING
                RETURNING *`,
                [forum.forum_id, user.user_id]);

            result.isSuccess = true;
        } catch (error) {
            result.message = error.message;
            console.log('ERROR: ', error.message);

        }
        return result;
    }

    async get(type, value) {
        try {
            const query = new PQ(`SELECT * FROM threads WHERE ${type} = $1`, [value]);
            return await this._dbContext.db.oneOrNone(query);
        } catch (error) {
            console.log('ERROR: ', error.message);

        }
    }

    async updateThread(id, threadData) {
        try {
            this.columnSet = new this._dbContext.pgp.helpers.ColumnSet(
                [this.validateColumn('message'), this.validateColumn('title')],
                {table: 'threads'});

            let query = this._dbContext.pgp.helpers.update(threadData, this.columnSet,
                null, {emptyUpdate: true});
            if (query === true) {
                return true;
            } else {
                query += ` WHERE id = ${id} RETURNING *`;
            }
            return await this._dbContext.db.oneOrNone(query);
        }
        catch (error) {
            console.log('ERROR: ', error.message);

        }
    }


    async getThreadsByForumSlug(getParams) {
        try {
            let cond = "WHERE forum_slug = \'" + getParams.slug + "\'";
            if(getParams.since){
                if(getParams.desc){
                    cond += " AND created <= \'" +getParams.since +"\'"
                } else if(!getParams.desc){
                    cond += " AND created >= \'" +getParams.since +"\'"
                }
            }
            cond += ` ORDER BY `;
            if(getParams.desc){
                cond += ` created DESC `
            }else if(!getParams.desc){
                cond += ` created ASC `
            }
            cond += ` LIMIT ${getParams.limit} `;
            return await this._dbContext.db.manyOrNone(`SELECT * FROM threads `+ cond.toString());
        } catch (error) {
            console.log('ERROR: ', error.message);
        }
    }

    async updateThreadVotes(thread, voiceValue) {
        let result = {
            isSuccess: false,
            message: '',
            data: null
        };
        try {
            const query = new PQ(`UPDATE threads SET 
                votes = votes + $1
                WHERE id = $2
                RETURNING *`, [voiceValue, thread.id]);
            result.data = await this._dbContext.db.one(query);
            result.isSuccess = true;
        } catch (error) {
            result.message = error.message;

        }
        return result;
    }

}
