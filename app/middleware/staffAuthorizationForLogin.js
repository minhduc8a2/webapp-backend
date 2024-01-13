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
  console.log("admin login")
  const token = req.header("Authorization")?.replace("Bearer ", "")
  if (!token) return next()
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
        return next()
      }
      req.logined = true
      req.token = token

      next()
    } catch (error) {
      return next(new ApiError(500, "Lỗi hệ thống"))
    }
  } catch (err) {
    return next()
  }
}
module.exports = auth
