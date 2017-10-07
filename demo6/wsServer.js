//观察者
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
app.listen(3000);
function handler (req, res) {
  fs.readFile('./index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

//服务端与客户端同步的数据类型
function Desk(){
  this.playerlist=[];

  this.addPlayer = function(player){
    player.position = this.playerlist.length;
    this.playerlist.push(player);
  }
  this.removePlayer = function(username){
    this.playerlist.splice(this.getPlayer(username).position,1);
  }
  this.getPlayer = function(username){
    for(i=0;i<this.playerlist.length;i++){
      if(this.playerlist[i].username == username){
        return this.playerlist[i];
      }
    }
    return null;
  }
}
function Player(name){
  this.username = name;
  this.position = -1;
  this.cards = [];
}
//--------------------------------


function CardDealer(){
  this.cardGroup = [];
  this.cursor = 1;
  //1->13 方片
  //14->26 梅花
  //27->39 红桃
  //40->52 黑桃
  for(i=1;i<=52;i++){
    this.cardGroup.push(i);
  }
  //洗牌，包括从玩家手中拿回牌
  this.shuffle = function(desk){
    for(i=0;i<desk.playerlist.length;i++){
      desk.playerlist[i].cards.splice(0,desk.playerlist[i].cards.length);
    }
    this.cardGroup.sort(randomCmp);
    this.cursor = 1;
  }
  //发牌
  this.deal = function(desk){
    for(i=0;i<desk.playerlist.length;i++){
      desk.playerlist[i].cards.push(this.cardGroup[this.cursor++]);
      console.log(desk.playerlist[i].cards);
    }
  }
}
function randomCmp(a, b) {
  return Math.random() > 0.5 ? -1 : 1;
}


//桌面，包括玩家信息
desk = new Desk();
//发牌器，方法传入桌面信息，可洗牌、发牌
cardDealer = new CardDealer();

//收到订阅消息，新增订阅者
io.on('connection', function (socket) {
  console.log("客户端建立连接");

  //订阅者上送用户名
  socket.on('username',function(data){
    socket.nickname = data;
    console.log("客户端上送用户名:"+data);
    var player = new Player(data);
    desk.addPlayer(player);
    io.emit('enter',desk);
    
    socket.on('ready',function(data){
      cardDealer.shuffle(desk);
      for(var i=0;i<4;i++){
        cardDealer.deal(desk);
      }
      io.emit('dealcard',desk);
    })

    socket.on('disconnect',function(){
      desk.removePlayer(socket.nickname);
      console.log(socket.nickname+"离开");
    })
  })
});