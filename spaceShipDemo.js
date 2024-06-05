var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var inGame = false;

var decayRate = .1;//to allow the ship to slow back down
var accRate = .25;//the rate at which the speed will increase
var maxAccRate = .75;//max acceleration
var maxSpeed = 6;//max speed

var maxBoundsX = canvas.width;
var maxBoundsY = canvas.height;
var minBoundsX = 0;
var minBoundsY = 0;

var mouseX = 0;
var mouseY = 0;

var keyMap = {87:false, 65:false, 68:false, 83:false};

var images = {};
var imageSources = {player:"images/clipart4321245.png",
                    bg:"images/bg.png",
                    bullet_red:"images/bullet_red.png",
                    bullet_blue:"images/bullet_blue.png",
                    enemy:"images/enemy_new.png",
                    healthDoge:"images/cross.png",
                    blaster:"images/blaster-refill.png",
                    cruiserImage:"images/cruiser_vorlon.png",
                    explosion_1:"images/explosions/exp_1.png",
                    explosion_2:"images/explosions/exp_2.png",
                    explosion_3:"images/explosions/exp_3.png",
                    explosion_4:"images/explosions/exp_4.png",
                    explosion_5:"images/explosions/exp_5.png",
                    explosion_6:"images/explosions/exp_6.png",
                    explosion_7:"images/explosions/exp_7.png",
                    explosion_8:"images/explosions/exp_8.png",
                    explosion_9:"images/explosions/exp_9.png",
                    explosion_10:"images/explosions/exp_10.png",
                    explosion_11:"images/explosions/exp_11.png",
                    explosion_12:"images/explosions/exp_12.png",
                    explosion_13:"images/explosions/exp_13.png",
                    explosion_14:"images/explosions/exp_14.png",
                    explosion_15:"images/explosions/exp_15.png",
                    explosion_16:"images/explosions/exp_16.png",
                    explosion_17:"images/explosions/exp_17.png",
                    explosion_18:"images/explosions/exp_18.png",
                    explosion_19:"images/explosions/exp_19.png",
                    explosion_20:"images/explosions/exp_20.png",
                    explosion_21:"images/explosions/exp_21.png",
                    explosion_22:"images/explosions/exp_22.png",
                    explosion_23:"images/explosions/exp_23.png",
                    explosion_24:"images/explosions/exp_24.png",
                    explosion_25:"images/explosions/exp_25.png"};

var explosionAudio = new Audio('audio/explosion.mp3');
var gunAudio = new Audio('audio/gunShot.mp3');
var bgAudio = new Audio('audio/Reformat.mp3');
bgAudio.loop = true;
//bgAudio.play();

var audioEnabled = false;

//this will hold all of the bullet objects
var bullets = [];
//to keep track of which bullet we have to remove or work with
var bulletID = -1;
var enemyBulletID = -1;
var bulletsShot = 0;

//will hold all types of enemy
var enemies = [];
//and this will keep track of all enemies in the array
var enemyID = -1;
var rotationStep = 0.075;

var enemyCount = 4;
var enemyDestroyCount = 0;
var enemyDestroyByBullet = 0;

var healthDogeID = -1;
var healthDoges = [];


var blasterRefillID = -1;
var blasterRefills = [];

var score = 0;

setCanvasSize ();

//this is the user's space ship
//it's global - so we can access it for the enemies to track
var ship;//we could also add a second player by adding the keyboard keys we want to use and adapting the key listener function
//that's for future me to take care of

var mainMenu = new MainMenu ();
var endOfGameScreen = new EndOfGameScreen ();

//will generate the enemies and be killed as your target
//var carrierShip;


//will be moved to a util file
//this is currently failing if the image isn't found - we need to capture it so we can use fallback images
//otherwise you get a blank canvas because of an error
function loadImages(sources, callback) {
  var images = {};
  var loadedImages = 0;
  var numImages = 0;
  // get num of sources
  for(var src in sources) {
    numImages++;
  }
  for(var src in sources) {
    images[src] = new Image();
    images[src].onload = function() {
      if(++loadedImages >= numImages) {
        callback(images);
      }
    };
    images[src].src = sources[src];
  }
}

