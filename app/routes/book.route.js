//configuration
const controllerName = "book.controller"
///

const express = require("express")
const controller = require(`../controllers/${controllerName}`)
const router = express.Router()
router
  .route("/")
  .get(controller.findAll)
  .post(controller.create)
  .delete(controller.deleteAll)
router
  .route("/:id")
  .get(controller.findOne)
  .put(controller.update)
  .delete(controller.delete)
module.exports = router
