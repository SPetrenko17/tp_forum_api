import BaseSerializer from "../Base/BaseSerializer";

export default new class ForumSerializer extends BaseSerializer{

    serialize_one(forum, type) {
        switch (type) {
            case '404':
                return{
                    slug: forum.slug,
                    title: forum.title,
                    user: forum.owner_nickname,
                    posts: forum.posts,
                    threads: forum.threads }
                break;
            case '409':
                return  {
                    slug: forum.slug,
                    title: forum.title,
                    user: forum.owner_nickname};
                break;

            case '201':{
                return {
                    slug: forum.data.slug,
                    title: forum.data.title,
                    user: forum.data.owner_nickname
                }
            }
            default:
                return {
                    slug: forum.data.slug,
                    title: forum.data.title,
                    user: forum.data.owner_nickname
                }
        }

    }

    serialize_many(forums) {
        if (!forums.length) {
            return [];
        }
        return forums.map((forum)=>{
            return this.serialize_one(forum);
        });
    }

};