//this function starts off the whole thing - when the images are finished loading it starts the animation
loadImages(imageSources, function(imageRet) {
  images = imageRet;

  ship = new Ship();
  for (var i = 0; i < enemyCount; i++)
  {
    generateEnemy ();
  }
  //carrierShip = new CarrierShip ();

  window.requestAnimationFrame (draw);
}); 

function MainMenu ()
{

  this.topLeftX;
  this.topLeftY;
  this.width;
  this.height;
  
  this.draw = function ()
  {

    ctx.save ();

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(this.topLeftX,this.topLeftY,this.width,this.height);

    var fontSize = (this.topLeftX + this.width)/12;
    ctx.font = fontSize+'px "Code-Bold"';
    ctx.fillStyle="black";
    ctx.fillText("START GAME",this.topLeftX+(this.width/8),this.topLeftY+(this.height/2));

    ctx.restore ();

  }
  this.calculateSize = function ()
  {
    this.topLeftX = (canvas.width/2) - (canvas.width/4);
    this.topLeftY = (canvas.height/2) - (canvas.height/4);
    this.width = (canvas.width/2);
    this.height = (canvas.height/2);
  }
  this.calculateSize();
}

function EndOfGameScreen ()
{
  this.topLeftX;
  this.topLeftY;
  this.width;
  this.height;


  this.draw = function ()
  {

    ctx.save ();

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(this.topLeftX,this.topLeftY,this.width,this.height);
    var accuracy = ((enemyDestroyByBullet/(bulletsShot))*100).toFixed (2);

    var fontSize = (this.topLeftX + this.width)/20;
    ctx.font = fontSize+'px "Code-Bold"';
    ctx.fillStyle="black";
    ctx.fillText("SCORE : " + score,this.topLeftX+(this.width/10),this.topLeftY+(this.height/4) - 20);
    ctx.fillText("SHIPS DESTROYED : " + enemyDestroyByBullet,this.topLeftX+(this.width/10),this.topLeftY+(this.height/2) - 20);
    ctx.fillText("SHOTS FIRED : " + bulletsShot,this.topLeftX+(this.width/10),this.topLeftY+(this.height - this.height/4) - 20);
    ctx.fillText("ACCURACY : " + accuracy+"%",this.topLeftX+(this.width/10),this.topLeftY+(this.height)) - 20;

    ctx.restore ();

  }
  this.calculateSize = function ()
  {
    this.topLeftX = (canvas.width/2) - (canvas.width/4);
    this.topLeftY = (canvas.height/2) - (canvas.height/4);
    this.width = (canvas.width/2);
    this.height = (canvas.height/2);
  }
  this.calculateSize();

}

function CarrierShip ()
{
  this.originalImageHeight = 294;
  this.originalImageWidth = 900;
  this.scaleX = 0.46875;//1920
  this.scaleY = 0.0028058361391695;//1080
  this.width = 0;
  this.height = 0;
  this.x = canvas.width;
  this.y = (canvas.height/2)/this.height;
  this.image = images["cruiserImage"];
  this.calculatePosition = function ()
  {

  }

  this.draw = function ()
  {
    ctx.save ();
    //ctx.translate (this.x, this.y);
    ctx.scale ((canvas.width/1920), (canvas.height/1080));
    //this.drawImage (this.image, this.x, this.y);
    ctx.drawImage(this.image, 0, 0);
    ctx.restore();
  }
}

function HealthDoge (id, xLoc, yLoc)
{
  this.id = id;
  this.healthAmount = 10;
  this.speed = 0.075;
  this.x = xLoc;
  this.y = yLoc;
  this.radius = 32;
  this.xDest = Math.random ()*canvas.width;
  this.yDest = Math.random ()*canvas.height;
  this.isFading = false;
  this.opacity = 1;

  this.calculatePosition = function ()
  {
    this.x += this.speed * Math.cos (this.xDest);
    this.y += this.speed * Math.sin (this.yDest);
  }

  this.draw = function ()
  {
    ctx.save ();
    ctx.translate (this.x+this.radius, this.y+this.radius);
    if (this.isFading)
    {
      this.opacity = this.opacity - 0.1;
      if (this.opacity <= 0)
      {
        removeDoge (this);
      }
    }
    ctx.globalAlpha = this.opacity;
    ctx.drawImage (images["healthDoge"], 0-this.radius, 0-this.radius);
    ctx.restore ();
  }
}

