const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/db.json';
const dbDir = path.dirname(DB_PATH);

let db;

const defaultData = {
  users: [],
  reports: [],
  volunteers: [],
  tasks: [],
  impact_logs: [],
  notifications: []
};

function initialize() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const adapter = new FileSync(DB_PATH);
  db = low(adapter);
  db.defaults(defaultData).write();
  console.log(`📦 Database initialized at ${DB_PATH}`);
}

function getDB() {
  if (!db) throw new Error('Database not initialized. Call initialize() first.');
  return db;
}

module.exports = { initialize, getDB };
