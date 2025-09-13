class GlobalDAO {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        try {
            const document = new this.model(data);
            return await document.save();
        } catch (error) {
            throw new Error(`Error creating document: ${error.message}`);
        }
    }

    async read(id) {
        try {
            const document = await this.model.findById(id);
            if (!document) throw new Error("Document not found");
            return document;
        } catch (error) {
            throw new Error(`Error getting document by ID: ${error.message}`);
        }
    }
    
    async getAll(filter = {}) {
    try {
        return await this.model.find(filter);
    } catch (error) {
        throw new Error(`Error getting documents: ${error.message}`);
    }
}

}
module.exports = GlobalDAO;
