'use strict';

import Database from '../database';
export default class BaseModel {

    constructor(modelName) {
        this._name = modelName;
        this._dbContext = Database;
    }

    async getCount() {
        try {
            const items = await this._dbContext.db.one(`SELECT count(*) FROM ${this._name}`);
            this.count = items ? items.count: 1;
        } catch (error) {
        }
    }
    async clearAll() {
        try {
            return await this._dbContext.db.none(`TRUNCATE ${this._name} CASCADE`);
        } catch (error) {}
    }
     validateColumn(column) {
        return {
            name: column,
            skip: function() { return !this[column]}
        };
    }

}
