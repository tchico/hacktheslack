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
  
  // Listens to incoming messages that contain "hello"
  app.message('hello', async ({ message, say }) => {
    // say() sends a message to the channel where the event was triggered
    await say(`Hey there <@${message.user}>!`);
  });

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();





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
              type: "section",
              text: {
                type: "mrkdwn",
                text: "When you're on PTO, do you want me to reply automatically to messages?",
              }
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
                        text: "check this to enable automatic replies when you're on PTO.",
                        emoji: true,
                      },
                      value: "reply-pto",
                    }
                  ],
                  action_id: "set_pto_reply",
                },
              ],
            },
          ]
        }
      });
    }
    catch (error) {
      console.error(error);
    }
  });
  
  
  
// This listener will only be called when the `action_id` matches 'select_user' AND the `block_id` matches 'assign_ticket'
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
  var expiration_time = (now /1000)+30; //expire in 30 seconds
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