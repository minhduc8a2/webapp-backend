//configuration
const fieldList = ["MaNXB", "TenNXB", "DiaChi"]
const collection = "NhaXuatBan"
const singleCollectionName = "NhaXuatBan"
const sachFieldList = [
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
const sachCollection = "Sach"
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
    //check if  exists

    let documents = await dbService.find({
      MaNXB: req.body.MaNXB,
    })
    if (documents.length > 0) {
      return next(
        new ApiError(
          400,
          `MaNXB is registerd by another ${singleCollectionName}!`
        )
      )
    }

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
    document = await dbService.findOne({ MaNXB: req.params.id })
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

  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)

    //check exists
    if (req.body.MaNXB) {
      let documents = await dbService.find({ MaNXB: req.body.MaNXB })
      if (documents.length > 0 && documents[0]._id != req.params.id) {
        return next(
          new ApiError(
            400,
            `MaNXB is registerd by another ${singleCollectionName}!`
          )
        )
      }
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
  const id = req.params.id
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)
    const currentPublisher = await dbService.findById(id)
    if (await checkUsed(currentPublisher.MaNXB)) {
      return res.send(
        ResponseTemplate(
          false,
          "Không thể xóa! Nhà xuất bản đang được sử dụng trong hệ thống!",
          null
        )
      )
    }
    let document = await dbService.delete(id)

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
        `Could not delete ${singleCollectionName} with id=${id}`
      )
    )
  }
}
exports.deleteAll = async (req, res, next) => {
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)
    if (await checkUsed("all")) {
      return res.send(
        ResponseTemplate(
          false,
          "Không thể xóa! Nhà xuất bản đang được sử dụng trong hệ thống!",
          null
        )
      )
    }
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
async function checkUsed(MaNXB) {
  //check being used
  const sachDbService = new DatabaseService(
    MongoDB.client,
    sachCollection,
    sachFieldList
  )
  if (MaNXB == "all") {
    let checkUsed = await sachDbService.find({})
    if (checkUsed.length > 0) return true
  }
  if (MaNXB != "all") {
    let checkUsed = await sachDbService.find({ MaNXB })
    if (checkUsed.length > 0) return true
  }

  return false
  //
}
