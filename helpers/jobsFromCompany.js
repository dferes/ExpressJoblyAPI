const db = require('../db');

async function allJobsFromCompany(handle) {
  const res = await db.query(
    `SELECT id, title, salary, equity
    FROM jobs
    WHERE company_handle = $1
    ORDER BY title`,
    [handle]  
  );
  return res.rows;
}

module.exports = allJobsFromCompany;