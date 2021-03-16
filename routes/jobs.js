"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, verifyIsAdmin, ensureAdminOrOwner } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobSearchFilter = require("../schemas/jobSearchFilter.json");
const jobUpdateSchema = require("../schemas/jobUpdateSchema.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: Admin
 */
 router.post("/", [ensureLoggedIn, verifyIsAdmin], async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * 
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - maxSalary
 *
 * Authorization required: none
 */
 router.get("/", async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, jobSearchFilter);

    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const jobs = await Job.findAll(req.body);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /:id  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */
 router.get("/:id", async (req, res, next) => {
  try {
    if( isNaN(req.params.id) ) throw new BadRequestError('Invalid input for type integer');  
    
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /:id { field1, field2, field2 } => { job }
*
* Patches job data.
*
* fields (optional) can be: { title, salary, equity }
*
* Returns { id, title, salary, equity, companyHandle }
* 
* Authorization required: Admin
*/
router.patch("/:id", [ensureLoggedIn, verifyIsAdmin], async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /:id  =>  { deleted: id }
 *
 * Authorization: Admin
 */
router.delete("/:id", [ensureLoggedIn, verifyIsAdmin], async (req, res, next) => {
  try {
    if ( isNaN(req.params.id)) throw new BadRequestError('Invalid input for type integer');  
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router