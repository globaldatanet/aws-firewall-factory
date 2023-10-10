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


def get_latest_default_rule_set_version(rule_set_name):
    try:
        response = wafv2.list_available_managed_rule_group_versions(Name=rule_set_name, Scope='REGIONAL', VendorName='AWS')
        DefaultVersion = response.get('CurrentDefaultVersion')
        return DefaultVersion
    except Exception as e:
        print('Error getting the default version for the rule set:', str(e))
        return None


def format_slack_message(data, latest_default_rule_set_version):
    payload = {
        'username': f"WAF {data['Type']}",
        'icon_emoji': ':managedrule:',
        'text': f"{data['Subject']}",
        'attachments': [
            {
                'fallback': "Detailed information on {data['Type']}.",
                'color': 'green',
                'title': data['Subject'],
                'text': data['Message'],
                'fields': [
                    {
                        'title': 'Managed Rule Group',
                        'value': data['MessageAttributes']['managed_rule_group']['Value'],
                        'short': True
                    },
                    {
                        'title': 'Default Version',
                        'value': latest_default_rule_set_version,
                        'short': True
                    },
                    {
                        'title': 'Info',
                        'value': "AWS WAF sets the default version to the static version recommended by the provider. Default version is automatically updated when the provider recommends a new version.",
                        'short': False
                    }
                ]
            }
        ]
    }
    return payload


def format_teams_message(data, latest_default_rule_set_version):
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
                },
                {
                    "type": "FactSet",
                    "facts": [
                        {
                            "title": "Managed Rule Group",
                            "value": data['MessageAttributes']['managed_rule_group']['Value']
                        },
                        {
                            "title": "Default Version",
                            "value": latest_default_rule_set_version
                        }
                    ],
                    "separator": True
                },
                {
                    "type": "TextBlock",
                    "text": f"AWS WAF sets the default version to the static version recommended by the provider. Default version is automatically updated when the provider recommends a new version.",
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
        default_version = get_latest_default_rule_set_version(record['Sns']['MessageAttributes']['managed_rule_group']['Value'])
        if(MESSENGER == "Slack"):
            payload = format_slack_message(record['Sns'], default_version)
        elif(MESSENGER == "Teams"):
            payload = format_teams_message(record['Sns'], default_version)
    response = notify(HOOK_URL, payload)
    print(response)

