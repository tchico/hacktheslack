const { App } = require('@slack/bolt');
const { Logger, LogLevel } = require('@slack/logger');

const dotenv = require('dotenv');
dotenv.config();


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
                text: "Hello, my name is Badass Cyborg ! I'm going to help you set your WFO status automatically, so on a normal week, which days are you in the office?*",
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
    await ack();
    // Do something in response
    calling_username = body.user["username"];
    action.selected_options.forEach(element => {
    console.info("User " + calling_username + " selected day " + element.text.text);
    });
    
    slackMemberId = body.user.id;
    current_status = await getStatus(slackMemberId);
    console.info("current status is "+ current_status.status_text);

    await setStatus(slackMemberId, "WFO Week", ":wave:");
   
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
	const response = await app.client.users.profile.set({
		user: slackMemberId,
		profile: {
      "status_text": status,
      "status_emoji": status_emoji,
      "status_expiration": 0
    },
    token: userToken,
	});
	if (!response.ok) throw Error(response.error);
}

async function clearStatus(slackMemberId){
	await setStatus(slackMemberId, '', '' );
}