//configuration
const controllerName = "reader.controller"
///

const express = require("express")
const controller = require(`../controllers/${controllerName}`)
const loginAuthorization = require("../middleware/readerAuthorizationForLogin")
const staffAuthorization = require("../middleware/staffAuthorization")
const bothAuthorization = require("../middleware/bothReaderAndStaffAuthorization")

const router = express.Router()

router
  .route("/:id")
  .get(bothAuthorization, controller.findOne)
  .put(bothAuthorization, controller.update)
  .delete(staffAuthorization, controller.delete)
router.route("/fullInfo/:id").get(bothAuthorization, controller.findOneInfo)

router.route("/login").post(loginAuthorization, controller.login)

router
  .route("/")
  .get(staffAuthorization, controller.findAll)
  .post(controller.create)
  .delete(staffAuthorization, controller.deleteAll)
module.exports = router
