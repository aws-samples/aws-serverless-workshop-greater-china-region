'use strict';

var AWS = require("aws-sdk");
var unmarshalItem = require("dynamodb-marshaler").unmarshalItem;
var unmarshal = require("dynamodb-marshaler").unmarshal;
var Papa = require("papaparse");
var fs = require("fs");
var crypto = require('crypto');

var headers = [];
var unMarshalledArray = [];

var rowCount = 0;
var writeCount = 0;
var writeChunk = process.env.writeChunk ? process.env.writeChunk : 5000;

var dynamoDB = new AWS.DynamoDB();
const s3 = new AWS.S3();

function unifyInAction (inAction) {
  switch(inAction) {
    case 'describe':
      return 'describe';
    case 'dump':
      return 'dump';
    default:
      console.log("inAction value is invalid, using default dump");
      return 'dump';
  }
};

function random (howMany, chars) {
      chars = chars
        || 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';
    var rnd = crypto.randomBytes(howMany)
        , value = new Array(howMany)
        , len = Math.min(256, chars.length)
        , d = 256 / len

    for (var i = 0; i < howMany; i++) {
          value[i] = chars[Math.floor(rnd[i] / d)]
    };

    return value.join('');
};


var describeTable = function (query, inTableName, event, callback) {
  console.log('Do describeTable');
  var params = {
    TableName: inTableName
  };
  dynamoDB.describeTable(params,
    function (err, data) {
      if (err) {
        console.log(err, err.stack);
        callback(err);
      } else {
        const response = {
          statusCode: 200,
          body: {
            message: 'Go Serverless v1.0! Your function executed successfully!',
            input: event,
            output: data
          },
        };
        callback(null, response);
      }
    }
  );
};

var scanDynamoDB = function (query, stream, s3Bucket, s3Key, event, callback) {
  console.log('Do scanDynamoDB');
  dynamoDB.scan(query, function (err, data) {
    if (!err) {
      unMarshalIntoArray(data.Items); // Print out the subset of results.
      if (data.LastEvaluatedKey) {
        // Result is incomplete; there is more to come.
        query.ExclusiveStartKey = data.LastEvaluatedKey;
        if (rowCount >= writeChunk) {
          // once the designated number of items has been read, write out to stream.
          console.log('Do scanDynamoDB rowCount ', rowCount, ' ,writeCount ', writeCount);
          unparseData(data.LastEvaluatedKey, stream, s3Bucket, s3Key, event, callback);
        }
        scanDynamoDB(query, stream, s3Bucket, s3Key, event, callback);
      } else {
        console.log('Do scanDynamoDB rowCount ', rowCount, ' ,writeCount ', writeCount);
        unparseData("File Written", stream, s3Bucket, s3Key, event, callback);
      }
    } else {
      console.error(err);
    }
  });
};

var unparseData = function (lastEvaluatedKey, stream, s3Bucket, s3Key, event, callback) {
  var endData = Papa.unparse({
    fields: [...headers],
    data: unMarshalledArray
  });
  if (writeCount > 0) {
    // remove column names after first write chunk.
    endData = endData.replace(/(.*\r\n)/, "");;
  }
  writeData(endData, stream, s3Bucket, s3Key, event, callback);
  // Print last evaluated key so process can be continued after stop.
  console.log(lastEvaluatedKey);

  // reset write array. saves memory
  unMarshalledArray = [];
  writeCount += rowCount;
  console.log('Do unparseData rowCount ', rowCount, ' ,writeCount ', writeCount);
  rowCount = 0;
};

var writeData = function (data, stream, s3Bucket, s3Key, event, callback) {
  stream.write(data, function(err){
    if (err) {
      console.log(err, err.stack);
      callback(err);
    }else{
      let params = {
        Bucket: s3Bucket,
        Key: s3Key,
        Body: data
      };
      s3.putObject(params, 
        function(err) {
          if (err) {
              console.log(err, err.stack);
              callback(err);
          } else {
            const response = {
              statusCode: 200,
              body: {
                message: 'Upload the DynamoDB dump to S3. Your function executed successfully!',
                input: event
              },
            };
            callback(null, response);
          }
        }
      );
    }
  });
};

function unMarshalIntoArray(items) {
  if (items.length === 0) return;

  items.forEach(function (row) {
    let newRow = {};

    //console.log( 'Row: ' + JSON.stringify( row ));
    Object.keys(row).forEach(function (key) {
      if (headers.indexOf(key.trim()) === -1) {
        console.log( 'putting new key ' + key.trim() + ' into headers ' + headers.toString());
        headers.push(key.trim());
      }
      let newValue = unmarshal(row[key]);

      if (typeof newValue === "object") {
        newRow[key] = JSON.stringify(newValue);
      } else {
        newRow[key] = newValue;
      }
    });

    //console.log( newRow );
    unMarshalledArray.push(newRow);
    rowCount++;
  });
};

module.exports.hello = function(event, context, callback) {
  const options = {
    tablename: event.tablename,
    s3bucket: event.s3bucket,
    filename: event.filename,
    action: event.action,
  }

  var inTableName = options.tablename ? options.tablename : process.env.inTableName;
  if (!inTableName) {
    console.log("You must specify a table");
    process.exit(1);
  }
  var inAction = options.action ? options.action : process.env.inAction;
  var doAction = unifyInAction(inAction);
  var outFileName = options.filename ? options.filename : process.env.outFileName;
  // if there is a target file, open a write stream
  if (doAction == 'dump' && !outFileName) {
    outFileName = random(32);
  }
  var tempfile = '/tmp/' + outFileName;
  var stream = fs.createWriteStream(tempfile, { flags: 'a' });
  var outS3Bucket = options.s3bucket ? options.s3bucket : process.env.outS3Bucket;

  var query = {
    TableName: inTableName,
    Limit: 1000
  };

  if (doAction == 'describe') {
    describeTable(query, inTableName, event, callback);
  }else {
    scanDynamoDB(query, stream, outS3Bucket, outFileName, event, callback);
  }

};
