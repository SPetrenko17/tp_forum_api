'use strict';

import Database from '../database';
import BaseModel from "../Base/BaseModel";
const PQ = require('pg-promise').ParameterizedQuery;

export default new class ForumsModel extends BaseModel{

    constructor() {
        super('forums');
        this._dbContext = Database;
    }

    async createForum(forumData, userData) {
        let result = {
            isSuccess: false,
            message: '',
            data: null
        };
        try {
            const query = new PQ(`INSERT INTO forums (slug, title, owner_id, owner_nickname) 
                VALUES ($1, $2, $3, $4) RETURNING *`,
                [   forumData.slug,
                    forumData.title,
                    userData.user_id,
                    userData.nickname
                ]);

            result.data = await this._dbContext.db.one(query);
            result.isSuccess = true;
        } catch (error) {
            result.message = error.message;
        }
        return result;
    }

    async getForumById(id) {
        try {
            const query = new PQ(`SELECT * FROM forums WHERE forum_id = $1`, [id]);
            return await this._dbContext.db.oneOrNone(query);
        } catch (error) {}
    }

    async getForumBySlug(slug) {
        try {
            const query = new PQ(`SELECT * FROM forums WHERE slug = $1`, [slug]);
            return await this._dbContext.db.oneOrNone(query);
        } catch (error) {}
    }

    async addPostsToForum(id, posts_num) {
        let result = {
            isSuccess: false,
            message: '',
            data: null
        };
        try {
            const query = new PQ(`UPDATE forums SET
                posts = posts + $1
                WHERE forum_id = $2
                `,[posts_num, id]);
            await this._dbContext.db.none(query);
            result.data = '';
            result.isSuccess = true;
        } catch (error) {
            result.message = error.message;
        }
        return result;
    }

    async addThreadsToForum(id, threads_num) {
        let result = {
            isSuccess: false,
            message: '',
            data: null
        };
        if(!threads_num){
            threads_num = 1;
        }
        try {
            const query =
                new PQ(`UPDATE forums SET threads = threads + $1 WHERE forum_id = $2`,
                [   threads_num,
                    id
                ]);
            await this._dbContext.db.none(query);
            result.data = '';
            result.isSuccess = true;
        } catch (error) {
            result.message = error.message;
        }
        return result;
    }

}