function BlasterRefill (id, xLoc, yLoc)
{
  this.id = id;
  this.blasterAmount = 50;
  this.speed = 0.075;
  this.x = xLoc;
  this.y = yLoc;
  this.radius = 32;
  this.xDest = Math.random ()*canvas.width;
  this.yDest = Math.random ()*canvas.height;
  this.isFading = false;
  this.opacity = 1;

  this.calculatePosition = function ()
  {
    this.x += this.speed * Math.cos (this.xDest);
    this.y += this.speed * Math.sin (this.yDest);
  }

  this.draw = function ()
  {
    ctx.save ();
    ctx.translate (this.x+this.radius, this.y+this.radius);
    if (this.isFading)
    {
      this.opacity = this.opacity - 0.1;
      if (this.opacity <= 0)
      {
        removeBlasterRefill (this);
      }
    }
    ctx.globalAlpha = this.opacity;
    ctx.drawImage (images["blaster"], 0-this.radius, 0-this.radius);
    ctx.restore ();
  }
}

function Enemy(id, xLoc, yLoc){
  this.id = id;
  this.x = xLoc;
  this.y = yLoc;
  this.vx = 0;//left-right speed
  this.vy = 0;//up-down speed
  this.ax = .1;//left-right acceleration
  this.ay = .1;//up-down acceleration
  this.dy = 0;//delta x (change in x)
  this.dy = 0;//delta y (change in y)
  this.radius = 37;
  this.correctRotation = 0;
  this.rotation = 0;
  this.prevDirection = -1;
  this.playerFollowRadius = 300;//if we're within 200 pixels of the player, follow them
  //otherwise, try to get to this location. If you run into another enemy, this will get reset to a random location
  this.trackX = Math.random()*canvas.width;
  this.trackY = Math.random()*canvas.height;
  this.prevTrackX = -1;
  this.prevTrackY = -1;
  this.maxSpeed = 1.5 + (Math.random()*4); //each enemy ship will have its own random speed

  this.newPointRadius = 35;
  this.currentExplosionFrame = 0;
  this.totalExplosionFrames = 25;
  this.isExploding = false;
  this.image = images["enemy"];
  this.elapsedFrames = 0;

  this.draw = function() 
  {
    ctx.save ();
    ctx.translate (this.x+this.radius, this.y+this.radius);
    ctx.rotate (this.rotation);
    if (this.currentExplosionFrame < 5)
    {
      ctx.drawImage (this.image, 0-this.radius, 0-this.radius);
      if (this.currentExplosionFrame == 1)
      {
        if (audioEnabled)
        {
          explosionAudio.stop();
          explosionAudio.play ();
        }
        if (testIfPointInsideCircle(this.x+this.radius, this.y+this.radius, ship.radius, ship.x+ship.radius, ship.y+ship.radius))
        {
          ship.health = ((ship.health -5) <= 0)?0:ship.health -5;
        }
      }
    }
    if (this.isExploding == true && this.currentExplosionFrame <= this.totalExplosionFrames)
    {
      this.currentExplosionFrame += 1;
      if (this.currentExplosionFrame > this.totalExplosionFrames)
      {
        console.log ("removing enemy");
        removeEnemy (this);
      }
      else
      {
        ctx.drawImage (images["explosion_" + this.currentExplosionFrame], 0-this.radius, 0-this.radius);
      }
    }
    ctx.restore ();
  }

  this.calculatePosition = function ()
  {
    var addAccX = (Math.abs (this.vx + this.ax) < this.maxSpeed)? this.ax : 0;
    var addAccY = (Math.abs (this.vy + this.ay) < this.maxSpeed)? this.ay : 0;
    this.ax = addAccX;
    this.ay = addAccY;
    this.vx += addAccX;
    this.vy += addAccY;
    if (!this.trackingPlayer ())
    {
      this.x += (this.rotation == this.correctRotation)?this.vx * Math.cos( (this.correctRotation)  ) : this.vx * Math.cos( (this.prevDirection) );
      this.y += (this.rotation == this.correctRotation)?this.vy * Math.sin( (this.correctRotation)  ) : this.vy * Math.sin( (this.prevDirection) );
    }
    else
    {
      this.x += this.vx * Math.cos( (this.correctRotation)  ) ;
      this.y += this.vy * Math.sin( (this.correctRotation)  ) ;

      this.elapsedFrames += 1;
      if (this.elapsedFrames % 25 == 0 || this.elapsedFrames % 40 == 0 && !this.isExploding)
      {
        if (audioEnabled)
        {
          gunAudio.stop();
          gunAudio.play();
        }
        enemyBulletID += 1;
        bullets.push (new Bullet(bulletID*enemyBulletID, this.x+this.radius, this.y+this.radius, this.rotation, "bad"));
      }
     
    }
    if (testIfPointInsideCircle (this.trackX, this.trackY, this.newPointRadius, this.x+ this.radius, this.y+ this.radius))
    {
      this.resetTrackingPosition ();
    }
  }

  this.resetTrackingPosition = function ()
  {
    this.prevTrackX = this.trackX;
    this.prevTrackY = this.trackY;
    this.prevDirection = angle (this.x, this.y + this.radius, this.prevTrackX, this.prevTrackY);
    this.trackX = Math.random()*canvas.width;
    this.trackY = Math.random()*canvas.height;
  }

  this.trackingPlayer = function ()
  {
    if (testIfPointInsideCircle (ship.x+ship.radius, ship.y+ship.radius, this.playerFollowRadius+(this.maxSpeed), this.x+ this.radius, this.y+ this.radius))
    {
      return true;
    }
    else
    {
      return false;
    }
  }

  this.calculateRotation = function  ()
  {
    //TODO - make them rotate in both directions (Will need to use the halfway point)
    //point to the player if you're within following distance
    //otherwise point to where you're tracking
    var destX = (this.trackingPlayer())?ship.x+ship.radius:this.trackX;
    var destY = (this.trackingPlayer())?ship.y+ship.radius:this.trackY;
    this.correctRotation = angle (this.x + this.radius, this.y + this.radius, destX, destY);
    if (this.correctRotation < this.rotation)
    {
      this.rotation = ( (this.rotation - rotationStep) < this.correctRotation)?this.correctRotation:this.rotation-rotationStep;
    }
    else
    {
      this.rotation = ( (this.rotation + rotationStep) > this.correctRotation)?this.correctRotation:this.rotation+rotationStep;
    }
  }

}

