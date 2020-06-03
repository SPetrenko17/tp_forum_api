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
        //
        // let script = this.sql('./db/drop_and_create.sql');
        //
        // this._db.any(script)
        //     .then(() => {
        //         console.log('db initialized');
        //     })
        //     .catch(error => {
        //             console.error('db is not initialized!');
        //     });
    }

    get db() {
        return this._db;
    }

    get pgp() {
        return this._pgp;
    }
}


