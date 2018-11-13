'use strict';

const http = require('http');
const botkit = require('botkit');
const uuidv1 = require('uuid/v1');
const uuidv4 = require('uuid/v4');
const uuidv5 = require('uuid/v5');
const STATIC = require('node-static');
const path = require('path');
const port = 2587;
const staticPath = path.join(__dirname, 'static');
const staticServer = new STATIC.Server(staticPath);
const queryString = require('query-string');

const controller = botkit.slackbot({debug: false});

const macAdToRoom = {
  //'70:db:98:d1:1f:4e': '多分別館の通路の何処かs',
  //'70:db:98:0f:6f:fe': '多分プロクラ',
  //'70:df:2f:ec:4a:4e': '多分別館C',
  '70:db:98:0f:6f:f1': '多分プロクラ',
  '70:db:98:d1:1f:41': '多分別館C',
  '70:df:2f:ec:4a:41': '多分別館A',
  '00:2c:c8:64:c8:f1': '多分別館の通路の何処か',
  //'00:2c:c8:64:c8:fe': '何処かH'
};

let slackToUserId = {};
let userIdAndMacAd = {};

const userIdToSlack=userId=>{
  let result = '';
  for(let slack in slackToUserId){
    if(slackToUserId[slack] === userId){
      result = slack;
      break;
    }
  }
  return result;
};

const BOT = controller.spawn({
  token: process.env.token
}).startRTM((err)=>{
  if(err) throw new Error(err);
});

controller.hears(/^!/, ['ambient', 'direct_message'], (bot, msg)=>{
  bot.reply(msg, 'a');
});

controller.hears(/^!connect/, ['direct_message'], (bot, msg)=>{
  if(slackToUserId[msg.user]) userIdAndMacAd[slackToUserId[msg.user]] = null;
  slackToUserId[msg.user] = uuidv5(uuidv4(), uuidv1());
  userIdAndMacAd[slackToUserId[msg.user]] = 'waiting';
  bot.reply(msg, slackToUserId[msg.user]);
});

http.createServer((req, res)=>{
  req.setEncoding("utf-8");
  switch(req.url){
    case '/favicon.ico':
      staticServer.serveFile('/favicon.ico', 200, {}, req, res);
      break;
    case '/report':
      req.on('data', reqData=>{
        const data = queryString.parse(reqData);
        if(userIdAndMacAd[data.userId] === data.mac){
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write('by simple-witp');
          res.end();
        }else{
          userIdAndMacAd[data.userId] = data.mac;
          BOT.say({
            channel: 'CD31FJ48P',
            text: `<@${userIdToSlack(data.userId)}> : ${macAdToRoom[data.mac]}`
          });
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write('by simple-witp');
          res.end();
        }
      });
      break;
    default:
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.write('404 by simple-witp');
      res.end();
      break;
  }
}).listen(port, '0.0.0.0', ()=>{
  console.log(`Server running at localhost:${port}`);
});
