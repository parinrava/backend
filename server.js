const http = require('https');
const url = require('url');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join('/home', 'patients.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Database created successfully or already exists at', dbPath);
    }
});

db.run(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    gender TEXT
)`);

const server = http.createServer((req, res) => {
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "https://proud-bay-014af891e.5.azurestaticapps.net",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true"
        });
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/insert') {
        // Handle inserting patient data
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const patient = JSON.parse(body);
            const query = `INSERT INTO patients (name, age, gender) VALUES (?, ?, ?)`;
            db.run(query, [patient.name, patient.age, patient.gender], function (err) {
                if (err) {
                    res.writeHead(500, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "https://proud-bay-014af891e.5.azurestaticapps.net",
                    });
                    res.end('Error inserting patient data.');
                } else {
                    res.writeHead(200, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "https://proud-bay-014af891e.5.azurestaticapps.net",
                    });
                    res.end('Patient data inserted successfully.');
                }
            });
        });

    } else if (req.method === 'POST' && req.url === '/api/query') {
        // Handle running SQL queries (INSERT)
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const { query } = JSON.parse(body);
            if (query.trim().toUpperCase().startsWith('INSERT')) {
                db.run(query, function (err) {
                    if (err) {
                        res.writeHead(500, {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "https://proud-bay-014af891e.5.azurestaticapps.net",
                        });
                        res.end('Error executing query.');
                    } else {
                        res.writeHead(200, {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "https://proud-bay-014af891e.5.azurestaticapps.net",
                        });
                        res.end('Query executed successfully.');
                    }
                });
            } else {
                res.writeHead(400, {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "https://proud-bay-014af891e.5.azurestaticapps.net",
                });
                res.end('Only INSERT queries are allowed via POST.');
            }
        });

    } else if (req.method === 'GET' && req.url.startsWith('/api/query')) {
        // Handle running SQL queries (SELECT)
        const queryObject = url.parse(req.url, true).query;
        const sqlQuery = queryObject.sql;

        if (sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sqlQuery, [], (err, rows) => {
                if (err) {
                    res.writeHead(500, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "https://proud-bay-014af891e.5.azurestaticapps.net",
                    });
                    res.end('Error executing query.');
                } else {
                    res.writeHead(200, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "https://proud-bay-014af891e.5.azurestaticapps.net",
                    });
                    res.end(JSON.stringify(rows));
                }
            });
        } else {
            res.writeHead(400, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "https://proud-bay-014af891e.5.azurestaticapps.net",
            });
            res.end('Only SELECT queries are allowed via GET.');
        }

    } else {
        res.writeHead(404, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://proud-bay-014af891e.5.azurestaticapps.net",
        });
        res.end('Not Found');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
