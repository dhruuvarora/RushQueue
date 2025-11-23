import express from 'express';

const app = express();

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.send('RushQueue Server is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});