import BaseSerializer from "../Base/BaseSerializer";

export default new class UserSerializer extends BaseSerializer{
    serialize_one(user) {
        return user.data;
    }

    serialize_many(users) {
        if (!users.length) {
            return [];
        }
        return users.map((user)=> {
            return this.serialize_one(user)
        });
    }

};
