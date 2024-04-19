const app = require("./app")
const config = require("./app/config")
const MongoDB = require("./app/utils/mongodb.ultil")
require("dotenv").config()
const stafController = require("./app/controllers/staff.controller")

async function startServer() {
  try {
    await MongoDB.connect(config.db.uri)
    console.log("Connected to database!")
    const PORT = config.app.port
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`)
    })

    stafController.initAdminAccount()
  } catch (error) {
    console.log("Cannot connect to the database!", error)
    process.exit()
  }
}

startServer()
