const mineflayer = require('mineflayer')
const Movements = require('mineflayer-pathfinder').Movements
const pathfinder = require('mineflayer-pathfinder').pathfinder
const { GoalBlock} = require('mineflayer-pathfinder').goals
let antiafk = null;
try {
  antiafk = require('mineflayer-antiafk');
} catch (err) {
  console.warn('[WARN] Optional module "mineflayer-antiafk" is not installed. Anti-AFK plugin will be disabled.');
}
const pvp = require('mineflayer-pvp').plugin

var http = require('http');
const KEEP_ALIVE_PORT = process.env.PORT || 8080;
http.createServer(function (req, res) {
  res.write("I'm alive");
  res.end();
}).listen(KEEP_ALIVE_PORT, () => {
  console.log(`[KeepAlive] Listening on port ${KEEP_ALIVE_PORT}`);
});

const config = require('./settings.json');

function createBot () {
  const bot = mineflayer.createBot({
      username: process.env.BOT_USERNAME || config['bot-account']['username'],
      password: process.env.BOT_PASSWORD || config['bot-account']['password'],
      host: process.env.MC_SERVER || config.server.ip,
      port: process.env.MC_PORT || config.server.port,
      version: process.env.MC_VERSION || config.server.version
  })

  bot.loadPlugin(pathfinder)
  const mcData = require('minecraft-data')(bot.version)
  const defaultMove = new Movements(bot, mcData)
  if (!bot.settings) bot.settings = {}
  bot.settings.colorsEnabled = false

  bot.once("spawn", function(){
      console.log("\x1b[33m[BotLog] Bot joined to the server", '\x1b[0m')

      if(config.utils['auto-auth'].enabled){
        console.log("[INFO] Started auto-auth module")

          var password = config.utils['auto-auth'].password
          setTimeout(function() {
              bot.chat(`/register ${password} ${password}`)
              bot.chat(`/login ${password}`)
          }, 500);

          console.log(`[Auth] Authentification commands executed.`)
      }

      if(config.utils['chat-messages'].enabled){
        console.log("[INFO] Started chat-messages module")
        var messages = config.utils['chat-messages']['messages']

          if(config.utils['chat-messages'].repeat){
            var delay = config.utils['chat-messages']['repeat-delay']
            let i = 0

            let msg_timer = setInterval(() => {
                bot.chat(`${messages[i]}`)

                if(i+1 == messages.length){
                    i = 0
                } else i++
            }, delay * 1000)
          } else {
              messages.forEach(function(msg){
                  bot.chat(msg)
              })
        }
      }
      

      const pos = config.position

      if (config.position.enabled){
          console.log(`\x1b[32m[BotLog] Starting moving to target location (${pos.x}, ${pos.y}, ${pos.z})\x1b[0m`)
          bot.pathfinder.setMovements(defaultMove)
          bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z))
      }
      
      if(config.utils['anti-afk'].enabled){
        bot.setControlState('jump', true)
        if(config.utils['anti-afk'].sneak){
            bot.setControlState('sneak', true)
        }
      }
  })

  bot.loadPlugin(pathfinder)
bot.loadPlugin(pvp)

bot.on('chat', (username, message) => {
  if (message === 'fight me') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.pvp.attack(player.entity)
  }

  if (message === 'stop') {
    bot.pvp.stop()
  }
})

if (antiafk) {
  bot.loadPlugin(antiafk);

  bot.on('spawn', () => {
    if (bot.afk && typeof bot.afk.start === 'function') {
      bot.afk.start();
    }
  });
} else {
  // If anti-afk plugin isn't available, still attach a spawn listener for compatibility
  bot.on('spawn', () => {
    // nothing to start
  });
}

  bot.on("chat", function(username, message){
      if(config.utils['chat-log']){
          console.log(`[ChatLog] <${username}> ${message}`)
      }
  })

  bot.on("goal_reached", function(){
      console.log(`\x1b[32m[BotLog] Bot arrived to target location. ${bot.entity.position}\x1b[0m`)
  })

  bot.on("death", function(){
      console.log(`\x1b[33m[BotLog] Bot has been died and was respawned ${bot.entity.position}`, '\x1b[0m')
  })

  if(config.utils['auto-reconnect']){
      bot.on('end', function(){
        createBot()
      })
  }

  bot.on('kicked', (reason) => console.log('\x1b[33m',`[BotLog] Bot was kicked from the server. Reason: \n${reason}`, '\x1b[0m'))
  bot.on('error', err => console.log(`\x1b[31m[ERROR] ${err.message}`, '\x1b[0m'))

}

createBot()