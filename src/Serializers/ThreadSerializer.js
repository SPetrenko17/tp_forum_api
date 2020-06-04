export default new class ThreadSerializer {
    //using in postsController
    serializeRelated(responseData){
        return {
            forum: responseData.tforumslug,
            author: responseData.tauthor,
            created: responseData.tcreated,
            votes: responseData.tvotes,
            id: responseData.tid,
            title: responseData.ttitle,
            message: responseData.tmessage,
            slug: responseData.tslug,
        };
    }
}
