"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");
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

/************************************** POST /users */

describe("POST /users", function () {
  test("works for admin users: create non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("works for admin users: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("fails to create admin when logged in user is not an admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.status).toEqual(401);
    expect(resp.body.error.message).toEqual("Unauthorized");
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("cannot retrieve list of all users when the logged in user is not an admin, returns a 401 message", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.status).toEqual(401);
    expect(resp.body.error.message).toEqual('Unauthorized');
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for admin user who does not own the user account", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body.user).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
      jobs: []
    });
  });

  test("works for non admin user who owns the user account", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body.user).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
      jobs: []
    });
  });
  
  test(`fails to retrieve user info associated with 'username' when the logged in user is not an 
    admin or the the owner of account`, async function () {
    const resp = await request(app)
      .get(`/users/u2`)
      .set("authorization", `Bearer ${u1Token}`);
    
    expect(resp.status).toEqual(401);  
    expect(resp.body.error.message).toEqual("Unauthorized");
  });

  test("unauthorized for anon", async function () {
    const resp = await request(app)
      .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
      .get(`/users/nope`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for admin users", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for non admin users who own the account", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      }
    });
  });

  test("fails for users who do not have admin privileges and who do not own the account", async function () {
    const resp = await request(app)
        .patch(`/users/u2`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.status).toEqual(401);    
    expect(resp.body.error.message).toEqual('Unauthorized');
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("can set new password when logged in user is admin", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });

  test(`can set new password when logged in user is the owner of the account
    associated with the provided username`, async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});


/************************************** POST /users/:username/jobs/:id */

describe("POST /jobs/:id", () => {
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
  })  
  test(`can create a job application when the logged in user has a username that matches 
    the user token and the id passed in the query is valid`, async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/${job1.id}`)
      .set("authorization", `Bearer ${u1Token}`);
   
    expect(resp.status).toEqual(201);
    expect(resp.body).toEqual({ applied: job1.id })
  });
  test(`can create a job application when the logged in user has admin privileges and the 
    id passed in the query is valid`, async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/${job1.id}`)
      .set("authorization", `Bearer ${adminToken}`);
    
    expect(resp.status).toEqual(201);
    expect(resp.body).toEqual({ applied: job1.id })
  });
  test(`Fails to create a job application when the logged in user has a username that matches 
    the user token but the id passed in the query not an integer`, async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/blah`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body.error.message[0]).toEqual('instance.id is not of a type(s) integer');
    expect(resp.status).toEqual(400);
  });
  test(`Fails to create a job application when the logged in user has a username that matches 
    the user token but the id passed in the query is not valid`, async () => {
    const resp = await request(app)
    .post(`/users/u1/jobs/0`)
    .set("authorization", `Bearer ${u1Token}`);

  expect(resp.body.error.message).toEqual('No such job: 0');
  expect(resp.status).toEqual(404);
  });
  test(`returns a 401 unauthorized error when the user that is logged in does not have admin privileges and 
    is not the owner of the account with the provided username`, async () => {
    const resp = await request(app)
      .post(`/users/someUser123/jobs/${job1.id}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.status).toEqual(401);
  });

});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for a non-admin user, but who owns the account ", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("fails for users that do not have admin privileges and who do not own the account ", async function () {
    const resp = await request(app)
        .delete(`/users/u2`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.status).toEqual(401);
    expect(resp.body.error.message).toEqual('Unauthorized');
  });

  test("unauthorized for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
