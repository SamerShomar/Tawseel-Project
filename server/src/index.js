import { app } from './app.js'
import { config } from './config.js'
import { mailProvider } from './lib/mailer.js'

app.listen(config.port, () => {
  console.log(`Tawseel API running on http://localhost:${config.port}`)
  console.log(`[mail] Email provider: ${mailProvider()}`)
})
