//configuration
const controllerName = "staff.controller"
///

const express = require("express")
const authorization = require("../middleware/staffAuthorization")
const loginAuthorization = require("../middleware/staffAuthorizationForLogin")
const controller = require(`../controllers/${controllerName}`)
const router = express.Router()

//
//configure here also
router.route("/login").post(loginAuthorization, controller.login)

router.use("/", authorization)
router
  .route("/")
  .get(controller.findAll)
  .post(controller.create)
  .delete(controller.deleteAll)
///
router
  .route("/:id")
  .get(controller.findOne)
  .put(controller.update)
  .delete(controller.delete)
module.exports = router
