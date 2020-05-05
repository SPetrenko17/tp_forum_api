!function(e){var t={};function a(s){if(t[s])return t[s].exports;var n=t[s]={i:s,l:!1,exports:{}};return e[s].call(n.exports,n,n.exports,a),n.l=!0,n.exports}a.m=e,a.c=t,a.d=function(e,t,s){a.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},a.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},a.t=function(e,t){if(1&t&&(e=a(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(a.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)a.d(s,n,function(t){return e[t]}.bind(null,n));return s},a.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return a.d(t,"a",t),t},a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},a.p="",a(a.s=1)}([function(e,t){e.exports=require("pg-promise")},function(e,t,a){e.exports=a(3)},function(e,t){e.exports=require("fastify")},function(e,t,a){"use strict";a.r(t);const s=a(0)({capSQL:!0}),n={host:"localhost",port:5432,database:"postgres",user:"postgres",password:""};var r=new class{constructor(){this._pgp=s,this._db=s(n)}get db(){return this._db}get pgp(){return this._pgp}};class i{constructor(e){this._name=e,this._dbContext=r}async getCount(){try{const e=await this._dbContext.db.one("SELECT count(*) FROM "+this._name);this.count=e?e.count:1}catch(e){}}async clearAll(){try{return await this._dbContext.db.none(`TRUNCATE ${this._name} CASCADE`)}catch(e){}}validateColumn(e){return{name:e,skip:function(){return!this[e]}}}}const o=a(0).ParameterizedQuery;var d=new class extends i{constructor(){super("users"),this._dbContext=r}async createUser(e,t){let a={isSuccess:!1,message:"",data:null};try{const s=new o("INSERT INTO users (nickname, about, fullname, email) VALUES ($1, $2, $3, $4) RETURNING *",[e,t.about,t.fullname,t.email]);a.data=await this._dbContext.db.one(s),a.isSuccess=!0}catch(e){a.message=e.message}return a}async getById(e){try{const t=new o("SELECT * FROM users WHERE user_id = $1",[e]);return await this._dbContext.db.oneOrNone(t)}catch(e){}}async getByNickname(e){try{const t=new o("SELECT * FROM users WHERE nickname = $1",[e]);return await this._dbContext.db.oneOrNone(t)}catch(e){}}async updateUser(e,t){try{this._columnSet=new this._dbContext.pgp.helpers.ColumnSet([this.validateColumn("nickname"),this.validateColumn("about"),this.validateColumn("fullname"),this.validateColumn("email")],{table:"users"});let a=this._dbContext.pgp.helpers.update(t,this._columnSet,null,{emptyUpdate:!0});return!0===a||(a+=` WHERE "nickname" = '${e}' RETURNING *`,await this._dbContext.db.oneOrNone(a))}catch(e){}}async getUsersByNicknameOrEmail(e,t){try{const a=new o("SELECT * FROM users WHERE nickname = $1 OR email = $2",[e,t]);return await this._dbContext.db.manyOrNone(a)}catch(e){}}async getUsersFromForum(e,t){try{let a="";return t.since&&(a=" AND nickname ",t.desc?a+="<":a+=">",a+=`'${t.since}'`),a+=" ORDER BY nickname ",t.desc&&(a+="DESC"),t.limit&&(a+=" LIMIT "+t.limit.toString()),await this._dbContext.db.manyOrNone(`SELECT forum_id, about, email, fullname, nickname FROM users\n            INNER JOIN forum_users USING(user_id) WHERE forum_id = ${e} ${a}`,[])}catch(e){}}};class u{serialize_one(e){return e}serialize_many(e){return e.length?e.map(e=>this.serialize_one(e)):[]}}var c=new class extends u{serialize_one(e){return e.data}serialize_many(e){return e.length?e.map(e=>this.serialize_one(e)):[]}},l=new class{async createUser(e,t){let a=e.params.nickname,s=e.body,n=await d.getUsersByNicknameOrEmail(a,s.email);if(n.length)return t.code(409).header("Content-Type","application/json; charset=utf-8").send(n);let r=await d.createUser(a,s);r.isSuccess?t.code(201).header("Content-Type","application/json; charset=utf-8").send(c.serialize_one(r)):t.code(500).header("Content-Type","application/json; charset=utf-8").send()}async get(e,t){const a=e.params.nickname;let s=await d.getByNickname(a);if(!s)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find user with nickname "+a});t.header("Content-Type","application/json; charset=utf-8").send(s)}async updateUser(e,t){const a=e.params.nickname;let s=await d.getByNickname(a);if(!s)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find user with nickname "+a});let n=await d.updateUser(a,e.body);if(!n)return t.code(409).header("Content-Type","application/json; charset=utf-8").send({message:"Can't change user with nickname "+a});!0===n?t.header("Content-Type","application/json; charset=utf-8").send(s):t.header("Content-Type","application/json; charset=utf-8").send(n)}};const p=a(0).ParameterizedQuery;var h=new class extends i{constructor(){super("forums"),this._dbContext=r}async createForum(e,t){let a={isSuccess:!1,message:"",data:null};try{const s=new p("INSERT INTO forums (slug, title, owner_id, owner_nickname) \n                VALUES ($1, $2, $3, $4) RETURNING *",[e.slug,e.title,t.user_id,t.nickname]);a.data=await this._dbContext.db.one(s),a.isSuccess=!0}catch(e){a.message=e.message}return a}async getForumById(e){try{const t=new p("SELECT * FROM forums WHERE forum_id = $1",[e]);return await this._dbContext.db.oneOrNone(t)}catch(e){}}async getForumBySlug(e){try{const t=new p("SELECT * FROM forums WHERE slug = $1",[e]);return await this._dbContext.db.oneOrNone(t)}catch(e){}}async addPostsToForum(e,t){let a={isSuccess:!1,message:"",data:null};try{const s=new p("UPDATE forums SET \n                posts = posts + $1\n                WHERE forum_id = $2\n                RETURNING *",[t,e]);a.data=await this._dbContext.db.one(s),a.isSuccess=!0}catch(e){a.message=e.message}return a}async addThreadsToForum(e,t){let a={isSuccess:!1,message:"",data:null};t||(t=1);try{const s=new p("UPDATE forums SET threads = threads + $1 WHERE forum_id = $2 RETURNING *",[t,e]);a.data=await this._dbContext.db.one(s),a.isSuccess=!0}catch(e){a.message=e.message}return a}};const m=a(0).ParameterizedQuery;var g=new class extends i{constructor(){super("threads"),this._dbContext=r}async createThread(e,t,a){let s={isSuccess:!1,message:"",data:null};try{const n=new m("INSERT INTO threads (\n                slug,\n                author_id, author_nickname,\n                forum_id, forum_slug, \n                created, title, message) \n                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",[e.slug,t.user_id,t.nickname,a.forum_id,a.slug,e.created,e.title,e.message]);s.data=await this._dbContext.db.one(n),await this._dbContext.db.oneOrNone("\n            INSERT INTO forum_users (forum_id, user_id)\n                VALUES ($1, $2)\n                ON CONFLICT DO NOTHING\n                RETURNING *",[a.forum_id,t.user_id]),s.isSuccess=!0}catch(e){s.message=e.message}return s}async get(e,t){try{const a=new m(`SELECT * FROM threads WHERE ${e} = $1`,[t]);return await this._dbContext.db.oneOrNone(a)}catch(e){}}async updateThread(e,t){try{this.columnSet=new this._dbContext.pgp.helpers.ColumnSet([this.validateColumn("message"),this.validateColumn("title")],{table:"threads"});let a=this._dbContext.pgp.helpers.update(t,this.columnSet,null,{emptyUpdate:!0});return!0===a||(a+=` WHERE id = ${e} RETURNING *`,await this._dbContext.db.oneOrNone(a))}catch(e){}}async getThreadsByForumSlug(e){try{let t="WHERE forum_slug = '"+e.slug+"'";return e.since&&(e.desc?t+=" AND created <= '"+e.since+"'":e.desc||(t+=" AND created >= '"+e.since+"'")),t+=" ORDER BY ",e.desc?t+=" created DESC ":e.desc||(t+=" created ASC "),t+=` LIMIT ${e.limit} `,await this._dbContext.db.manyOrNone("SELECT * FROM threads "+t.toString())}catch(e){}}async updateThreadVotes(e,t){let a={isSuccess:!1,message:"",data:null};try{const s=new m("UPDATE threads SET \n                votes = votes + $1\n                WHERE id = $2\n                RETURNING *",[t,e.id]);a.data=await this._dbContext.db.one(s),a.isSuccess=!0}catch(e){a.message=e.message}return a}},y=new class extends u{serialize_one(e){return{id:Number(e.id),author:e.author_nickname,slug:e.slug,forum:e.forum_slug,created:e.created,title:e.title,message:e.message,votes:e.votes}}serialize_many(e){return e.length?e.map(e=>this.serialize_one(e)):[]}},_=new class extends u{serialize_one(e,t){switch(t){case"404":return{slug:e.slug,title:e.title,user:e.owner_nickname,posts:e.posts,threads:e.threads};case"409":return{slug:e.slug,title:e.title,user:e.owner_nickname};case"201":default:return{slug:e.data.slug,title:e.data.title,user:e.data.owner_nickname}}}serialize_many(e){return e.length?e.map(e=>this.serialize_one(e)):[]}};function f(e){return!!/^\d+$/.test(e)}var C=new class{async createForum(e,t){let a=e.body,s=a.user,n=await d.getByNickname(s);if(!n)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find user with nickname "+s});let r=await h.getForumBySlug(a.slug);if(r)return t.code(409).header("Content-Type","application/json; charset=utf-8").send(_.serialize_one(r,"409"));let i=await h.createForum(a,n);i.isSuccess?t.code(201).header("Content-Type","application/json; charset=utf-8").send(_.serialize_one(i,"201")):t.code(500).header("Content-Type","application/json; charset=utf-8").send()}async GetRequestGetForumDetails(e,t){let a=e.params.slug,s=await h.getForumBySlug(a);if(!s)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find forum with slug "+a});t.header("Content-Type","application/json; charset=utf-8").send(_.serialize_one(s,"404"))}async PostRequestCreateThreadsForForum(e,t){let a=e.body,s=a.author,n=e.params.slug;if(f(n))return t.code(400).header("Content-Type","application/json; charset=utf-8").send({message:"Slug can not contain only digits "});let r=await d.getByNickname(s);if(!r)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find user with nickname "+s});let i=await g.get("slug",a.slug);if(i)return t.code(409).header("Content-Type","application/json; charset=utf-8").send(y.serialize_one(i));let o=await h.getForumBySlug(n);if(!o)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find forum with slug "+n});let u=await g.createThread(a,r,o);if(u.isSuccess){return(await h.addThreadsToForum(u.data.forum_id)).isSuccess?t.code(201).header("Content-Type","application/json; charset=utf-8").send(y.serialize_one(u.data)):t.code(500).header("Content-Type","application/json; charset=utf-8").send()}return t.code(500).header("Content-Type","application/json; charset=utf-8").send()}async GetRequestGetForumThreads(e,t){const a={desc:"true"===e.query.desc,limit:e.query.limit?Number(e.query.limit):100,since:e.query.since,slug:e.params.slug};if(!await h.getForumBySlug(a.slug))return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find forum with slug "+a.slug});let s=await g.getThreadsByForumSlug(a);t.header("Content-Type","application/json; charset=utf-8").send(y.serialize_many(s))}async GetRequestGetForumUsers(e,t){const a={desc:"true"===e.query.desc,limit:e.query.limit?Number(e.query.limit):100,since:e.query.since,slug:e.params.slug},s=await h.getForumBySlug(a.slug);if(!s)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find forum with slug "+a.slug});const n=await d.getUsersFromForum(s.forum_id,a);t.header("Content-Type","application/json; charset=utf-8").send(n)}};const T=a(0).ParameterizedQuery;var w=new class extends i{constructor(){super("posts"),this._dbContext=r}async createPost(e,t,a){let s={isSuccess:!1,message:"",data:null};try{if(e.parent){const a=new T("SELECT id FROM posts WHERE id = $1 AND thread_id = $2",[e.parent,t.id]);if(!await this._dbContext.db.oneOrNone(a))return s.message="409",s}const n=new T("INSERT INTO posts (\n                author_id, author_nickname, forum_id, forum_slug, thread_id, thread_slug,\n                created, message, parent)\n                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING * ",[a.user_id,a.nickname,t.forum_id,t.forum_slug,t.id,t.slug,e.created,e.message,e.parent?e.parent:null]);s.data=await this._dbContext.db.one(n),await this._dbContext.db.oneOrNone("\n            INSERT INTO forum_users (forum_id, user_id)\n                VALUES ($1, $2)\n                ON CONFLICT DO NOTHING\n                 ",[t.forum_id,a.user_id]),s.isSuccess=!0}catch(e){s.message=e.message}return s}async getPostById(e){try{const t=new T("SELECT * FROM posts WHERE id = $1",[e]);return await this._dbContext.db.oneOrNone(t)}catch(e){}}async getPostByThreadId(e,t,a){switch(e){case"tree":return await this.getPostsByThreadIdTreeSort(t,a);case"parent_tree":return await this.getPostsByThreadIdParentTreeSort(t,a);default:return await this.getPostsByThreadIdFlatSort(t,a)}}async getPostsByThreadIdFlatSort(e,t){try{let a="";return t.since&&(a+=" AND id ",t.desc?a+=" < ":a+=" > ",a+=` ${t.since} `),a+=" ORDER BY id ",t.desc&&(a+=" DESC "),t.limit&&(a+=` LIMIT ${t.limit} `),await this._dbContext.db.manyOrNone(`SELECT * FROM posts WHERE thread_id = ${e} ${a}`,[])}catch(e){}}async getPostsByThreadIdTreeSort(e,t){try{let a="";return t.since?(a+=` WHERE thread_id = ${e} AND path `,t.desc?a+=" < ":a+=" > ",a+=`(SELECT path FROM posts WHERE id = ${t.since}) `):a+=` WHERE thread_id = ${e} `,a+="ORDER BY ",t.desc?a+=" path DESC ":a+=" path ASC ",t.limit&&(a+=" LIMIT "+t.limit),await this._dbContext.db.manyOrNone("SELECT * FROM posts "+a)}catch(e){}}async getPostsByThreadIdParentTreeSort(e,t){try{let a="WHERE parent IS NULL AND thread_id = "+e;return t.since&&t.desc?a+=`AND path[1] < (SELECT path[1] FROM posts WHERE id =  ${t.since})`:t.since&&!t.desc&&(a+=`AND path[1] > (SELECT path[1] FROM posts WHERE id =  ${t.since})`),await this._dbContext.db.manyOrNone(`\n                SELECT * FROM posts INNER JOIN\n                (SELECT id AS sub_parent_id FROM posts ${a} ORDER BY $1:raw LIMIT $2 ) AS sub \n                ON (thread_id = $3 AND sub.sub_parent_id = path[1]) \n                ORDER BY $4:raw`,[t.desc?"id DESC ":"id ASC",t.limit,e,t.desc?"sub.sub_parent_id DESC, path ASC":"path ASC"])}catch(e){}}async updatePost(e,t){let a={isSuccess:!1,message:"",data:null};try{const s=new T("UPDATE posts SET message = $1, isEdited = True WHERE id = $2 RETURNING *",[t.message,e]);a.data=await this._dbContext.db.one(s),a.isSuccess=!0}catch(e){a.message=e.message}return a}},E=new class extends u{serialize_one(e){let t={id:Number(e.id),author:e.author_nickname,forum:e.forum_slug,thread:Number(e.thread_id),isEdited:e.isedited,created:e.created,message:e.message};return e.parent!==e.id&&(t.parent=Number(e.parent),t.path=e.path),t}serialize_many(e){return e.length?e.map(e=>this.serialize_one(e)):[]}},b=new class{async GetRequestPostDetails(e,t){const a=e.params.id,s=await w.getPostById(a);if(!s)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:`Can't find post with id #${a}\n`});let n={};if(n.post=E.serialize_one(s),e.query.related){const t=e.query.related.split(",");t.includes("user")&&(n.author=await d.getById(s.author_id)),t.includes("thread")&&(n.thread=y.serialize_one(await g.get("id",s.thread_id))),t.includes("forum")&&(n.forum=await h.getForumById(s.forum_id),n.forum.user=n.forum.owner_nickname)}t.header("Content-Type","application/json; charset=utf-8").send(n)}async PostRequestPostDetails(e,t){const a=e.params.id,s=await w.getPostById(a);if(!s)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find post with id "+a});if(!e.body.message)return t.header("Content-Type","application/json; charset=utf-8").send(E.serialize_one(s));if(e.body.message===s.message)return t.header("Content-Type","application/json; charset=utf-8").send(E.serialize_one(s));let n=await w.updatePost(a,e.body);return n.isSuccess?t.header("Content-Type","application/json; charset=utf-8").send(E.serialize_one(n.data)):t.code(500).header("Content-Type","application/json; charset=utf-8").send({message:"Can't change post with id "+a})}};const N=a(0).ParameterizedQuery;var S=new class extends i{constructor(){super("votes"),this._dbContext=r}async create(e,t,a){let s={isSuccess:!1,errorCode:"",data:null};try{const n=new N("INSERT INTO votes as vote \n                (nickname, thread, voice)\n                VALUES ($1, $2, $3) \n                ON CONFLICT ON CONSTRAINT unique_vote DO\n                UPDATE SET voice = $3 WHERE vote.voice <> $3\n                RETURNING *, (xmax::text <> '0') as existed",[t.nickname,a.id,e]);s.data=await this._dbContext.db.oneOrNone(n),s.isSuccess=!0}catch(e){s.errorCode=e.message}return s}},R=new class{async PostRequestPostForThread(e,t){let a=e.body;const s=f(e.params.slug_or_id)?"id":"slug";let n=f(e.params.slug_or_id)?Number(e.params.slug_or_id):e.params.slug_or_id,r=await g.get(s,n);if(!r)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find forum with slug or id "+e.params.slug_or_id});if(r.id=Number(r.id),Array.isArray(a)&&!a.length)return t.code(201).header("Content-Type","application/json; charset=utf-8").send(a);if(!Array.isArray(a))return t.code(400).header("Content-Type","application/json; charset=utf-8").send({message:"Request data must be an array."});let i=[],o=new Date;for(let e of a){let a=await d.getByNickname(e.author);if(!a)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find user with nickname "+e.author});e.created=o;let s=await w.createPost(e,r,a);if(!s.isSuccess)return"409"===s.message?t.code(409).header("Content-Type","application/json; charset=utf-8").send({message:"Can't create post this parent in a different thread."}):t.code(400).header("Content-Type","application/json; charset=utf-8").send();i.push(s.data)}if(a.length>0){if(!(await h.addPostsToForum(r.forum_id,a.length)).isSuccess)return t.code(500).header("Content-Type","application/json; charset=utf-8").send()}t.code(201).header("Content-Type","application/json; charset=utf-8").send(E.serialize_many(i))}async PostRequestVoteForThread(e,t){let a=e.body,s=await d.getByNickname(a.nickname);if(!s)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find user with nickname "+a.nickname});const n=f(e.params.slug_or_id)?"id":"slug";let r=f(e.params.slug_or_id)?Number(e.params.slug_or_id):e.params.slug_or_id,i=await g.get(n,r);if(!i)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find forum with slug or id "+e.params.slug_or_id});i.id=Number(i.id);let o=await S.create(a.voice,s,i);if(!o.isSuccess)return t.code(400).header("Content-Type","application/json; charset=utf-8").send({message:o.message});if(!o.data)return t.code(200).header("Content-Type","application/json; charset=utf-8").send(y.serialize_one(i));let u=o.data.voice;o.data.existed&&(u=1==u?u+1:u-1);let c=await g.updateThreadVotes(i,u);if(o.isSuccess)return t.code(200).header("Content-Type","application/json; charset=utf-8").send(y.serialize_one(c.data));t.code(500).header("Content-Type","application/json; charset=utf-8").send()}async GetRequestThreadDetails(e,t){const a=f(e.params.slug_or_id)?"id":"slug";let s=f(e.params.slug_or_id)?Number(e.params.slug_or_id):e.params.slug_or_id,n=await g.get(a,s);if(!n)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find forum with slug or id "+e.params.slug_or_id});t.header("Content-Type","application/json; charset=utf-8").send(y.serialize_one(n))}async PostRequestThreadDetails(e,t){const a=f(e.params.slug_or_id)?"id":"slug";let s=f(e.params.slug_or_id)?Number(e.params.slug_or_id):e.params.slug_or_id,n=await g.get(a,s);if(!n)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find forum with slug or id "+e.params.slug_or_id});let r=await g.updateThread(n.id,e.body);if(!r)return t.code(409).header("Content-Type","application/json; charset=utf-8").send({message:"Can't change thread with id "+thread_id});!0===r?t.header("Content-Type","application/json; charset=utf-8").send(y.serialize_one(n)):t.header("Content-Type","application/json; charset=utf-8").send(y.serialize_one(r))}async GetRequestThreadsPost(e,t){const a=f(e.params.slug_or_id)?"id":"slug";let s,n=f(e.params.slug_or_id)?Number(e.params.slug_or_id):e.params.slug_or_id,r=await g.get(a,n);if(!r)return t.code(404).header("Content-Type","application/json; charset=utf-8").send({message:"Can't find forum with slug or id "+e.params.slug_or_id});s=await w.getPostByThreadId(e.query.sort,r.id,{desc:"true"===e.query.desc,limit:e.query.limit?parseInt(e.query.limit):100,since:e.query.since}),t.header("Content-Type","application/json; charset=utf-8").send(E.serialize_many(s))}},O=new class{async getServiceStatus(e,t){await d.getCount(),await h.getCount(),await g.getCount(),await w.getCount(),t.header("Content-Type","application/json; charset=utf-8").send({user:Number(d.count),forum:Number(h.count),thread:Number(g.count),post:Number(w.count)})}async clearAll(e=null,t){await d.clearAll(),await h.clearAll(),await g.clearAll(),await w.clearAll(),await S.clearAll(),t.code(200).header("Content-Type","application/json; charset=utf-8").send(null)}};const $=a(2)({logger:!0});$.addContentTypeParser("application/json",{parseAs:"string"},(function(e,t,a){try{let e={};t&&(e=JSON.parse(t)),a(null,e)}catch(e){e.statusCode=400,a(e,void 0)}})),$.get("/api/user/:nickname/profile",l.get),$.post("/api/user/:nickname/profile",l.updateUser),$.post("/api/user/:nickname/create",l.createUser),$.post("/api/forum/create",C.createForum),$.get("/api/forum/:slug/details",C.GetRequestGetForumDetails),$.post("/api/forum/:slug/create",C.PostRequestCreateThreadsForForum),$.get("/api/forum/:slug/threads",C.GetRequestGetForumThreads),$.get("/api/forum/:slug/users",C.GetRequestGetForumUsers),$.post("/api/thread/:slug_or_id/create",R.PostRequestPostForThread),$.post("/api/thread/:slug_or_id/vote",R.PostRequestVoteForThread),$.get("/api/thread/:slug_or_id/details",R.GetRequestThreadDetails),$.post("/api/thread/:slug_or_id/details",R.PostRequestThreadDetails),$.get("/api/thread/:slug_or_id/posts",R.GetRequestThreadsPost),$.get("/api/post/:id/details",b.GetRequestPostDetails),$.post("/api/post/:id/details",b.PostRequestPostDetails),$.get("/api/service/status",O.getServiceStatus),$.post("/api/service/clear",O.clearAll);const j=process.env.PORT||5e3;$.listen(j,"0.0.0.0",(function(e,t){e&&($.log.error(e),process.exit(1)),$.log.info("server listening on "+t)}))}]);