function Ship (){
  this.x = 100;
  this.y = 100;
  this.vx = 0;//left-right speed
  this.vy = 0;//up-down speed
  this.ax = 0;//left-right acceleration
  this.ay = 0;//up-down acceleration
  this.dy = 0;//delta x (change in x)
  this.dy = 0;//delta y (change in y)
  this.radius = 75;
  this.rotation = 0;
  this.health = 100;
  this.blasterCount = 30;
  this.draw = function(image) 
  {
    ctx.save ();
    ctx.translate (this.x+this.radius, this.y+this.radius);
    ctx.rotate (this.rotation);
    ctx.drawImage (image, 0-this.radius, 0-this.radius);
    ctx.restore ();
  }

  this.calculatePosition = function()
  {
    var addAccX = (Math.abs (this.vx + this.ax) < maxSpeed)? this.ax : 0;
    var addAccY = (Math.abs (this.vy + this.ay) < maxSpeed)? this.ay : 0;

    if (this.y + addAccY + this.vy > canvas.height || this.y + addAccY + this.vy< 0) 
    {
      this.vy = -this.vy;
      addAccX = 0;
      addAccY = 0;
    }
    if (this.x + addAccX + this.vx > canvas.width || this.x + addAccX + this.vx< 0) 
    {
      this.vx = -this.vx;
      addAccX = 0;
      addAccY = 0;
    }
    this.ax = addAccX;
    this.ay = addAccY;
    this.vx += addAccX;
    this.vy += addAccY;
    this.x += this.vx;
    this.y += this.vy;
    //slow down the player's horizontal trajectory
    if (this.vx > 0)
    {
      this.vx = (this.vx - decayRate < 0)?0:this.vx - decayRate;
    }
    else if (this.vx < 0)
    {
      this.vx = (this.vx + decayRate > 0)?0:this.vx + decayRate;
    }
    //slow down the players's vertical trajectory
    if (this.vy > 0)
    {
      this.vy = (this.vy - decayRate < 0)?0:this.vy - decayRate;
    }
    else if (this.vy < 0)
    {
      this.vy = (this.vy + decayRate > 0)?0:this.vy + decayRate;
    }
  }

  this.calculatePlayerRotation = function  ()
  {
    this.rotation = angle (this.x, this.y + this.radius, mouseX, mouseY);
  }
}

