const readerFieldList = [
  "MaDocGia",
  "HoLot",
  "Ten",
  "NgaySinh",
  "Phai",
  "DiaChi",
  "DienThoai",
  "Password",
]
const readerCollection = "DocGia"
//
const staffFieldList = [
  "MSNV",
  "HoTenNV",
  "Password",
  "ChucVu",
  "DiaChi",
  "SoDienThoai",
]
const staffCollection = "NhanVien"
//
const DatabaseService = require("../services/database.service")
const ApiError = require("../api-error")
const MongoDB = require("../utils/mongodb.ultil")

const jwt = require("jsonwebtoken")

const auth = async (req, res, next) => {
  console.log("both")
  const token = req.header("Authorization")?.replace("Bearer ", "")
  if (!token) return next(new ApiError(400, "Vui lòng đăng nhập"))
  try {
    var data = jwt.verify(token, process.env.JWT_KEY)
    try {
      if (data.type == "reader") {
        const readerDBService = new DatabaseService(
          MongoDB.client,
          readerCollection,
          readerFieldList
        )
        const reader = await readerDBService.findOne({
          MaDocGia: data.username,
        })
        if (!reader) {
          req.logined = null
          return next(new ApiError(400, "Không tìm thấy đoc giả!"))
        }
        req.logined = true
        req.type = data.type
        req.username = data.username

        return next()
      } else if (data.type == "staff") {
        const staffDBService = new DatabaseService(
          MongoDB.client,
          staffCollection,
          staffFieldList
        )
        const staff = await staffDBService.findOne({
          MaNhanVien: data.MaNhanVien,
        })

        if (!staff) {
          req.logined = null
          return next(new ApiError(400, "Không tìm thấy nhân viên!"))
        }
        req.logined = true
        req.type = data.type
        req.username = data.username

        return next()
      }
    } catch (error) {
      return next(new ApiError(500, "Lỗi hệ thống"))
    }
  } catch (err) {
    return next(new ApiError(400, "Token không hợp lệ!"))
  }
}
module.exports = auth
