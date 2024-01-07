function responseTemplate(status, message, data) {
  return {
    status,
    message,
    data,
  }
}

module.exports = responseTemplate
