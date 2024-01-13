//configuration
const controllerName = "book.controller"
///

const express = require("express")
const controller = require(`../controllers/${controllerName}`)
const router = express.Router()
const staffAuthorization = require("../middleware/staffAuthorization")

router
  .route("/")
  .get(controller.findAll)
  .post(staffAuthorization, controller.create)
  .delete(staffAuthorization, controller.deleteAll)
router
  .route("/:id")
  .get(controller.findOne)
  .put(staffAuthorization, controller.update)
  .delete(staffAuthorization, controller.delete)
module.exports = router
