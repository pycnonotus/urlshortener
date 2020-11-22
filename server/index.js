/* eslint-disable no-unused-vars */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const yup = require('yup');
const { nanoid } = require('nanoid');
require('dotenv').config();

const { Pool, Client } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'urlshortner',
    password: 'newPass342',
    port: 5432,
});

const app = express();
app.use(helmet());
app.use(morgan('tiny'));
app.use(cors());

app.use(express.json());

app.use('/', express.static('./wwwroot'));

app.get('/url/:id', (req, res) => {
    res.json({
        message: 'antct - cut the url size to the size of an ant',
    });
});
app.get('/:id', async (req, res, next) => {
    const id = req.params.id;
    try {
        const url = await pool
            .query('SELECT url FROM public."URLS" where alias = $1 ;', [id])
            .then((result) => {
                if (result.rowCount < 1) {
                    res.status(404);
                    return res.json({
                        // eslint-disable-next-line quotes
                        message: "can't find any url with that alias",
                    });
                }
                return result.rows[0]?.url;
            })
            .catch((error) => {
                console.log(error);
                throw new Error('unknown error');
            });
        if (url) {
            const ip =
                req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                (req.connection.socket
                    ? req.connection.socket.remoteAddress
                    : null);
            const dateNow = new Date();
            const alias = id;
            pool.query(
                'INSERT INTO public."VISITORS"( ip, date, alias) VALUES ($1, $2, $3);',
                [ip, dateNow, id]
            )
                .then((result) => {
                    console.log(result);
                })
                .catch((error) => {
                    console.log(error);
                });
            return res.redirect(url);
        } else {
            throw new Error('unknown error');
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
});

const schema = yup.object().shape({
    alias: yup
        .string()
        .trim()
        // eslint-disable-next-line no-useless-escape
        .matches(/[\w\-]/i),
    url: yup.string().trim().url().required(),
});

app.post('/url', async (req, res, next) => {
    let { alias, url } = req.body;

    try {
        if (alias === 'url') {
            throw new Error('dont troll or else ');
        }
        await schema.validate({ alias, url });
        if (!alias) {
            alias = nanoid(4);
            alias = alias.toLowerCase(); //TODO add a check if we did hit an exiting one, but it so rare so fuck it
        } else {
            alias = alias.toLowerCase();

            const existingAlias = await pool
                // eslint-disable-next-line quotes
                .query(
                    'SELECT 1 FROM public."URLS"' + ' WHERE "alias" = $1' + ';',
                    [alias]
                )
                .then((res) => {
                    return res.rowCount >= 1;
                })
                .catch((error) => {
                    console.log(error);
                    const err = Error('unknown error');
                    throw err;
                });
            if (existingAlias) {
                throw new Error('alias in use, please pick a different one');
            }
        }

        const password = nanoid(32);
        const isCreated = await pool
            .query(
                'INSERT INTO public."URLS"( alias, url, password) VALUES ($1, $2, $3);',
                [alias, url, password]
            )
            .then((result) => {
                res.json({
                    alias,
                    url,
                    password,
                });
            })
            .catch((error) => {
                console.log(error);
                throw new Error('unknown error');
            });
    } catch (e) {
        console.log(e);
        next(e);
    }
});
app.use((error, req, res, next) => {
    if (error.status) {
        res.status(error.status);
    } else {
        res.status(500);
    }
    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? ' 🐱‍🚀 ' : error.stack,
    });
});
const port = process.env.PORT || 3111;
app.listen(port, () => {
    console.log('Hello there');
});
