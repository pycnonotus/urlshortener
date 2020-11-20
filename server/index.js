/* eslint-disable no-unused-vars */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('urlshortner', 'postgres', 'newPass342', {
    host: 'localhost',
    dialect: 'postgres',
});

const app = express();
app.use(helmet());
app.use(morgan('tiny'));
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'antct - cut the url size to the size of an ant',
    });
});
const port = process.env.PORT || 3111;
app.listen(port, () => {
    console.log('Hello there');
    sequelize.showAllSchemas().then(() => {
        console.log('work');
    });
});
