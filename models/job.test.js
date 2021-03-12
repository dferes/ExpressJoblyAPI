"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('Job.create()', () => {
  test('Create a new job when valid title, salary, equity, companyHandle paramaters are provided', async () => {
    const job = await  Job.create( {
      title:         'Data Scientist',
      salary:        125500, 
      equity:        0.375,
      companyHandle: 'c1'
    });
    
    expect(job.id).toEqual(expect.any(Number));
    expect(job.title).toEqual('Data Scientist');
    expect(job.salary).toEqual(125500);
    expect(job.equity).toEqual('0.375');
    expect(job.companyHandle).toEqual('c1');

  });
  test(`Fails to create a new job when a duplicate title-companyHandle combination is provided, 
    throws a BadRequestError`, async () => {
    try {
      await Job.create( {
        title:         'Full Stack Developer',
        salary:        11000, 
        equity:        0.25,
        companyHandle: 'c1'
      });
    } catch(err) {
      expect( err instanceof BadRequestError).toBeTruthy();  
    }
  });
});

/************************************** findAll */

describe("Job.findAll()", () => {
  test("retrieves a list of all jobs in the jobs table when no filter is provided", async () => {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id:            expect.any(Number),
        title:         "Data Scientist",
        salary:        118000,
        equity:        "0.625",
        companyHandle: "c3"
      },
      {
        id:            expect.any(Number),
        title:         "Full Stack Developer",
        salary:        110000,
        equity:        "0.25",
        companyHandle: "c1"
      },
      {
        id:            expect.any(Number),
        title:         "Machine Learning Engineer",
        salary:        128000,
        equity:        "0.45",
        companyHandle: "c2"
      }
    ]);
  });
  
//   test("works: name filter, returns company with handle c1", async function () {
//     let companies = await Company.findAll({name: 'c1'});
//     expect(companies).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       }
//     ]);
//   });
//   test("works: minEmployee filter, returns company with handle c3", async function () {
//     let companies = await Company.findAll({ minEmployees: 3});
//     expect(companies).toEqual([
//       {
//         handle: "c3",
//         name: "C3",
//         description: "Desc3",
//         numEmployees: 3,
//         logoUrl: "http://c3.img",
//       }
//     ]);
//   });
//   test("works: maxEmployee filter, returns company with handle c1", async function () {
//     let companies = await Company.findAll({ maxEmployees: 1});
//     expect(companies).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       }
//     ]);
//   });
//   test("works: maxEmployee and minEmployee filter, returns companies with the handle c1 and c2 ", async function () {
//     let companies = await Company.findAll({ minEmployees: 1, maxEmployees: 2});
//     expect(companies).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//       {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       }
//     ]);
//   });
//   test("works: maxEmployee, name and minEmployee filter, returns company with the handle c1 ", async function () {
//     let companies = await Company.findAll({ name: 'C1', minEmployees: 1, maxEmployees: 3});
//     expect(companies).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       }
//     ]);
//   });
//   test("works: name filter, returns an empty array when nothing in the database meets the search criteria ", async function () {
//     let companies = await Company.findAll({ name: 'B1'});
//     expect(companies).toEqual([]);
//   });
//   test("fails: maxEmployee and minEmployee filter, returns BadRequestError ", async function () {
//     expect.assertions(1);
//     try{
//       await Company.findAll({ minEmployees: 2, maxEmployees: 1});
//     }catch(err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   });
  
});

/************************************** get */

describe("Job.get(id)", () => {
  let testJob;
  beforeEach( async () => {
    testJob = await  Job.create( {
        title:         'Data Scientist',
        salary:        125500, 
        equity:        0.375,
        companyHandle: 'c1'
    });
  });  
  test("retrieves a Job object when a valid id paramater is passed", async () => {
    let job = await Job.get(testJob.id);
    expect(job).toEqual({
      id:            testJob.id,
      title:         testJob.title,
      salary:        testJob.salary,
      equity:        testJob.equity,
      companyHandle: testJob.companyHandle  
    });
  });
  
  test("Fails to retrieve a job object when the id parameter passed does not exist", async () => {
    try {
      await Job.get(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("Job.update(id, data)", () => {
  let testJob;
  beforeEach( async () => {
    testJob = await  Job.create( {
      title:         'Data Scientist',
      salary:        125500, 
      equity:        0.375,
      companyHandle: 'c1'
    });
  });  

  const updateData = {
    title:         'Data Scientist 2',
    salary:        137000, 
    equity:        0.475
  };
  
  test(`Updates a job successfully when valid json data is passed as updateData and the job 
    id is valid`, async () => {
    let updatedJob = await Job.update(testJob.id, updateData);
    
    expect(updatedJob).toEqual({
      id: testJob.id,
      title: 'Data Scientist 2',
      salary: 137000,
      equity: '0.475',
      companyHandle: 'c1'
    });
  
    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE id = ${testJob.id}`);
    expect(result.rows).toEqual([{
      id: testJob.id,
      title: 'Data Scientist 2',
      salary: 137000,
      equity: '0.475',
      companyHandle: 'c1'
    }]);
 });
  
  test("Fails to update a job when the id passed does not belong to an existing job", async () => {
    expect.assertions(1);
    try {
      const updateData = {
        title: "Data Scientist 3",
        salary: 150000,
        equity: 0.5,
      };
      await Job.update(0, updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();  
    }
  });
  test("Fails to update a job when the id passed is valid but no update data is passed", async () => {
    try {
      await Job.update(testJob.id, {});
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();  
    }
  });
});

/************************************** remove */

describe("Job.remove(id)", () => {
  let testJob;
  beforeEach( async () => {
    testJob = await  Job.create( {
      title:         'Data Scientist',
      salary:        125500, 
      equity:        0.375,
      companyHandle: 'c1'
    });  
  })  
  test("deletes a job object when a valid job id is passed as a variable", async () => {
    await Job.remove(testJob.id);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${testJob.id}`);
    expect(res.rows.length).toEqual(0);
  });
  
  test("Fails to delete a job if the id parameter passed is not associated with a job", async () => {
    try {
      await Job.remove(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});