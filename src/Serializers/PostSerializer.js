export default new class PostSerializer {
    //using in postsController
    serializeRelated(responseData){
        return {
            author: responseData.pauthor,
            id: responseData.pid,
            thread: responseData.pthread,
            parent: responseData.pparent,
            forum: responseData.pforumslug,
            message: responseData.pmessage,
            isEdited: responseData.pisEdited,
            created: responseData.pcreated,
        };
    }
}
