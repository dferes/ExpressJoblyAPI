"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, verifyIsAdmin } = require("../middleware/auth");
const Company = require("../models/company");

// need to import json schemas here 

const router = new express.Router();



module.exports = router