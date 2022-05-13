const express = require("express");
const app = express();
require('dotenv').config()
const multer = require("multer");
const upload = multer();
const dblib = require("./dblib.js");

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");


app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
    
    res.render("index");
});

app.get("/sum",(req, res) => {
    res.render("sum");
})

app.get("/import", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    const book = {
        book_id: "",
        title: "",
        total_pages: "",
        rating: "",
        isbn: "",
        published_date: ""
    };
    res.render("import", {
        type: "get",
        totRecs: totRecs.totRecords,
        book: book
    });
});

app.post("/import", upload.single('filename'), async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    if (!req.file || Object.keys(req.file).length === 0) {
        message = "Error: Import file not uploaded";
        return res.send(message);
    };
    const buffer = req.file.buffer;
    const lines = buffer.toString().split(/\r?\n/);
    const model = req.body
    var invalid = 0;
    var valid = 0;
    var errorList = [];
    for (const line of lines) {
        customer = line.split(",");
        const sql = "INSERT INTO book(book_id, title, total_pages, rating, isbn, published_date) VALUES ($1, $2, $3, $4, $5, $6)";
        pool.query(sql, customer, (err, result) => {
            if (err) {
                invalid++;
                console.log(`Insert Error.  Error message: ${err.message}`);
                errorList.push(`Book ID: ${model.book_id}, ${err.message}`)
            } else {
                valid++;
                console.log(`Inserted successfully`);
            }
            if (lines.length == (invalid + valid)) {
                message = `Processing Complete - Processed ${lines.length} records`;

                res.render("import", {
                    model: model,
                    success: valid,
                    failed: invalid,
                    totRecs: totRecs.totRecords,
                    errors: JSON.stringify(errorList),
                    type: "POST"

                });
            }
        });
    };
});


const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
