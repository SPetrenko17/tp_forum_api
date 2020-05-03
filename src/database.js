'use strict';
const pgPromise = require('pg-promise')({
    capSQL: true
});

const connect = {
    local: {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: ''
    },
    docker: {
        host: 'localhost',
        port: 5432,
        database: 'docker',
        user: 'docker',
        password: 'docker'
    }
};


export default new class Database {
    constructor() {
        this._pgp = pgPromise;
        this._db = pgPromise(connect.local);
    }

    get db() {
        return this._db;
    }

    get pgp() {
        return this._pgp;
    }
}


