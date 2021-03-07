const { BadRequestError } = require('../expressError');
const { sqlForPartialUpdate } = require('./sql');

describe('works: sqlForPartialUpdate', () => {
  test('sqlForPartialUpdate works when both paramaters are provided and valid', () => {
    const dataToUpdate = {username: "someUser", firstName: "Teddy"};
    const sqlResponse = sqlForPartialUpdate(
      dataToUpdate,
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      }
    );
    
    expect(sqlResponse.setCols).toEqual('"username"=$1, "first_name"=$2');
    expect(sqlResponse.values).toEqual(['someUser', 'Teddy']);
  });

  test('throws BadRequestError when the dataTpUpdate object is empty', () => {
    expect.assertions(1);
    try {
      const sqlResponse = sqlForPartialUpdate(
        {},
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        }
      );
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
})