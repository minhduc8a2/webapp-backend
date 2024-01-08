const express = require("express")
const cors = require("cors")
const app = express()
//router
const staffsRouter = require("./app/routes/staff.route")
const readersRouter = require("./app/routes/reader.route")
const publishersRouter = require("./app/routes/publisher.route")
const booksRouter = require("./app/routes/book.route")
const borrowTrackersRouter = require("./app/routes/borrowTracker.route")
//
const ApiError = require("./app/api-error")
app.use(cors())
app.use(express.json())
// add routes
app.use("/api/staffs", staffsRouter)
app.use("/api/readers", readersRouter)
app.use("/api/publishers", publishersRouter)
app.use("/api/books", booksRouter)
app.use("/api/borrowTrackers", borrowTrackersRouter)
//
app.get("/", (req, res) => {
  res.json({ msg: "Welcome to library application." })
})
app.use((req, res, next) => {
  return next(new ApiError(404, "Resource not found"))
})

app.use((err, req, res, next) => {
  return res.status(err.status || 500).json({
    status: false,
    message: err.message || "Internal Server Error",
  })
})
module.exports = app
