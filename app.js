const { App } = require('@slack/bolt');
const { Logger, LogLevel } = require('@slack/logger');

const dotenv = require('dotenv');
dotenv.config();

const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const userToken = process.env.SLACK_USER_OAUTH_TOKEN;
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
    // you still need to listen on some port!
    port: process.env.PORT || 3000,
    logLevel: LogLevel.DEBUG,
  });
  


(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();



// Listens to incoming messages that contain "hello"
app.message('hello hack', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  await say(`Hey there <@${message.user}>!`);
});

// Listens to incoming messages that contain "hello"
app.message('anyone in the office today?', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  var threadId = message.ts;
  var channelId = message.channel;

  message = `Hey there <@${message.user}>! Today these workmates are in the office: \n- Steven Mulkerrins`;
  await replyMessage(channelId, threadId, message);
});



app.event('app_home_opened', async ({ event, client, context }) => {
    try {
      /* view.publish is the method that your app uses to push a view to the Home tab */
      const result = await client.views.publish({
  
        /* the user that opened your app's app home */
        user_id: event.user,
  
        /* the view object that appears in the app home*/
        view: {
          type: 'home',
          callback_id: 'home_view',
  
          /* body of the view */
          "blocks": [
            {
              "type": "header",
              "text": {
                "type": "plain_text",
                "text": "Your Working from Office routine...",
                "emoji": true
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Hello! I'm going to help you set your WFO status automatically, so on a normal week, which days are you in the office?*",
              }
            },
            {
              type: "divider",
            },
            {
              type: "actions",
              elements: [
                {
                  type: "checkboxes",
                  options: [
                    {
                      text: {
                        type: "plain_text",
                        text: "Monday",
                        emoji: true,
                      },
                      value: "value-0",
                    },
                    {
                      text: {
                        type: "plain_text",
                        text: "Tuesday",
                        emoji: true,
                      },
                      value: "value-1",
                    },
                    {
                      text: {
                        type: "plain_text",
                        text: "Wednesday",
                        emoji: true,
                      },
                      value: "value-2",
                    },
                    {
                      text: {
                        type: "plain_text",
                        text: "Thursday",
                        emoji: true,
                      },
                      value: "value-3",
                    },
                    {
                      text: {
                        type: "plain_text",
                        text: "Friday",
                        emoji: true,
                      },
                      value: "value-4",
                    },
                  ],
                  action_id: "set_days",
                },
              ],
            },
            {
              type: "divider",
            },
            {
              "type": "header",
              "text": {
                "type": "plain_text",
                "text": "Inform Channel when you are on PTO",
                "emoji": true
              }
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "➕ To start informing your team, select the team or project channel from the right.  Make sure I'm invited: Type `/invite @TaskBot` from the channel"
              },
              "accessory": {
                "type": "conversations_select",
                "placeholder": {
                  "type": "plain_text",
                  "text": "Select a channel...",
                  "emoji": true
                },
                action_id: "select_channel",
              }
            },
            {
              type: "divider",
            },
            {
              "type": "header",
              "text": {
                "type": "plain_text",
                "text": "Away at Lunch",
                "emoji": true
              }
            },  
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Would you like me to place you away for lunch every day at a specific time?"
                  }
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Select your typical lunch time..."
                  },
                  "accessory": {
                    "type": "timepicker",
                    "initial_time": "13:00",
                    "placeholder": {
                      "type": "plain_text",
                      "text": "Select time",
                      "emoji": true
                    },
                    "action_id": "timepicker-action"
                  }
               
            }
          ]
        }
      });
    }
    catch (error) {
      console.error(error);
    }
  });
  
  
  
// This listener will only be called when the `action_id` matches 'set_days'
app.action({
    action_id: 'set_days'
    }, async ({ body, action, ack, say, client }) => {
    await   ack();
    // Do something in response
    calling_username = body.user["username"];
    
    
    //what day of the week is today? 
    const d = new Date();
    var day_of_week = d.getDay();
    slackMemberId = body.user.id;
    current_status = await getStatus(slackMemberId);
    console.info("current status is "+ current_status.status_text);
    var set_today_as_wfo = false;

    /*TODO: normally we would store this configuration and then every day at eg. 8am 
      we could run a scheduled action and check if "today" is a day of the week when we
      normally work from the office. for DEMO only, we are not doing this and only checking if today
      is one of the WFO week days, and if so, we change the status. 
    */
    action.selected_options.forEach(element => {
      console.info("User " + calling_username + " selected day " + element.text.text);
      if(dayOfWeek[day_of_week] === element.text.text){
        set_today_as_wfo = true;
      }
    });

    if(set_today_as_wfo)
      await setStatus(slackMemberId, "Today: Working from Office", ":office:");
    else{
      await clearStatus(slackMemberId);
    }
});


// This listener will only be called when the `action_id` matches 'set_pto_reply'
app.action({
  action_id: 'set_pto_reply'
  }, async ({ body, action, ack, say, client }) => {
  
    await   ack();
    //TODO: store this preference for the reply. 
});


// This listener will only be called when the `action_id` matches 'save_channel'
app.action({
  action_id: 'select_channel'
  }, async ({ body, action, ack, say, client }) => {
    await   ack();


    var announce_message = "*Hello team! Our workmates below are on PTO today*.\n- joao.esteves \n- steven.mulkerrins";

    publishMessage(action.selected_conversation, announce_message);
    
});


// Post a message to a channel your app is in using ID and message text
async function publishMessage(id, text) {
  try {
    // Call the chat.postMessage method using the built-in WebClient
    const result = await app.client.chat.postMessage({
      // The token you used to initialize your app
      token: process.env.SLACK_BOT_TOKEN,
      channel: id,
      text: text
      // You could also use a blocks[] array to send richer content
    });

    // Print result, which includes information about the message (like TS)
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
}

// Reply to a message with the channel ID and message TS
async function replyMessage(id, ts, replyMessage) {
  try {
    // Call the chat.postMessage method using the built-in WebClient
    const result = await app.client.chat.postMessage({
      // The token you used to initialize your app
      token: process.env.SLACK_BOT_TOKEN,
      channel: id,
      thread_ts: ts,
      text: replyMessage
      // You could also use a blocks[] array to send richer content
    });

    // Print result
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
}



// Find conversation ID using the conversations.list method
async function findConversation(name) {
  try {
    // Call the conversations.list method using the built-in WebClient
    const result = await app.client.conversations.list({
      // The token you used to initialize your app
      token: process.env.SLACK_BOT_TOKEN
    });

    for (const channel of result.channels) {
      if (channel.name === name) {
        conversationId = channel.id;

        // Print result
        console.log("Found conversation ID: " + conversationId);
        // Break from for loop
        break;
      }
    }
  }
  catch (error) {
    console.error(error);
  }
}

async function getStatus(slackMemberId){
	const response = await app.client.users.profile.get({ user: slackMemberId });
	if (!response.ok) throw Error(response.error);

	const profile = response.profile;
	return {
		status_text: profile.status_text,
		status_emoji: profile.status_emoji,
	};
}

async function setStatus(slackMemberId, status, status_emoji){
  const now = Date.now();
  var expiration_time = (now /1000)+8*60*60; //expire in 8 hours
  //TODO: expire "today" at 6pm

	const response = await app.client.users.profile.set({
		user: slackMemberId,
		profile: {
      "status_text": status,
      "status_emoji": status_emoji,
      "status_expiration": expiration_time
    },
    token: userToken,
	});
	if (!response.ok) throw Error(response.error);
}

async function clearStatus(slackMemberId){
	await setStatus(slackMemberId, '', '' );
} 