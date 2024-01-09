//configuration
const fieldList = [
  "MSNV",
  "HoTenNV",
  "Password",
  "ChucVu",
  "DiaChi",
  "SoDienThoai",
]
const collection = "NhanVien"
const singleCollectionName = "NhanVien"
//configure in create, update method also
//
var jwt = require("jsonwebtoken")
const secretKey = "webapp_secret"
const ApiError = require("../api-error")
const DatabaseService = require("../services/database.service")
const MongoDB = require("../utils/mongodb.ultil")
const ResponseTemplate = require("../responseTemplate")

function createToken(username) {
  return jwt.sign(
    {
      data: username,
    },
    secretKey,
    { expiresIn: 60 * 60 }
  )
}

exports.create = async (req, res, next) => {
  if (!req.body) {
    return next(new ApiError(400, "Form cannot be empty"))
  }
  fieldList.forEach((field) => {
    if (!req.body.hasOwnProperty(field) || req.body[field].length == 0) {
      return next(new ApiError(400, field + " cannot be empty"))
    }
  })

  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)
    //check if  exists
    let documents = await dbService.find({
      MSNV: req.body.MSNV,
    })
    if (documents.length > 0) {
      return next(
        new ApiError(
          400,
          `MSNV is registerd by another ${singleCollectionName}!`
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
/// login: a different method
exports.login = async (req, res, next) => {
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)

    document = await dbService.findOne({
      MSNV: req.body.username,
      Password: req.body.password,
    })

    if (!document) {
      return res.send(ResponseTemplate(false, "", null))
    }
    return res.send(ResponseTemplate(true, "", createToken(req.body.username)))
  } catch (error) {
    return next(new ApiError(500, `Error with server`))
  }
}
exports.update = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return next(new ApiError(400, "Data to update cannot be empty"))
  }

  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)

    //check exists
    if (req.body.MSNV) {
      let documents = await dbService.find({ MSNV: req.body.MSNV })
      if (documents.length > 0 && documents[0]._id != req.params.id) {
        return next(
          new ApiError(
            400,
            `MSNV is registerd by another ${singleCollectionName}!`
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
