export default new class ForumSerializer {
    //using in postsController
    serializeRelated(responseData){
        return {
            threads: responseData.forum_threads,
            posts: responseData.forum_posts,
            title: responseData.forum_title,
            user: responseData.forum_user_nickname,
            slug: responseData.forum_slug,
        };
    }
}
