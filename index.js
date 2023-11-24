const express = require('express')
const app = express();
const cors = require('cors')
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Diagnostic center management is here')
})

app.listen(port, () => {
    console.log(`Diagnostic center is running on port ${port}`);
})