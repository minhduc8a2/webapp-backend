//configuration
const fieldList = [
  "MaDocGia",
  "HoLot",
  "Ten",
  "NgaySinh",
  "Phai",
  "DiaChi",
  "DienThoai",
  "Password",
]
const updateFieldList = [
  //for update function

  "HoLot",
  "Ten",
  "NgaySinh",
  "Phai",
  "DiaChi",
  "DienThoai",
  "Password",
]
const collection = "DocGia"
const singleCollectionName = "DocGia"
const borrowTrackerFieldList = [
  "MaDocGia",
  "MaSach",
  "NgayMuon",
  "NgayTra",
  "TrangThai",
]
const borrowTrackerCollection = "TheoDoiMuonSach"
const jwt = require("jsonwebtoken")
//configure in create, update method also
//

const ApiError = require("../api-error")
const DatabaseService = require("../services/database.service")
const MongoDB = require("../utils/mongodb.ultil")
const ResponseTemplate = require("../responseTemplate")

function createValidPayload(data, fieldList) {
  let result = {}
  Object.keys(data).forEach((key) => {
    if (fieldList.find((item) => item == key)) {
      result[key] = data[key]
    }
  })
  return result
}
function createToken(username, type) {
  return jwt.sign(
    {
      username,
      type,
    },
    process.env.JWT_KEY,
    { expiresIn: 60 * 60 }
  )
}
exports.login = async (req, res, next) => {
  if (req.logined)
    return res.send(
      ResponseTemplate(true, "", { token: req.logined, reader: req.reader })
    )

  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)

    document = await dbService.findOne({
      MaDocGia: req.body.username,
      Password: req.body.password,
    })
    if (!document) {
      return res.send(
        new ApiError(401, "Tên đăng nhập hoặc mật khẩu không đúng!")
      )
    }
    return res.send(
      ResponseTemplate(true, "", {
        token: createToken(req.body.username, "reader"),
        reader: {
          MaDocGia: document.MaDocGia,
          HoLot: document.HoLot,
          Ten: document.Ten,
          DiaChi: document.DiaChi,
          DienThoai: document.DienThoai,
        },
      })
    )
  } catch (error) {
    return next(new ApiError(500, `Error with server`))
  }
}
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
      MaDocGia: req.body.MaDocGia,
    })
    if (documents.length > 0) {
      return next(
        new ApiError(
          400,
          `MaDocGia is registerd by another ${singleCollectionName}!`
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

    documents = await dbService.find(req.query)
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
    if (req.type == "reader") {
      document = await dbService.findOne({ MaDocGia: req.username })
    } else if (req.type == "staff") {
      document = await dbService.findOne({ MaDocGia: req.params.id })
    }
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
exports.findOneInfo = async (req, res, next) => {
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)
    if (req.type == "reader") {
      document = await dbService.findOne({ MaDocGia: req.username })
    } else if (req.type == "staff") {
      document = await dbService.findOne({ MaDocGia: req.params.id })
    }
    if (!document) {
      return next(new ApiError(404, `${singleCollectionName} not found`))
    }
    return res.send(
      ResponseTemplate(true, "", {
        MaDocGia: document["MaDocGia"],
        HoLot: document["HoLot"],
        Ten: document["Ten"],
        NgaySinh: document["NgaySinh"],
        Phai: document["Phai"],
        DiaChi: document["DiaChi"],
        DienThoai: document["DienThoai"],
      })
    )
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
    if (req.type == "reader") {
      let document = await dbService.findOne({
        MaDocGia: req.username,
        Password: req.body.CurrentPassword,
      })

      if (!document) {
        return next(new ApiError(400, `Sai mật khẩu!`))
      }
      var realId = document._id
      req.body.Password = req.body.CurrentPassword
      if (req.body.NewPassword) {
        req.body.Password = req.body.NewPassword
      }
    }

    if (req.type == "reader") {
      createValidPayload(req.body, fieldList)
      document = await dbService.update(
        realId,
        createValidPayload(req.body, updateFieldList)
      )
    } else if (req.type == "staff") {
      document = await dbService.update(
        req.params.id,
        createValidPayload(req.body, updateFieldList)
      )
    }

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
    await deleteBorrowTrackerAfterDeleteReader(document.MaDocGia)
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
    await deleteBorrowTrackerAfterDeleteReader("")

    return res.send(
      ResponseTemplate(true, `${deletedCount} ${collection} deleted`, null)
    )
  } catch (error) {
    return next(
      new ApiError(500, `An Error occurred while removing all ${collection}`)
    )
  }
}

async function deleteBorrowTrackerAfterDeleteReader(MaDocGia) {
  const borrowTrackerDbService = new DatabaseService(
    MongoDB.client,
    borrowTrackerCollection,
    borrowTrackerFieldList
  )
  if (MaDocGia != "")
    await borrowTrackerDbService.deleteAll({
      MaDocGia: document.MaDocGia,
    })
  else await borrowTrackerDbService.deleteAll()
}
