//configuration
const controllerName = "staff.controller"
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
//configure here also
router.route("/login").post(controller.login)
module.exports = router
