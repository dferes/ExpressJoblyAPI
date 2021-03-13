"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", () => {
  const newJob = {
    title: "Machine Learning Engineer",
    salary: 120000,
    equity: 0.375,
    companyHandle: "c1"
  }

  test("creates a new job when valid JSON data is passed in the request body", async () => {
    const jobResponse = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    
    expect(jobResponse.statusCode).toEqual(201);
    expect(jobResponse.body.job.id).toEqual( expect.any(Number) );
    expect(jobResponse.body.job.title).toEqual( newJob.title );
    expect(jobResponse.body.job.salary).toEqual( newJob.salary );
    expect(jobResponse.body.job.equity).toEqual( String(newJob.equity) );
    expect(jobResponse.body.job.companyHandle).toEqual( newJob.companyHandle );
  });

  test("Fails to create a new job when there is missing JSON data in the request body", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: 'Data Engineer',
        salary: 108000,
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
  });

  test("Fails to create a new job when invalid JSON data is sent through the request body", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "Full Stack Developer",
        salary: "NaN",
        equity: false,
        companyHandle: 'c1'
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message).toEqual([
        'instance.salary is not of a type(s) integer',
        'instance.equity is not of a type(s) number'
    ]);
  });

  test("cannot create a new company when user is not an admin, throws a 401 error", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send({ ...newJob })
       .set("authorization", `Bearer ${u1Token}`);
        
    expect(resp.statusCode).toEqual(401);
    expect(resp.body.error.message).toEqual('Unauthorized');
  });
});

/************************************** GET /companies */