function Bullet (id, startX, startY, angle, type)
{
  this.id = id;
  this.speed = 35;
  this.initX = startX;
  this.initY = startY;
  this.x = this.initX;
  this.y = this.initY;
  this.width = 3;
  this.height = 10;
  this.radius = 1;
  this.angle = angle;
  this.type = type;


  this.calculatePosition = function ()
  {
    this.x += this.speed * (Math.cos( this.angle));
    this.y += this.speed * (Math.sin( this.angle));

    //remove the bullet from the array if it's gone off screen
    if (this.y > canvas.height || this.y < 0 || this.x  > canvas.width || this.x < 0) 
    {
      //the id passed in was bullets.length() at the time of creation
      var index = bullets.map(function(e) { return e.id; }).indexOf(this.id);
      bullets [index] = null;
      bullets.splice (index, 1);
    }
  }

  this.draw = function ()
  {
      var image = (type =="good")?images["bullet_blue"]:images["bullet_red"];
      ctx.save ();
      ctx.translate (this.x+this.angle, this.y+this.angle);
      ctx.rotate (this.angle);
      ctx.drawImage (image, 0-this.angle, 0-this.angle);
      ctx.restore ();
  }
}



function draw() {
  ctx.clearRect(0,0, canvas.width, canvas.height);
  //fill the bg in with black
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.drawImage (images.bg, 0, 0);

  if (inGame)
  {
    //draw the ship
    ship.draw(images.player);
    ctx.font = '30px "Code-Bold"';
    ctx.fillStyle="white";
    ctx.fillText("Score: "+score,10,50);
    ctx.fillText("Health: " +ship.health, canvas.width-200, 50);
    ctx.fillText("Blasters: " +ship.blasterCount, canvas.width-475, 50);
    ctx.font = '10px "Code-Bold"';
    ctx.fillText("press p to toggle audio", canvas.width -150, canvas.height-25);
    

    for (var i=0; i < bullets.length; i++)
    {
      bullets[i].draw ();
      if (bullets[i])
      {
        bullets[i].calculatePosition();
      }
    }
    for (var i=0; i < healthDoges.length; i++)
    {
      healthDoges[i].draw ();
      if (healthDoges[i])
      {
        healthDoges[i].calculatePosition();
      }
    }
    for (var i=0; i < blasterRefills.length; i++)
    {
      blasterRefills[i].draw ();
      if (blasterRefills[i])
      {
        blasterRefills[i].calculatePosition();
      }
    }
    for (var i=0; i < enemies.length; i++)
    {
      enemies[i].draw ();
      if (enemies[i])
      {
        enemies[i].calculateRotation();
        enemies[i].calculatePosition();
      }
    }
    //draw the carrier ship that you're chasing
    //carrierShip.draw();
    //calculate where the ship will be next iteration
    ship.calculatePlayerRotation ();
    ship.calculatePosition();
    checkForCollisions ();
    //calculate collisions
    checkHealth();
  }
  else
  {
    if (ship.health <= 0)
    {
      endOfGameScreen.draw ();
    }
    else 
    {
      //draw the menu
      mainMenu.draw();
    }
  }
  window.requestAnimationFrame(draw);
}

