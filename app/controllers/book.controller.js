//configuration
const fieldList = [
  "MaSach",
  "TenSach",
  "DonGia",
  "SoQuyen",
  "DangYeuCau",
  "DangMuon",
  "NamXuatBan",
  "MaNXB",
  "NguonGoc/TacGia",
]
const collection = "Sach"
const singleCollectionName = "Sach"

// configuration for NXB
const NXBFieldList = ["MaNXB", "TenNXB", "DiaChi"]
const NXBCollection = "NhaXuatBan"
const NXBSingleCollectionName = "NhaXuatBan"
//configure in create, update method also
//

const ApiError = require("../api-error")
const DatabaseService = require("../services/database.service")
const MongoDB = require("../utils/mongodb.ultil")
const ResponseTemplate = require("../responseTemplate")

exports.create = async (req, res, next) => {
  if (!req.body) {
    return next(new ApiError(400, "Form cannot be empty"))
  }

  for (let field of fieldList) {
    if (!req.body.hasOwnProperty(field) || req.body[field].length == 0) {
      return next(new ApiError(400, field + " cannot be empty"))
    }
  }

  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)
    const NXBDbService = new DatabaseService(
      MongoDB.client,
      NXBCollection,
      NXBFieldList
    )
    //check if  exists

    let documents = await dbService.find({
      MaSach: req.body.MaSach,
    })
    if (documents.length > 0) {
      return next(
        new ApiError(
          400,
          `MaSach is registerd by another ${singleCollectionName}!`
        )
      )
    }
    // check NXB exists
    let NXBDoc = await NXBDbService.find({
      MaNXB: req.body.MaNXB,
    })
    if (NXBDoc.length == 0) {
      return next(new ApiError(400, `MaNXB doesn't exist!`))
    }

    //

    const mongoDocument = await dbService.create(req.body)

    return res.send(
      ResponseTemplate(
        true,
        `${singleCollectionName} is created successfully`,
        {
          id: mongoDocument.insertedId,
        }
      )
    )
  } catch (error) {
    console.log(error)
    return next(
      new ApiError(
        500,
        `An error occurred while creating the ${singleCollectionName}`
      )
    )
  }
}

exports.findAll = async (req, res, next) => {
  let documents = []
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)
    const { name } = req.query
    if (name) {
      documents = await dbService.findByName(name)
    } else documents = await dbService.find({})
  } catch (error) {
    return next(
      new ApiError(500, `An error occurred while retrieving ${collection}`)
    )
  }

  return res.send(ResponseTemplate(true, "", documents))
}

exports.findOne = async (req, res, next) => {
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)
    document = await dbService.findOne({ MaSach: req.params.id })
    if (!document) {
      return next(new ApiError(404, `${singleCollectionName} not found`))
    }
    return res.send(ResponseTemplate(true, "", document))
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Error retrieving ${singleCollectionName} with id=${req.params.id}`
      )
    )
  }
}
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Data to update cannot be empty"))
  }
  for (let field of fieldList) {
    if (!req.body.hasOwnProperty(field) || req.body[field].length == 0) {
      return next(new ApiError(400, field + " cannot be empty"))
    }
  }
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)
    const NXBDbService = new DatabaseService(
      MongoDB.client,
      NXBCollection,
      NXBFieldList
    )
    //check exists
    if (req.body.MaSach) {
      let documents = await dbService.find({ MaSach: req.body.MaSach })
      if (documents.length > 0 && documents[0]._id != req.params.id) {
        return next(
          new ApiError(
            400,
            `MaSach is registerd by another ${singleCollectionName}!`
          )
        )
      }
    }
    // check NXB exists
    let NXBDoc = await NXBDbService.find({
      MaNXB: req.body.MaNXB,
    })
    if (NXBDoc.length == 0) {
      return next(new ApiError(400, `MaNXB doesn't exist!`))
    }

    //
    let document = await dbService.update(req.params.id, req.body)

    if (!document) {
      return next(new ApiError(404, `${singleCollectionName} not found`))
    }
    return res.send(
      ResponseTemplate(
        true,
        `${singleCollectionName} is updated successfully`,
        null
      )
    )
  } catch (error) {
    return next(
      new ApiError(500, `Error updating user with id=${req.params.id}`)
    )
  }
}
exports.delete = async (req, res, next) => {
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)

    let document = await dbService.delete(req.params.id)

    if (!document) {
      return next(new ApiError(404, `${singleCollectionName} not found`))
    }
    return res.send(
      ResponseTemplate(
        true,
        `${singleCollectionName} is deleted successfully`,
        null
      )
    )
  } catch (error) {
    return next(
      new ApiError(
        500,
        `Could not delete ${singleCollectionName} with id=${req.params.id}`
      )
    )
  }
}
exports.deleteAll = async (req, res, next) => {
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)

    let deletedCount = await dbService.deleteAll()
    return res.send(
      ResponseTemplate(true, `${deletedCount} ${collection} deleted`, null)
    )
  } catch (error) {
    return next(
      new ApiError(500, `An Error occurred while removing all ${collection}`)
    )
  }
}
