import morgan from 'morgan'
import express from 'express'

const app = express()


app.use(morgan('dev'))


app.get('/', (req, res) => {
    return res.status(200).json({ status: 'ok' })
});


export default app