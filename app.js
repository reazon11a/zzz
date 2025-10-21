const express = require('express')
const app = express()
const port = 3000


app.get('/', (req, res) => {
  res.send('This a bot web')
})

app.listen(port, () => {
  console.log(`Web is listening at http://localhost:${port}`)
})
