//configuration
const controllerName = "staff.controller"
///

const express = require("express")
const authorization = require("../middleware/staffAuthorization")
const loginAuthorization = require("../middleware/staffAuthorizationForLogin")
const controller = require(`../controllers/${controllerName}`)
const router = express.Router()
router
  .route("/")
  .get(authorization, controller.findAll)
  .post(authorization, controller.create)
  .delete(authorization, controller.deleteAll)
router
  .route("/:id")
  .get(authorization, controller.findOne)
  .put(authorization, controller.update)
  .delete(authorization, controller.delete)
//configure here also
router.route("/login").post(loginAuthorization, controller.login)
module.exports = router
