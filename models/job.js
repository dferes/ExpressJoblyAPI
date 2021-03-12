"use strict";

const { search } = require("../app");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
 
  /** Create a job (from data), update db, return new job data.
  *
  * data should be { title, salary, equity, companyHandle }
  *
  * Returns { id, title, salary, equity, company_handle }
  *
  * */
  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
        `SELECT title, company_handle
         FROM jobs
         WHERE title = $1 AND company_handle = $2`,
       [title, companyHandle]);

  if (duplicateCheck.rows[0])
    throw new BadRequestError(`Duplicate job ${title} for company ${companyHandle}`);
    
    const result = await db.query(
        `INSERT INTO jobs
         (title, salary, equity, company_handle)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }  

  /** Find all jobs constricted to the possible filters:
   *   . title        any company with name similar to 'name'
   *   . minSalary:   all companies with num_employees >= 'minEmployees'
   *   . maxSalary:   all companies with num_employees <= 'maxEmployees'
   *
   *  'data' can have the optional key/value pairs like: 
   *     { 
   *       title:       <stringVariable>, 
   *       minSalary:   <floatVariable>,
   *       maxSalary:   <floatVariable> 
   *     }
   * 
   * If no filter variables are provided, then returns all jobs in the database
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */
  static async findAll(data={}) {
    const queryVerbs = { name: ' ILIKE ', minSalary: ' >= ', maxSalary: ' <= ' };
    let filterValues = null;
    
    if (data.minSalary > data.maxSalary) {
      throw new BadRequestError("Min salary cannot be greater than max");
    }
    let searchQuery = `SELECT id,
                        title,
                        salary,
                        equity,
                        company_handle AS "companyHandle"
                      FROM jobs`;
    if (data.title) data.title = `%${data.title}%`;
    
    if ( Object.keys(data).length !== 0 ){
      searchQuery +=  ' WHERE ' + Object.keys(data)
        .map( (key, index) => `${key !== 'title'? 'salary': 'title'}${queryVerbs[key]}$${index+1}`)
        .join(' AND ');
      
      filterValues = Object.values(data);
    }                    

    searchQuery += ' ORDER BY title'

    const jobResults = await db.query(searchQuery, filterValues);
    return jobResults.rows;
  }

  /** Given a job id, return data about job.
  *
  * Returns { id, title, salary, equity, companyHandle }
  *
  * Throws NotFoundError if not found.
  **/
  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"
          FROM jobs
          WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

/** Update job data with `data`.
*
* This is a "partial update" --- it's fine if data doesn't contain all the
* fields; this only changes provided ones.
*
* Data can include: {title, salary, equity}
*
* Returns { id, title, salary, equity, companyHandle }
*
* Throws NotFoundError if not found.
*/
  static async update(id, data) {
    if( Object.keys(data).length === 0) throw new BadRequestError();  
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
  *
  * Throws NotFoundError if company not found.
  **/
  static async remove(id) {
    const result = await db.query(
      `DELETE
       FROM jobs
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }  
}

module.exports = Job;