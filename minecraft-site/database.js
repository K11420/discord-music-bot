// Database Module for Minecraft Server Stats
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'minecraft-stats.db');

// Initialize Database
class Database {
    constructor() {
        this.db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Database connection error:', err);
            } else {
                console.log('✅ Database connected');
                this.initializeTables();
            }
        });
    }

    initializeTables() {
        // Server Statistics Table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS server_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                online BOOLEAN,
                player_count INTEGER,
                max_players INTEGER,
                uptime INTEGER,
                cpu_usage REAL,
                memory_usage REAL,
                tps REAL
            )
        `);

        // Player Sessions Table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS player_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name TEXT NOT NULL,
                join_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                leave_time DATETIME,
                duration INTEGER,
                UNIQUE(player_name, join_time)
            )
        `);

        // Player Statistics Table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS player_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name TEXT UNIQUE NOT NULL,
                total_playtime INTEGER DEFAULT 0,
                first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                blocks_placed INTEGER DEFAULT 0,
                blocks_broken INTEGER DEFAULT 0,
                distance_traveled INTEGER DEFAULT 0,
                deaths INTEGER DEFAULT 0
            )
        `);

        // Events/Calendar Table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                event_date DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                event_type TEXT DEFAULT 'general'
            )
        `);

        // Screenshots/Gallery Table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS screenshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                title TEXT,
                description TEXT,
                uploader TEXT,
                upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                likes INTEGER DEFAULT 0
            )
        `);

        // Chat Logs Table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS chat_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                player_name TEXT,
                message TEXT,
                message_type TEXT DEFAULT 'chat'
            )
        `);

        console.log('✅ Database tables initialized');
    }

    // Server Stats Methods
    recordServerStat(data) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO server_stats (online, player_count, max_players, uptime, cpu_usage, memory_usage, tps)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [
                data.online ? 1 : 0,
                data.player_count || 0,
                data.max_players || 10,
                data.uptime || 0,
                data.cpu_usage || 0,
                data.memory_usage || 0,
                data.tps || 20.0
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getServerStats(hours = 24) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM server_stats 
                         WHERE timestamp >= datetime('now', '-${hours} hours')
                         ORDER BY timestamp DESC`;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Player Session Methods
    startPlayerSession(playerName) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR IGNORE INTO player_sessions (player_name) VALUES (?)`;
            this.db.run(sql, [playerName], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    endPlayerSession(playerName) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE player_sessions 
                         SET leave_time = CURRENT_TIMESTAMP,
                             duration = (julianday(CURRENT_TIMESTAMP) - julianday(join_time)) * 86400
                         WHERE player_name = ? AND leave_time IS NULL`;
            this.db.run(sql, [playerName], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Player Stats Methods
    updatePlayerStats(playerName, stats) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO player_stats (player_name, total_playtime, last_seen, blocks_placed, blocks_broken, distance_traveled, deaths)
                         VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
                         ON CONFLICT(player_name) DO UPDATE SET
                         total_playtime = total_playtime + excluded.total_playtime,
                         last_seen = CURRENT_TIMESTAMP,
                         blocks_placed = blocks_placed + excluded.blocks_placed,
                         blocks_broken = blocks_broken + excluded.blocks_broken,
                         distance_traveled = distance_traveled + excluded.distance_traveled,
                         deaths = deaths + excluded.deaths`;
            this.db.run(sql, [
                playerName,
                stats.playtime || 0,
                stats.blocks_placed || 0,
                stats.blocks_broken || 0,
                stats.distance_traveled || 0,
                stats.deaths || 0
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getPlayerRankings(type = 'total_playtime', limit = 10) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM player_stats ORDER BY ${type} DESC LIMIT ?`;
            this.db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Events Methods
    createEvent(event) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO events (title, description, event_date, event_type)
                         VALUES (?, ?, ?, ?)`;
            this.db.run(sql, [event.title, event.description, event.event_date, event.event_type], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    getEvents(limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM events ORDER BY event_date DESC LIMIT ?`;
            this.db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    deleteEvent(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM events WHERE id = ?`;
            this.db.run(sql, [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Screenshots Methods
    addScreenshot(screenshot) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO screenshots (filename, title, description, uploader)
                         VALUES (?, ?, ?, ?)`;
            this.db.run(sql, [screenshot.filename, screenshot.title, screenshot.description, screenshot.uploader], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    getScreenshots(limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM screenshots ORDER BY upload_date DESC LIMIT ?`;
            this.db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    likeScreenshot(id) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE screenshots SET likes = likes + 1 WHERE id = ?`;
            this.db.run(sql, [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Chat Logs Methods
    addChatLog(player, message, type = 'chat') {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO chat_logs (player_name, message, message_type)
                         VALUES (?, ?, ?)`;
            this.db.run(sql, [player, message, type], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getChatLogs(limit = 100) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM chat_logs ORDER BY timestamp DESC LIMIT ?`;
            this.db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = Database;
