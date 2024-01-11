const fieldList = [
  "MSNV",
  "HoTenNV",
  "Password",
  "ChucVu",
  "DiaChi",
  "SoDienThoai",
]
const collection = "NhanVien"
const DatabaseService = require("../services/database.service")
const ApiError = require("../api-error")
const MongoDB = require("../utils/mongodb.ultil")

const jwt = require("jsonwebtoken")

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "")
  if (!token) return next(new ApiError(400, "Vui lòng đăng nhập"))
  try {
    var data = jwt.verify(token, process.env.JWT_KEY)
    try {
      const dbService = new DatabaseService(
        MongoDB.client,
        collection,
        fieldList
      )
      const staff = await dbService.findOne({ MaNhanVien: data.MaNhanVien })
      if (!staff) {
        req.logined = null
        return next(new ApiError(400, "Không tìm thấy nhân viên!"))
      }
      req.logined = token

      next()
    } catch (error) {
      return next(new ApiError(500, "Lỗi hệ thống"))
    }
  } catch (err) {
    return next(new ApiError(400, "Token không hợp lệ!"))
  }
}
module.exports = auth
