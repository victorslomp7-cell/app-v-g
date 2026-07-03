import app from './app.js'
import { client } from './db.js'

const PORT = process.env.PORT || 4321
app.listen(PORT, () => {
  console.log(`V&G API rodando em http://localhost:${PORT}`)
})

process.on('SIGINT', () => {
  client.close()
  process.exit(0)
})
