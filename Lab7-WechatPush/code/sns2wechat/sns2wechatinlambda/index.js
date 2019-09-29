'use strict';

console.log('Loading function');
var WechatAPI = require('wechat-api');

var appid = 'wx1234cd5ds9dfg89'
var appsecret = '123abcdefg3b298674ce60c0ejf87ds'
var api = new WechatAPI(appid, appsecret);

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    const message1 = event.Records[0].Sns.Message;
    console.log('From SNS:', message1);
    var message = JSON.parse(message1);
    // var templateId = '7BCdeF9hIJ0Kl-aB6KvJ59ZM7jfj6fBIf1OL_-dDFb6'
    var templateId = message.templateId
    console.log(">>>>>>>>");
    console.log(message.templateId);
    // URL置空，则在发送后,点击模板消息会进入一个空白页面（ios）, 或无法点击（android）
    // var url =  'z.cn';
    var url = message.url;
    // var openid = 'opDi3TmaFiF98ABCDEF_9M9nHJK';
    var openid = message.openid;
    var data = {
       "first": {
         "value":message.first,
         "color":"#173177"
       },
       "keyword1":{
         "value":message.keyword1,
         "color":"#173177"
       },
       "keyword2": {
         "value":message.keyword2,
         "color":"#173177"
       },
       "keyword3": {
         "value":message.keyword3,
         "color":"#173177"
       },
       "remark":{
         "value":message.remark,
         "color":"#173177"
       }
    };
    api.sendTemplate(openid, templateId, url, data, function (err, res) {
    if (err) return console.error(err);
    console.log(JSON.stringify(res));
});
    callback(null, message);
};
