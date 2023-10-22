import json
import logging
import os
import urllib.request
import boto3

wafv2 = boto3.client('wafv2')

HOOK_URL = os.environ['WebhookUrl']
MESSENGER = os.environ['Messenger']

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def format_slack_message(data):
    payload = {
        'username': f"🚨 FMS Notification",
        'text': f"{data['Subject']}",
        'attachments': [
            {
                'fallback': "Detailed information:",
                'color': 'green',
                'title': data['Subject'],
                'text': data['Message'],
            }
        ]
    }
    return payload


def format_teams_message(data):
    message = {
        "type":"message",
        "attachments":[
            {
            "contentType":"application/vnd.microsoft.card.adaptive",
            "contentUrl": "",
            "content":{
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "type": "AdaptiveCard",
                "msteams": {
                    "width": "Full"
                },
                "version": "1.4",
                "body": [
                {
                    "type": "TextBlock",
                    "text": f"{data['Subject']}",
                    "size": "Large",
                    "weight": "Bolder",
                    "wrap": True
                },
                {
                    "type": "TextBlock",
                    "text": f"{data['Message']}",
                    "separator": True,
                    "wrap": True
                }
                ]
            }
            }
        ]
    }
    return message


def notify(url, payload):
    data = json.dumps(payload).encode('utf-8')
    method = 'POST'
    headers = {'Content-Type': 'application/json'}

    request = urllib.request.Request(url, data = data, method = method, headers = headers)
    with urllib.request.urlopen(request) as response:
        return response.read().decode('utf-8')


def lambda_handler(event, context):
    logger.info("Message: " + str(event))
    for(record) in event['Records']:
        if(MESSENGER == "Slack"):
            payload = format_slack_message(record['Sns'])
        elif(MESSENGER == "Teams"):
            payload = format_teams_message(record['Sns'])
    response = notify(HOOK_URL, payload)
    print(response)

