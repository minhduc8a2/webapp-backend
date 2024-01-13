//configuration
const controllerName = "borrowTracker.controller"
///

const express = require("express")
const controller = require(`../controllers/${controllerName}`)
const router = express.Router()
const staffAuthorization = require("../middleware/staffAuthorization")
const bothAuthorization = require("../middleware/bothReaderAndStaffAuthorization")
router
  .route("/")
  .get(bothAuthorization, controller.findAll)
  .post(bothAuthorization, controller.create)
  .delete(staffAuthorization, controller.deleteAll)
router
  .route("/:id")
  .get(bothAuthorization, controller.findOne)
  .put(bothAuthorization, controller.update)
  .delete(staffAuthorization, controller.delete)
module.exports = router
