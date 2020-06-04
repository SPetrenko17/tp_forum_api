export default new class UserSerializer {
    //using in postsController
    serializeRelated(responseData){
        return {
            nickname: responseData.unickname,
            about: responseData.uabout,
            fullname: responseData.ufullname,
            email: responseData.uemail,
        };
    }

    serializeRequest(req){
        return {
            nickname: req.params.nickname,
            fullname: req.body.fullname,
            email: req.body.email,
            about: req.body.about,
        };
    }
}
