'use strict';

import BaseModel from "../Base/BaseModel";
import Database from '../database';
const PQ = require('pg-promise').ParameterizedQuery;


export default new class PostsModel extends BaseModel{

    constructor() {
        super('posts');
        this._dbContext = Database;
    }


    async createPosts(postsData, thread, users) {
        let result = {
            isSuccess: false,
            message: '',
            data: null
        };
        let createdDatetime = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');


        try {

            let values = '';
            let values2 = '';
            for(let i = 0; i < postsData.length; i++){
                postsData[i]['created'] = createdDatetime;
                // console.log('QUERY123',  postsData[i].parent? postsData[i].parent.toString(): '(((')
                values += `('${users[i].user_id}' , '${users[i].nickname}' , '${thread.forum_id}' , '${thread.forum_slug}' , '${thread.id}' , '${thread.slug}' , '${postsData[i].created}' , '${postsData[i].message}' , ${postsData[i].parent ? postsData[i].parent.toString() : 'null'} ) ${postsData[i+1]? ',': ''}`;
                values2 += `(${thread.forum_id}, ${users[i].user_id} ) ${postsData[i+1]? ',': ''}`;
            }

            const query = new PQ(`INSERT INTO posts (
                author_id, author_nickname, forum_id, forum_slug, thread_id, thread_slug,
                created, message, parent)
                VALUES ${values} RETURNING *`,
                []);
            this.query = query;

            result.data = await this._dbContext.db.manyOrNone(query);

            await this._dbContext.db.manyOrNone(`
            INSERT INTO forum_users (forum_id, user_id)
                VALUES ${values2}
                ON CONFLICT DO NOTHING
                RETURNING *`, []);

            result.isSuccess = true;
        } catch (error) {

             console.log('error catch', error)
            console.log('error query', error.code, this.query)
            if (error.code === '00409') {
                result.message = '409';
                return result;
            } else if (error.code === '23503') {
                result.message = '409';
                return result;
            } else {

                error.message = `${error}`
            }

            result.message = error.message;
        }
        return result;


    }
    async createPost(postData, thread, user) {
        let result = {
            isSuccess: false,
            message: '',
            data: null
        };
        try {
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
                ON CONFLICT DO NOTHING
                RETURNING *`, [thread.forum_id, user.user_id]);

            result.isSuccess = true;
        } catch (error) {
            // console.log('error catch', error)
                if (error.code === '00409') {
                    result.message = '409';
                    return result;
                } else if (error.code === '23503') {
                    result.message = '409';
                    return result;
                }

            result.message = error.message;
        }
        return result;
    }



    async getPostById(id) {
        try {
            const query = new PQ(`SELECT * FROM posts WHERE id = $1`, [id]);
            return await this._dbContext.db.oneOrNone(query);
        } catch (error) {}
    }

    async getPostByThreadId(sort, threadId, getParams){
        switch (sort) {
            case 'tree':
                return await this.getPostsByThreadIdTreeSort(threadId, getParams);
            case 'parent_tree':
                return await this.getPostsByThreadIdParentTreeSort(threadId, getParams);
            default:
                return await this.getPostsByThreadIdFlatSort(threadId, getParams);
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

        } catch (error) {}
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

        } catch (error) {}

    }


    async getPostsByThreadIdParentTreeSort(threadId, getParams) {
        try {
            let subWhereCondition = `WHERE parent IS NULL AND thread_id = ${threadId}`;
            if (getParams.since && getParams.desc) {
                subWhereCondition +=`AND path[1] < (SELECT path[1] FROM posts WHERE id =  ${getParams.since})`;
            } else if (getParams.since && !getParams.desc) {
                subWhereCondition += `AND path[1] > (SELECT path[1] FROM posts WHERE id =  ${getParams.since})`;
            }
            return await this._dbContext.db.manyOrNone(`
                SELECT * FROM posts INNER JOIN
                (SELECT id AS sub_parent_id FROM posts ${subWhereCondition} ORDER BY $1:raw LIMIT $2 ) AS sub 
                ON (thread_id = $3 AND sub.sub_parent_id = path[1]) 
                ORDER BY $4:raw`, [
                (getParams.desc ? 'id DESC ' : 'id ASC'),
                getParams.limit,
                threadId,
                (getParams.desc ? 'sub.sub_parent_id DESC, path ASC' : 'path ASC'),
            ]);
        } catch (error) {}
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
        }
        return result;
    }

}
