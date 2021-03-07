const { BadRequestError } = require("../expressError");

/**
 * Takes two parameters: 
 *    dataToJoin: an object containing field names to be changed, such as username
 *    jsToSql:    an object with key names in camelCase and values with the same name,
 *                but in snake_case (eg. { firstName: 'first_name'} )
 * 
 * Returns an object containing:
 *    a string in the form of "variable_name" =$1 to be used as input for a SQL query
 *    a list of the updated field values  
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
