
export default class BaseSerializer {

    serialize_one(context) {
        return context;
    }

    serialize_many(context) {
        if (!context.length) {
            return [];
        }
        return context.map((el)=>{
            return this.serialize_one(el);
        });
    }

};
