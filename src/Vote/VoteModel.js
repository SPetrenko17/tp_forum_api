'use strict';

import Database from '../database';
import BaseModel from "../Base/BaseModel";
const PQ = require('pg-promise').ParameterizedQuery;

export default new class VotesModel extends BaseModel{

    constructor() {
        super('votes');
         this._dbContext = Database
    }
    async create(voice, user, thread) {
        let result = {
            isSuccess: false,
            errorCode: '',
            data: null
        };
        try {
            const query = new PQ(`INSERT INTO votes as v 
                (nickname, thread, voice)
                VALUES ($1, $2, $3) 
                ON CONFLICT ON CONSTRAINT unique_vote DO
                UPDATE SET voice = $3 WHERE v.voice <> $3
                RETURNING *, (xmax::text::int > 0) as existed`,[user.nickname, thread.id, voice]);
            result.data = await this._dbContext.db.oneOrNone(query);
            result.isSuccess = true;
        } catch (error) {
            result.errorCode = error.message;
            console.log('ERROR: ', error.message);
        }
        return result;
    }

}
