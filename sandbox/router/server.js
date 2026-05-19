import app, { handlePreviewUpgrade } from './src/app.js'

const port = process.env.PORT || 3000

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Sandbox router server is running on port ${port}`)
})

server.on('upgrade', handlePreviewUpgrade)