function checkHealth ()
{
  if (ship.health <= 0)
  {
    inGame = false;
  }
}

function removeEnemy (enemy)
{
  var index = enemies.map(function(e) { return e.id; }).indexOf(enemy.id);
  enemies[index] = null;
  enemies.splice (index, 1);
  enemyDestroyCount +=1;
  score += 10;
  generateEnemy ();
  if (enemyDestroyCount % 30 == 0)
  {
    generateHealthDoge ();
  }
  if (enemyDestroyCount % 12 == 0)
  {
    generateBlasterRefill ();
  }
}
function removeDoge (healthDoge)
{
  var index = healthDoges.map(function(e) { return e.id; }).indexOf(healthDoges.id);
  healthDoges[index] = null;
  healthDoges.splice (index, 1);
  ship.health = ((ship.health + 25) >= 100)?100:ship.health +25;
}
function removeBlasterRefill (blasterRefill)
{
  var index = blasterRefills.map(function(e) { return e.id; }).indexOf(blasterRefills.id);
  blasterRefills[index] = null;
  blasterRefills.splice (index, 1);
  ship.blasterCount = ((ship.blasterCount + blasterRefill.blasterAmount) >= 200)?200:ship.blasterCount +blasterRefill.blasterAmount;
}
function generateHealthDoge ()
{
  healthDogeID += 1;
  healthDoges.push (new HealthDoge (healthDogeID, Math.random()*canvas.width-250, Math.random()*canvas.height-250));
}
function generateBlasterRefill ()
{
  blasterRefillID += 1;
  blasterRefills.push (new BlasterRefill (blasterRefillID, Math.random()*canvas.width-250, Math.random()*canvas.height-250));
}
function generateEnemy ()
{
  enemyID += 1;
  enemies.push (new Enemy (enemyID, Math.random()*canvas.width-100, Math.random()*canvas.height-100));
}

function checkForCollisions ()
{
  for (var j=0; j < enemies.length; j++)
  {
    for (var i=0; i < bullets.length; i++)
    {
      if (testIfPointInsideCircle(enemies[j].x+enemies[j].radius, enemies[j].y+enemies[j].radius, enemies[j].radius*1.5, bullets[i].x+bullets[i].radius, bullets[i].y+bullets[i].radius) && bullets[i].type =="good")
      {
        var index = enemies.map(function(e) { return e.id; }).indexOf(enemies[j].id);
        enemies[index].isExploding = true;
        enemyDestroyByBullet += 1;
      }
      if (testIfPointInsideCircle(ship.x+ship.radius, ship.y+ship.radius, ship.radius*1, bullets[i].x+bullets[i].radius, bullets[i].y+bullets[i].radius) && bullets[i].type =="bad")
      {
        var index = bullets.map(function(e) { return e.id; }).indexOf(bullets[i].id);
        bullets[index] = null;
        bullets.splice (index, 1);
        ship.health = ((ship.health -1) <= 0)?0:ship.health -1;
      }
    }
    if (testIfPointInsideCircle(enemies[j].x+enemies[j].radius, enemies[j].y+enemies[j].radius, ship.radius, ship.x+ship.radius, ship.y+ship.radius))
    {
      var index = enemies.map(function(e) { return e.id; }).indexOf(enemies[j].id);
      enemies[index].isExploding = true;
    }
  }
  for (var d=0; d < healthDoges.length; d++)
  {
    if (testIfPointInsideCircle (healthDoges[d].x+healthDoges[d].radius, healthDoges[d].y+healthDoges[d].radius, ship.radius, ship.x+ship.radius, ship.y+ship.radius))
    {
      var index = healthDoges.map(function(e) { return e.id; }).indexOf(healthDoges[d].id);
      healthDoges[index].isFading = true;
    }
  }
  for (var d=0; d < blasterRefills.length; d++)
  {
    if (testIfPointInsideCircle (blasterRefills[d].x+blasterRefills[d].radius, blasterRefills[d].y+blasterRefills[d].radius, ship.radius, ship.x+ship.radius, ship.y+ship.radius))
    {
      var index = blasterRefills.map(function(e) { return e.id; }).indexOf(blasterRefills[d].id);
      blasterRefills[index].isFading = true;
    }
  }
}

 /*
 * Calculates the angle ABC (in radians) 
 *
 * A first point
 * C second point
 * B center point
 */
