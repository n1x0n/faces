from __future__ import print_function
import json
import boto3
from botocore.config import Config
import time
import urllib
import os
import ast
import http.client
import base64

print('Loading function')

# This lambda function has been updated to support Python 3.9 and v4 signatures.

# Set up keys and url needed to access StorageGRID Webscale
endpoint = os.environ['endpoint_url']
access_key = os.environ['access_key']
secret_key = os.environ['secret_key']
#session = boto3.session.Session(aws_access_key_id=access_key, aws_secret_access_key=secret_key)

s3 = boto3.client(
    's3',
    aws_access_key_id=access_key,
    endpoint_url=endpoint,
    aws_secret_access_key=secret_key,
    config=Config(signature_version='s3v4')
)


# Initiate S3 session
#s3 = session.client(service_name='s3', endpoint_url=endpoint)


def sign(key, msg):
    return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()


def getSignatureKey(key, dateStamp, regionName, serviceName):
    kDate = sign(('AWS4' + key).encode('utf-8'), dateStamp)
    kRegion = sign(kDate, regionName)
    kService = sign(kRegion, serviceName)
    kSigning = sign(kService, 'aws4_request')
    return kSigning


def lambda_handler(event, context):
    # This is the function called when a new event takes place.
    # We can parse the data sent from the event straight into a
    # python variable with ast.literal_eval. We then grab the
    # message that StorageGRID Webscale sent into Amazon SNS.
    message = ast.literal_eval(event['Records'][0]['Sns']['Message'])

    # Find the name of the bucket and key of the new object.
    bucket = message['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(
        message['Records'][0]['s3']['object']['key'])

    # These variables will be used in the try block below.
    presigned_url = None
    meta = None
    response = None
    try:
        # We wait for the new object to persist through the
        # object storage, then we create a presigned url for
        # the object. We also grab whatever metadata is already
        # tagged for this object.
        print("Using waiter to waiting for object to persist through s3 service...")
        waiter = s3.get_waiter('object_exists')
        waiter.wait(Bucket=bucket, Key=key)

        # Get headers for this object and print info to the log.
        response = s3.head_object(Bucket=bucket, Key=key)
        print("CONTENT TYPE: " + response['ContentType'])
        print("ETag: " + response['ETag'])
        print("Content-Length: ", response['ContentLength'])
        print("Keyname: " + key)

        # Generate the presigned url.
        presigned_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=180)

        # Grab the metadata from the object, we will need it later.
        obj = s3.get_object(Bucket=bucket, Key=key)
        meta = obj['Metadata']

        # Make sure we only process the face once.
        if 'face-processed' in meta:
            print("Face already processed.")
            return response['ContentType']

        # Depending on who has access to your logs you might not
        # want to print the presigned url here. I used it for
        # debugging though, and with a short expire time above we
        # should be fine.
        print("Presigned url: %s" % presigned_url)

    except Exception as e:
        print(e)
        print('Error generating url for object %s in bucket %s. Make sure they exist '
              'and your bucket is in the same region as this '
              'function.' % (key, bucket))
        raise e

    try:
        # Now use the presigned url to detect faces. We will only use the first face.
        print("Detecting face in object " + key)

        # Set up headers and parameters for the API.
        headers = {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': os.environ['cf_key']
        }
        params = urllib.parse.urlencode({
            'returnFaceId': 'true',
            'returnFaceLandmarks': 'false',
            'returnFaceAttributes': 'age,gender,smile,facialHair,glasses,emotion,hair,makeup,accessories'
        })

        # Detect the face and get the result.
        conn = http.client.HTTPSConnection(
            '%s.api.cognitive.microsoft.com' % os.environ['cf_region'])
        try:
            conn.request("POST", "/face/v1.0/detect?%s" %
                         params, "{'url':'%s'}" % presigned_url, headers)
        except Exception as e:
            print("Error 1: %s" % e)

        try:
            cfresponse = conn.getresponse()
        except Exception as e:
            print("Error 2: %s" % e)

        try:
            data = cfresponse.read()
        except Exception as e:
            print("Error 3: %s" % e)

        tags = json.loads(data)

        print("Tags found: %s" % tags)

        # We will only tag the metadata for the first face in the image.
        # Generate new metadata by adding tags to the "meta" variables
        # that we filled above.
        tags = tags[0]
        for thiskey, value in tags['faceAttributes']['emotion'].items():
            meta['emotion-%s' % thiskey] = "%s" % value
        for thiskey, value in tags['faceAttributes']['facialHair'].items():
            meta['facialhair-%s' % thiskey] = "%s" % value
        meta['gender'] = "%s" % tags['faceAttributes']['gender']
        meta['age'] = "%s" % tags['faceAttributes']['age']
        meta['glasses'] = "%s" % tags['faceAttributes']['glasses']
        meta['smile'] = "%s" % tags['faceAttributes']['smile']

        # Make sure we only process this object once.
        meta['face-processed'] = "1"

        # The only way to update metadata is to create a new object as a copy of the
        # object that triggered the event using the updated metadata.
        s3.copy_object(Bucket=bucket, Key=key, CopySource={
                       'Bucket': bucket, 'Key': key}, Metadata=meta, MetadataDirective='REPLACE')
        conn.close()
    except Exception as e:
        print("ERROR: %s" % e)
        print("[Errno {0}] {1}".format(e.errno, e.strerror))

    return response['ContentType']
