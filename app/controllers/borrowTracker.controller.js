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
  Cancelled: "Cancelled",
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
  req.body.TrangThai = bookStatus.Pending
  //
  for (let field of fieldList) {
    if (!req.body.hasOwnProperty(field) || req.body[field].length == 0) {
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
    let book = await bookDBService.findOne({ MaSach: req.body.MaSach })

    if (book) {
      if (book.SoQuyen == 0) {
        return next(new ApiError(400, `Không còn sách để mượn`))
      }
      book = await bookDBService.update(book._id, {
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
  if (!req.body.TrangThai || !req.body.NgayMuon || !req.body.NgayTra) {
    return next(new ApiError(400, "TrangThai cannot be empty"))
  }
  //check book status is valid
  if (!bookStatus.hasOwnProperty(req.body.TrangThai)) {
    return next(new ApiError(400, "TrangThai is not valid"))
  }
  try {
    const dbService = new DatabaseService(MongoDB.client, collection, fieldList)

    let currentDocument = await dbService.findById(req.params.id)

    //  check change status

    let willChangeSoQuyen = 0
    let willChangeDangMuon = 0
    let willChangeDangYeuCau = 0
    let willChangeStatus = req.body.TrangThai

    if (
      currentDocument.TrangThai == bookStatus.Pending ||
      currentDocument.TrangThai == bookStatus.Accepted
    ) {
      if (willChangeStatus == bookStatus.Borrowed) {
        willChangeDangMuon = 1
        willChangeDangYeuCau = -1
      } else if (
        willChangeStatus == bookStatus.Cancelled ||
        willChangeStatus == bookStatus.Rejected
      ) {
        willChangeSoQuyen = 1
        willChangeDangYeuCau = -1
      }
    } else if (currentDocument.TrangThai == bookStatus.Borrowed) {
      if (
        willChangeStatus == bookStatus.Pending ||
        willChangeStatus == bookStatus.Accepted
      ) {
        willChangeDangMuon = -1
        willChangeDangYeuCau = 1
      } else if (
        willChangeStatus == bookStatus.Cancelled ||
        willChangeStatus == bookStatus.Rejected
      ) {
        willChangeDangMuon = -1
        willChangeSoQuyen = 1
      }
    } else if (
      currentDocument.TrangThai == bookStatus.Cancelled ||
      currentDocument.TrangThai == bookStatus.Rejected
    ) {
      if (willChangeStatus == bookStatus.Borrowed) {
        willChangeDangMuon = 1
        willChangeSoQuyen = -1
      } else if (
        willChangeStatus == bookStatus.Pending ||
        willChangeStatus == bookStatus.Accepted
      ) {
        willChangeDangYeuCau = 1
        willChangeSoQuyen = -1
      }
    }
    const bookDBService = new DatabaseService(
      MongoDB.client,
      bookCollection,
      bookFieldList
    )
    let getBook = await bookDBService.findOne({
      MaSach: currentDocument.MaSach,
    })

    if (!getBook) {
      return next(new ApiError(404, `Book not found`))
    }
    console.log("currentbook: " + getBook)
    console.log(willChangeDangMuon, willChangeDangYeuCau, willChangeSoQuyen)
    console.log(
      getBook.SoQuyen + willChangeSoQuyen,
      getBook.DangMuon + willChangeDangMuon,
      getBook.DangYeuCau + willChangeDangYeuCau
    )
    let updatedBook = await bookDBService.update(getBook._id, {
      SoQuyen: getBook.SoQuyen + willChangeSoQuyen,
      DangMuon: getBook.DangMuon + willChangeDangMuon,
      DangYeuCau: getBook.DangYeuCau + willChangeDangYeuCau,
    })
    if (!updatedBook) {
      return next(new ApiError(404, `Failed to update book`))
    }
    //
    let document = await dbService.update(req.params.id, {
      TrangThai: req.body.TrangThai,
      NgayMuon: req.body.NgayMuon,
      NgayTra: req.body.NgayTra,
    })

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

    //check exists

    let currentDocument = await dbService.findById(req.params.id)
    if (!currentDocument) {
      return next(new ApiError(404, `BorrowTracker not found`))
    }
    //  check change status

    let willChangeSoQuyen = 0
    let willChangeDangMuon = 0
    let willChangeDangYeuCau = 0

    if (
      currentDocument.TrangThai == bookStatus.Pending ||
      currentDocument.TrangThai == bookStatus.Accepted
    ) {
      willChangeSoQuyen = 1
      willChangeDangYeuCau = -1
    } else if (currentDocument.TrangThai == bookStatus.Borrowed) {
      willChangeSoQuyen = 1
      willChangeDangMuon = -1
    }
    const bookDBService = new DatabaseService(
      MongoDB.client,
      bookCollection,
      bookFieldList
    )
    let getBook = await bookDBService.findOne({
      MaSach: currentDocument.MaSach,
    })
    if (!getBook) {
      return next(new ApiError(404, `Book not found`))
    }
    let updatedBook = await bookDBService.update(getBook._id, {
      SoQuyen: parseInt(getBook.SoQuyen) + willChangeSoQuyen,
      DangMuon: parseInt(getBook.DangMuon) + willChangeDangMuon,
      DangYeuCau: parseInt(getBook.DangYeuCau) + willChangeDangYeuCau,
    })
    if (!updatedBook) {
      return next(new ApiError(404, `Failed to update book`))
    }
    //

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
    const bookDBService = new DatabaseService(
      MongoDB.client,
      bookCollection,
      bookFieldList
    )
    let borrowTrackerList = await dbService.find({})
    let count = 0
    for (let item of borrowTrackerList) {
      let currentDocument = item
      let document = await dbService.delete(currentDocument._id)
      if (!document) {
        return res.send(
          ResponseTemplate(false, `${count} ${collection} deleted`, null)
        )
      }
      //  check change status

      let willChangeSoQuyen = 0
      let willChangeDangMuon = 0
      let willChangeDangYeuCau = 0

      if (
        currentDocument.TrangThai == bookStatus.Pending ||
        currentDocument.TrangThai == bookStatus.Accepted
      ) {
        willChangeSoQuyen = 1
        willChangeDangYeuCau = -1
      } else if (currentDocument.TrangThai == bookStatus.Borrowed) {
        willChangeSoQuyen = 1
        willChangeDangMuon = -1
      }

      let getBook = await bookDBService.findOne({
        MaSach: currentDocument.MaSach,
      })
      if (!getBook) {
        return res.send(
          ResponseTemplate(false, `${count} ${collection} deleted`, null)
        )
      }
      console.log(willChangeSoQuyen, willChangeDangYeuCau, willChangeDangMuon)
      let updatedBook = await bookDBService.update(getBook._id, {
        SoQuyen: getBook.SoQuyen + willChangeSoQuyen,
        DangMuon: getBook.DangMuon + willChangeDangMuon,
        DangYeuCau: getBook.DangYeuCau + willChangeDangYeuCau,
      })
      if (!updatedBook) {
        return res.send(
          ResponseTemplate(false, `${count} ${collection} deleted`, null)
        )
      }
      //

      count++
    }
    return res.send(
      ResponseTemplate(true, `${count} ${collection} deleted`, null)
    )
  } catch (error) {
    return next(
      new ApiError(500, `An Error occurred while removing all ${collection}`)
    )
  }
}