describe("GET /jobs", () => {
  let job1, job2, job3;
  beforeEach( async () => {
    job1 = await Job.create(
      {
        title: 'Data Scientist',
        salary: 115000,
        equity: 0.25,
        companyHandle: 'c1'
      }
    );
    job2 = await Job.create(
      {
        title: 'Full Stack Developer',
        salary: 108000,
        equity: 0.28,
        companyHandle: 'c2'
      }
    );
    job3 = await Job.create(
      {
        title: 'Machine Learning Engineer',
        salary: 125000,
        equity: 0.312,
        companyHandle: 'c3'
      }
    );      
  })  
  test("Retrieves a list of all jobs when an anonymous user makes a request", async () => {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: 'Accountant',
          salary: 89000,
          equity: '0.25',
          companyHandle: 'c3'
        },
        {
          id: job1.id,
          title: "Data Scientist",
          salary: 115000,
          equity: '0.25',
          companyHandle: "c1",
        },
        {
          id: job2.id,
          title: "Full Stack Developer",
          salary: 108000,
          equity: '0.28',
          companyHandle: "c2",
        },
        {
          id: job3.id,
          title: "Machine Learning Engineer",
          salary: 125000,
          equity: '0.312',
          companyHandle: "c3",
        },
        {
          id: expect.any(Number),
          title: 'Manager',
          salary: 103000,
          equity: '0.125',
          companyHandle: 'c3'
        }
      ]
    });
  });
  test(`retrieves the job with a similar title when a similar title paramater is sent in the 
    request body as JSON`, async () => {
    const resp = await request(app)
      .get("/jobs")
      .send({ title: 'Data'});

    expect(resp.body.jobs).toEqual([{
      id:            job1.id,  
      title:         job1.title,
      salary:        job1.salary,
      equity:        job1.equity,
      companyHandle: job1.companyHandle  
    }]);
  });
  test(`returns all jobs with a salary >= minSalary when valid json 'minSalary' 
    data is sent in the request body`, async () => {
    const resp = await request(app)
      .get("/jobs")
      .send({ minSalary: 109000 });

    expect(resp.body).toEqual({
      jobs: [
        {
          id:   job1.id,  
          title: job1.title,
          salary: job1.salary,
          equity: job1.equity,
          companyHandle: job1.companyHandle
        },
        {
          id:   job3.id,  
          title: job3.title,
          salary: job3.salary,
          equity: job3.equity,
          companyHandle: job3.companyHandle
        }
      ]
    });
  });
  test(`returns all jobs with a salary <= maxSalary when valid json 'maxSalary' 
    data is sent in the request body`, async () => {
    const resp = await request(app)
      .get("/jobs")
      .send({ maxSalary: 116000 });
  
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: 'Accountant',
          salary: 89000,
          equity: '0.25',
          companyHandle: 'c3'
        },
        {
          id:   job1.id,  
          title: job1.title,
          salary: job1.salary,
          equity: job1.equity,
          companyHandle: job1.companyHandle
        },
        {
          id:   job2.id,  
          title: job2.title,
          salary: job2.salary,
          equity: job2.equity,
          companyHandle: job2.companyHandle
        },
        {
          id: expect.any(Number),
          title: 'Manager',
          salary: 103000,
          equity: '0.125',
          companyHandle: 'c3'
        }
      ]
    });
  });
  test(`returns all jobs with minSalary <= salary <= maxSalary when valid json 'maxSalary' 
    and 'minsalary' data is sent in the request body`, async () => {
    const resp = await request(app)
      .get("/jobs")
      .send({ 
        minSalary: 110000,
        maxSalary: 116000 
      });

    expect(resp.body).toEqual({
      jobs: [
        {
          id:   job1.id,  
          title: job1.title,
          salary: job1.salary,
          equity: job1.equity,
          companyHandle: job1.companyHandle
        }
      ]
    });
  });
  test(`returns all jobs with minSalary <= salary <= maxSalary and title similar to 'Developer' 
    when valid json 'maxSalary', 'minSalary' and 'title' data is sent in the request body`, async () => {
    const resp = await request(app)
      .get("/jobs")
      .send({ 
        title: 'Developer',  
        minSalary: 105000,
        maxSalary: 110000 
      });
    
    expect(resp.body).toEqual({
      jobs: [
        {
          id:   job2.id,  
          title: job2.title,
          salary: job2.salary,
          equity: job2.equity,
          companyHandle: job2.companyHandle
        }
      ]
    });
  });
  test(`returns a 400 error when the key provided in the json body is not one of 
    the three valid keys`, async () => {
    const resp = await request(app)
      .get("/jobs")
      .send({ numberOfTemps: 3 });
    expect(resp.status).toEqual(400);
    expect(resp.body.error.message)
      .toEqual(["instance additionalProperty \"numberOfTemps\" exists in instance when not allowed"]);
  });
  test(`returns a 400 error when ONE OF the keys provided in the json body is not 
    one of the three valid keys`, async function () {
    const resp = await request(app)
      .get("/companies")
      .send({ 
        hasCoffeeMachine: true,
        title: 'Machine',
        minSalary: 110000,
        maxSalary: 123000
      });

    expect(resp.status).toEqual(400);
    expect(resp.body.error.message[0])
      .toEqual("instance additionalProperty \"hasCoffeeMachine\" exists in instance when not allowed");
  });
  test("fails: test next() handler", async () => {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /:id */

describe("GET /jobs/:id", () => {
  let job1;
  beforeEach( async () => {
    job1 = await Job.create(
      {
        title: 'Data Scientist',
        salary: 115000,
        equity: 0.25,
        companyHandle: 'c1'
      }
    );
  });  
  test(`throws an invalid type error when the id parameter is not an integer`, async () => {
    const resp = await request(app).get(`/jobs/blah`);
    expect(resp.status).toEqual(400);
    expect(resp.body.error.message).toEqual('Invalid input for type integer');
  });
  
  test("throws a 404 error when the id parameter is valid but not found", async () => {
    const resp = await request(app).get(`/jobs/0`);
      expect(resp.status).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", () => {
  let job1;
  beforeEach( async () => {
    job1 = await Job.create(
      {
        title: 'Data Scientist',
        salary: 115000,
        equity: 0.25,
        companyHandle: 'c1'
      }
    );
  });     
  test(`can update a job when the logged in user had admin privileges and the id passed in 
    the query is valid`, async () => {
    const resp = await request(app)
      .patch(`/jobs/${job1.id}`)
      .send({
        title: "Data Scientist 2",
      })
      .set("authorization", `Bearer ${adminToken}`);
 
    expect(resp.body).toEqual({
      job: {
        id: job1.id,
        title: 'Data Scientist 2',
        salary: job1.salary,
        equity: job1.equity,
        companyHandle: job1.companyHandle
      }
    });
  });
  
  test(`returns a 401 unauthorized error when the user that is logged in does not have admin privileges`, async () => {
    const resp = await request(app)
      .patch(`/jobs/${job1.id}`)
      .send({
        title: "Data Scientist 2",
      })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.status).toEqual(401);
  });
  test(`returns a 401 unauthorized error when the user is anonymous`, async () => {
    const resp = await request(app)
      .patch(`/jobs/${job1.id}`)
      .send({
        title: "Data Scientist 2",
      })

    expect(resp.status).toEqual(401);
  });
  test("returns a 404 error when the id passed in the query is valid but does not exist", async () =>  {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "Machine Learning Engineer",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
  
  test("returns a 400 error when an attempt to change the job id is made", async () => {
    const resp = await request(app)
      .patch(`/jobs/${job1.id}`)
      .send({
       id: job1.id,
      })
      .set("authorization", `Bearer ${adminToken}`);
  
    expect(resp.statusCode).toEqual(400);
  });
  test("returns a 400 error when an attempt to change the job's companyHande is made", async () => {
    const resp = await request(app)
      .patch(`/jobs/${job1.id}`)
      .send({
       companyHandle: 'BadActor',
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
  });
  test("returns a 400 error when malformed data is sent in the request body", async () => {
    const resp = await request(app)
      .patch(`/jobs/${job1.id}`)
      .send({
        title: false,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", () => {
  let job1;
  beforeEach( async () => {
    job1 = await Job.create(
      {
        title: 'Data Scientist',
        salary: 115000,
        equity: 0.25,
        companyHandle: 'c1'
      }
    );
  });       
  test("can delete a job when the logged in user has admin privileges", async () => {
    const id = job1.id;  
    const resp = await request(app)
      .delete(`/jobs/${job1.id}`)
      .set("authorization", `Bearer ${adminToken}`);
    
    expect(resp.body).toEqual({ deleted: String(id) });
  });
  test("returns a 401 error when the logged in user is not an admin", async () => {
    const resp = await request(app)
      .delete(`/jobs/${job1.ud}`)
      .set("authorization", `Bearer ${u1Token}`);
    
    expect(resp.status).toEqual(401);
    expect(resp.body.error.message).toEqual("Unauthorized");
  });
  
  test("returns a 401 error when the user is anonymous", async () => {
    const resp = await request(app)
      .delete(`/jobs/${job1.id}`);
    expect(resp.statusCode).toEqual(401);
  });
  
  test(`returns a 404 error when the logged in user has admin privileges and the id is valid 
    but does not exist`, async () => {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
