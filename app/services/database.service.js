const { ObjectId } = require("mongodb")
class DatabaseService {
  constructor(client, collection, schemaFieldList) {
    this.collection = client.db().collection(collection)
    this.schemaFieldList = schemaFieldList
  }
  // Định nghĩa các phương thức truy xuất CSDL sử dụng mongodb API
  extractConactData(payload) {
    const data = {}
    this.schemaFieldList.forEach((field) => {
      data[field] = payload[field]
    })
    // Remove undefined fields
    Object.keys(data).forEach(
      (key) => data[key] === undefined && delete data[key]
    )
    return data
  }
  async create(payload) {
    const data = this.extractConactData(payload)

    return await this.collection.insertOne(data)
  }

  async find(filter) {
    const cursor = await this.collection.find(filter)
    return await cursor.toArray()
  }
  async getCount(filter) {
    const cursor = await this.collection.find(filter)
    return (await cursor.toArray())?.length || 0
  }
  async findOne(filter) {
    return await this.collection.findOne(filter)
  }
  async findByName(name) {
    return await this.find({
      name: { $regex: new RegExp(name), $option: "i" },
    })
  }
  async findById(id) {
    return await this.collection.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    })
  }

  async update(id, payload) {
    const filter = {
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    }
    const update = this.extractConactData(payload)
    const result = await this.collection.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: "after" }
    )

    return result
  }

  async delete(id) {
    const result = await this.collection.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    })
    return result
  }

  async deleteAll(options={}) {
    const result = await this.collection.deleteMany(options)
    return result.deletedCount
  }
}
module.exports = DatabaseService
