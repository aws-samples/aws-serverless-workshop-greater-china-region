'''
https://docs.aws.amazon.com/zh_cn/IAM/latest/UserGuide/id_roles_providers_enable-console-custom-url.html#STSConsoleLink_programPython
'''

import sys
import os
import json
import urllib.parse
import urllib.request
import ssl
import webbrowser
import boto3
from configparser import ConfigParser, NoOptionError


def getPara():
    sys_para = sys.argv
    len_para = len(sys_para)
    serviceName = 'console'
    if len_para == 3:
        serviceName = sys_para[1]
        profile = sys_para[2]
    elif len_para == 2:
        profile = sys_para[1]
    elif len_para == 1:
        profile = 'default'
    else:
        sys.exit('Error parameter')

    # Service Name Mapping
    if serviceName == 'emr':
        serviceName = 'elasticmapreduce'
    elif serviceName == 'ssm':
        serviceName = 'systems-manager'
    elif serviceName == 'cw':
        serviceName = 'cloudwatch'
    elif serviceName == 'rs':
        serviceName = 'redshift'
    elif serviceName == 'ec':
        serviceName = 'elasticache'
    elif serviceName == 'ddb':
        serviceName = 'dynamodb'
    elif serviceName == 'ds':
        serviceName = 'directoryservicev2'

    return profile, serviceName


def getRegion(profile):
    cre = ConfigParser()
    cre_file = os.path.join(os.path.expanduser("~"), ".aws/credentials")
    try:
        cre.read(cre_file, encoding='utf-8-sig')
        region = cre.get(profile, 'region')
    except NoOptionError:
        #  There is no region in credentials, try to get from config
        cfg = ConfigParser()
        config_file = os.path.join(os.path.expanduser("~"), ".aws/config")
        try:
            cfg.read(config_file, encoding='utf-8-sig')
            if profile != 'default':
                profile = 'profile '+profile
            region = cfg.get(profile, 'region')
        except Exception as e:
            print('Can not find region name in config in ~/.aws', e)
            sys.exit('Error region')
    except Exception as e:
        print('Can not find region name in credentials in ~/.aws', e)
        sys.exit('Error region')
    return region


# Main
if __name__ == '__main__':
    profile, serviceName = getPara()
    region = getRegion(profile)

    # Get token from sts
    sts_client = boto3.Session(profile_name=profile, region_name=region).client('sts')
    # get_caller_identity = sts_client.get_caller_identity()
    # username = get_caller_identity['Arn'].split('/')[1] + "-fed"
    username = 'aws-fed'
    policy = {
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': '*',
                        'Resource': '*'
                    }
                ]
            }
    get_federation_token = sts_client.get_federation_token(
        Name=username,
        Policy=json.dumps(policy),
        DurationSeconds=43200
    )
    tempCre = {
        "sessionId": get_federation_token['Credentials']['AccessKeyId'],
        "sessionKey": get_federation_token['Credentials']['SecretAccessKey'],
        "sessionToken": get_federation_token['Credentials']['SessionToken']
    }
    tempCreStr = json.dumps(tempCre)

    # Make request to AWS federation endpoint to get sign-in token
    req_para = "?Action=getSigninToken&SessionDuration=43200&Session=" + urllib.parse.quote_plus(tempCreStr)
    if region.startswith("cn-"):
        request_url = "https://signin.amazonaws.cn/federation" + req_para
    else:
        request_url = "https://signin.aws.amazon.com/federation" + req_para
    context = ssl.SSLContext(ssl.PROTOCOL_TLS)
    r = urllib.request.urlopen(urllib.request.Request(request_url), timeout=10, context=context
                               ).read().decode('utf-8')
    # Returns a JSON document with a single element named SigninToken.
    signin_token = json.loads(r)

    # Create URL where users can use the sign-in token to sign in to the console
    req_para = "?Action=login&Issuer=aws&Destination="
    if region.startswith("cn-"):
        req_para += urllib.parse.quote_plus("https://console.amazonaws.cn/") + serviceName + "&SigninToken=" + \
                    signin_token["SigninToken"]
        request_url = "https://signin.amazonaws.cn/federation" + req_para
    else:
        req_para += urllib.parse.quote_plus("https://console.aws.amazon.com/") + serviceName + "&SigninToken=" + \
                    signin_token["SigninToken"]
        request_url = "https://signin.aws.amazon.com/federation" + req_para

    # Open Webbrowser
    webbrowser.open(request_url)
