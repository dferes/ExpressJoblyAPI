"use strict";

const { search } = require("../app");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies constricted to the possible filters:
   *   . name          any company with name similar to 'name'
   *   . minEmployees: all companies with num_employees >= 'minEmployees'
   *   . maxEmployees: all companies with num_employees <= 'maxEmployees'
   *
   *  'data' can have the optional key/value pairs like: 
   *     { 
   *       name:         <stringVariable>, 
   *       minEmployees: <intVariable>,
   *       maxEmployees: <intVariable> 
   *     }
   * 
   * If no filter variables are provided, then returns all companies in the database
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */
  static async findAll(data) {
    const queryVerbs = { name: ' ILIKE ', minEmployees: ' >= ', maxEmployees: ' <= ' };
    let filterValues = null;
    
    if (data.minEmployees > data.maxEmployees) {
      throw new BadRequestError("Min employees cannot be greater than max");
    }
    let searchQuery = `SELECT handle,
                        name,
                        description,
                        num_employees AS "numEmployees",
                        logo_url AS "logoUrl"
                      FROM companies`;
    if (data.name) {
      data.name = `%${data.name}%`;
    }
    
    if ( Object.keys(data).length !== 0 ){
      searchQuery +=  ' WHERE ' + Object.keys(data)
        .map( (key, index) => `${key !== 'name'? 'num_employees': 'name'}${queryVerbs[key]}$${index+1}`)
        .join(' AND ');
      
      filterValues = Object.values(data);
    }                    

    searchQuery += ' ORDER BY name'

    const companyResults = await db.query(searchQuery, filterValues);
    return companyResults.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/
  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */
  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/
  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
