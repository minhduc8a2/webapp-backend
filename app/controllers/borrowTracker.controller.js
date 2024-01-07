//configuration
const fieldList = ["MaDocGia", "MaSach", "NgayMuon", "NgayTra", "TrangThai"]
const collection = "TheoDoiMuonSach"
const singleCollectionName = "TheoDoiMuonSach"

//book configuration
const bookFieldList = [
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
const bookCollection = "Sach"
const bookStatus = {
  Pending: "Pending",
  Rejected: "Rejected",
  Accepted: "Accepted",
  Borrowed: "Borrowed",
  Returned: "Returned",
}
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

  //default value
  req.body.TrangThai = "pending"
  //
  for (let field of fieldList) {
    if (!req.body[field]) {
      return next(new ApiError(400, field + " cannot be empty"))
    }
  }

  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)
    const bookDBService = new DatabaseService(
      MongoDB.client,
      bookCollection,
      bookFieldList
    )
    //check if  exists

    let documents = await dbService.find({
      MaDocGia: req.body.MaDocGia,
      MaSach: req.body.MaSach,
      NgayMuon: req.body.NgayMuon,
    })
    if (documents.length > 0) {
      return next(new ApiError(400, `TheoDoiMuonSach đã tồn tại!`))
    }

    //update so luong books in the library
    let book = await bookDBService.findById(req.body.MaSach)
    if (book) {
      if (book.SoQuyen == 0) {
        return next(new ApiError(400, `Không còn sách để mượn`))
      }
      book = await bookDBService.update(req.body.MaSach, {
        SoQuyen: book.SoQuyen - 1,
        DangYeuCau: book.DangYeuCau + 1,
      })
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
    document = await dbService.findById(req.params.id)
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
    if (!req.body[field]) {
      return next(new ApiError(400, field + " cannot be empty"))
    }
  }
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)

    //check exists

    let documents = await dbService.find({
      MaSach: req.body.MaSach,
      MaDocGia: req.body.MaDocGia,
      NgayMuon: req.body.NgayMuon,
    })
    if (documents.length > 0 && documents[0]._id != req.params.id) {
      return next(new ApiError(400, `TheoDoiMuonSach đã tồn tại!`))
    }

    //  check change status
    const currentDocument = documents[0]
    let willChangeSoQuyen,
      willChangeDangMuon,
      willChangeDangYeuCau = 0
    let willChangeStatus = req.body.TrangThai
    if (
      currentDocument.TrangThai == bookStatus.Pending ||
      currentDocument.TrangThai == bookStatus.Accepted
    ) {
      if (willChangeStatus == "borrowed") {
        willChangeDangMuon = 1
        willChangeDangYeuCau = -1
      }
      if (willChangeStatus == "cancelled") {
        willChangeSoQuyen = 1
        willChangeDangYeuCau = -1
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