function find_angle(A,B,C) {
    var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));    
    var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2)); 
    var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
    return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB));
}

function angle(cx, cy, ex, ey) {
  var dy = ey - cy;
  var dx = ex - cx;
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  //theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  return theta;
}
function testIfPointInsideCircle (centerX, centerY, radius, testX, testY)
{
  if (distanceBetweenTwoPoints(centerX, centerY, testX, testY) > radius)
  {
    return false;
  }
  else
  {
    return true;
  }
}

function distanceBetweenTwoPoints (x1, y1, x2, y2)
{
  var left = (x2-x1) * (x2-x1);
  var right = (y2-y1) * (y2-y1);
  return Math.sqrt (left+right);
}

function subtractValue (value, rate, floor)
{
  value = (value - rate > floor)?value - rate : floor;
  return value;
}

function applyValue (value, rate, ceil)
{
  value = (value + rate < ceil)? value + rate : ceil;
  return value;
}

document.addEventListener ('mousemove', function (e) {
  var rect = canvas.getBoundingClientRect ();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;

  //calculatePlayerRotation (mouseX, mouseY);

});


document.addEventListener('keydown', function (e){

  if (e.keyCode in keyMap)
  {
    keyMap [e.keyCode] = true;
  }
  if (keyMap[87]) //w - up
  {
    ship.ay = subtractValue (ship.ay, accRate, -maxAccRate); 
  }
  if (keyMap[65]) //a - left
  {
    ship.ax = subtractValue (ship.ax, accRate, -maxAccRate);
  }
  if (keyMap[83]) //s - down
  {
    ship.ay = applyValue (ship.ay, accRate, maxAccRate);
  }
  if (keyMap[68])//d - right
  {
    ship.ax = applyValue (ship.ax, accRate, maxAccRate);
  }
});

document.addEventListener('keyup', function (e){
  if (e.keyCode in keyMap)
  {
    keyMap [e.keyCode] = false;
  }
  if (e.keyCode == 80)
  {
    audioEnabled = (audioEnabled)?false:true;
    if (audioEnabled)
    {
      if (bgAudio.currentTime == 0.0)
      {
        bgAudio.play ();
      }
    }
    else
    {
      bgAudio.stop();
    }
  }
});

document.addEventListener('mouseup', function(e){
  if (inGame)
  {
    if (audioEnabled)
    {
      gunAudio.stop();
      gunAudio.play ();
    }
    if (ship.blasterCount != 0)
    {
      ship.blasterCount -= 1;
      bulletID += 1;
      bulletsShot += 1;
      bullets.push (new Bullet(bulletID, ship.x+ship.radius, ship.y+ship.radius, ship.rotation, "good"));
    }
  }
  if (!inGame)
  {
    console.log (e.clientX);
    console.log (e.clientY);
    //test if start button is clicked
    if (e.clientX > mainMenu.topLeftX && e.clientX < mainMenu.topLeftX+mainMenu.width
      && e.clientY > mainMenu.topLeftY && e.clientY < mainMenu.topLeftY+mainMenu.height)
    {
      console.log ("Starting Game");
      inGame = true;
    }
  }

});

//Give the Audio element a stop function
HTMLAudioElement.prototype.stop = function()
{
  this.pause();
  this.currentTime = 0.0;
}

window.addEventListener('resize', function(){
  //console.log ("Window resize event");
  setCanvasSize ();
  mainMenu.calculateSize ();
}, true);


function setCanvasSize ()
{

canvas.width = "innerWidth" in window 
               ? window.innerWidth
               : document.documentElement.offsetWidth;
canvas.height = "innerHeight" in window 
               ? window.innerHeight
               : document.documentElement.offsetHeight;
}