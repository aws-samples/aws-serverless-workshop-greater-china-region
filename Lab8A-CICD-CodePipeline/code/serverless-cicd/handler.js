'use strict';

module.exports.endpoint = (event, context, callback) => {
  // console.log("Serverless CICD....");
  console.log("Serverless CICD demo....");
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, the current time is ${new Date().toTimeString()}.`,
    }),
  };

  callback(null, response);
};
