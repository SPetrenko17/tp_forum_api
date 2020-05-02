'use strict';

import BaseModel from "../Base/BaseModel";
import Database from '../database';
const PQ = require('pg-promise').ParameterizedQuery;


export default new class PostsModel extends BaseModel{

    constructor() {
        super('posts');
        this._dbContext = Database;
    }

    async createPost(postData, thread, user) {
        let result = {
            isSuccess: false,
            message: '',
            data: null
        };
        try {
            if (postData.parent) {
                const query = new PQ(`SELECT id FROM posts WHERE id = $1 AND thread_id = $2`,
                    [postData.parent, thread.id]);
                let parentResult = await this._dbContext.db.oneOrNone(query);
                if (!parentResult) {
                    result.message = '409';
                    return result;
                }
            }
            const query = new PQ(`INSERT INTO posts (
                author_id, author_nickname, forum_id, forum_slug, thread_id, thread_slug,
                created, message, parent)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [user.user_id, user.nickname, thread.forum_id, thread.forum_slug,
                    thread.id, thread.slug, postData.created, postData.message,
                    postData.parent ? postData.parent : null,]);

            result.data = await this._dbContext.db.one(query);

            await this._dbContext.db.oneOrNone(`
            INSERT INTO forum_users (forum_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT ON CONSTRAINT unique_user_in_forum DO NOTHING
                RETURNING *`, [thread.forum_id, user.user_id]);

            result.isSuccess = true;
        } catch (error) {
            result.message = error.message;
            console.log('ERROR: ', error.message);
        }
        return result;
    }



    async getPostById(id) {
        try {
            const query = new PQ(`SELECT * FROM posts WHERE id = $1`, [id]);
            return await this._dbContext.db.oneOrNone(query);
        } catch (error) {
            console.log('ERROR: ', error.message);
        }
    }

    async getPostsByThreadIdFlatSort(threadId, getParams) {
        try {
            let cond = '';
            if(getParams.since){
                cond += ` AND id `;
                if (getParams.desc){
                    cond += ` < `;
                } else{
                    cond += ` > `;
                }
                cond += ` ${getParams.since} `;
            }
            cond += ` ORDER BY id `;
            if(getParams.desc){
                cond += ' DESC '
            }
            if(getParams.limit){
                cond += ` LIMIT ${getParams.limit} `
            }
            return await this._dbContext.db.manyOrNone(`SELECT * FROM posts WHERE thread_id = ${threadId} ${cond}`, []);

        } catch (error) {
            console.log('ERROR: ', error.message);
        }
    }

    async getPostsByThreadIdTreeSort(threadId, getParams) {
        try {

            let cond = ``;

            if(getParams.since){
                cond += ` WHERE thread_id = ${threadId} AND path `;
                if (getParams.desc){
                    cond += ` < `;
                } else{
                    cond += ` > `;
                }
                cond += `(SELECT path FROM posts WHERE id = ${getParams.since}) `;
            } else{
                cond += ` WHERE thread_id = ${threadId} `
            }
            cond += `ORDER BY `;
            if(getParams.desc){
                cond += ` path DESC `
            } else{
                cond += ` path ASC `
            }
            if(getParams.limit){
                cond += ` LIMIT ${getParams.limit}`
            }

            return await this._dbContext.db.manyOrNone(`SELECT * FROM posts ${cond}`);

        } catch (error) {
            console.log('ERROR: ', error.message);
        }
    }


    async getPostsByThreadIdParentTreeSort(threadId, getParams) {
        try {
            let subWhereCondition;
            if (getParams.since && getParams.desc) {
                subWhereCondition = this._dbContext.pgp.as.format(` WHERE parent IS NULL 
                AND thread_id = $1  
                AND path[1] < (SELECT path[1] FROM posts WHERE id =  $2) `,
                    [threadId, getParams.since]);
            } else if (getParams.since && !getParams.desc) {
                subWhereCondition = this._dbContext.pgp.as.format(` WHERE parent IS NULL 
                AND thread_id = $1  
                AND path[1] > (SELECT path[1] FROM posts WHERE id =  $2) `,
                    [threadId, getParams.since]);
            } else {
                subWhereCondition = this._dbContext.pgp.as.format(` WHERE parent IS NULL 
                AND thread_id = $1  `, [threadId]);
            }
            return await this._dbContext.db.manyOrNone(`
                SELECT * FROM posts JOIN
                (SELECT id AS sub_parent_id FROM posts $1:raw ORDER BY $5:raw LIMIT $4 ) AS sub 
                ON (thread_id = $2 AND sub.sub_parent_id = path[1]) 
                ORDER BY $3:raw`, [
                subWhereCondition.toString(),
                threadId,
                (getParams.desc ? 'sub.sub_parent_id DESC, path ASC' : 'path ASC'),
                getParams.limit,
                (getParams.desc ? 'id DESC ' : 'id ASC'),]);
        } catch (error) {
            console.log('ERROR: ', error.message);
        }
    }


    async updatePost(id, postData) {
        let result = {
            isSuccess: false,
            message: '',
            data: null
        };
        try {
            const query =
                new PQ(`UPDATE posts SET message = $1, isEdited = True WHERE id = $2 RETURNING *`,
                [postData.message, id]);

            result.data = await this._dbContext.db.one(query);
            result.isSuccess = true;
        } catch (error) {
            result.message = error.message;
            console.log('ERROR: ', error.message || error);
        }
        return result;
    }

}
