import morgan from 'morgan'
import express from 'express'
import fs from 'node:fs/promises'
const app = express()
// for the template docker build file 
const WROKDIR = '/workspace'

app.use(morgan('dev'))


app.get('/', (req, res) => {
    return res.status(200).json({ status: 'ok' })
});

app.get('/read-files', async function (req, res) {
    try {
        const Files = await fs.readdir(WROKDIR)
        return res.status(200).json({
            message: 'files reads successfully',
            files: Files
        })
    } catch (error) {
        console.log('====================================');
        console.log(error);
        console.log('====================================');
        return res.status(500).json({ error: error.message })
    }
})
export default app