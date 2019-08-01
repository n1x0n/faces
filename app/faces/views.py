import os
import sys
import datetime
from base64 import b64decode, b64encode
from flask import Flask, request, session, redirect, url_for, render_template, json, jsonify
import boto3


app = Flask(__name__)

access_key = os.environ.get("ACCESS_KEY")
secret_key = os.environ.get("SECRET_KEY")
s3_endpoint = os.environ.get("S3_ENDPOINT")
s3_bucket = os.environ.get("S3_BUCKET")

if not (access_key and secret_key and s3_endpoint and s3_bucket):
    print("Unable to find environment variables")
    sys.exit("Unable to find environment variables")


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def login():
    if request.method == 'POST':
        infopanel = False

        imagedata = request.form['imagedata']

        if not imagedata:
            infopanel = "No image received"
            return render_template('index.html', infopanel=infopanel)

        header, encoded = imagedata.split(",", 1)

        if not header == "data:image/png;base64":
            infopanel = "No image in data url"
            return render_template('index.html', infopanel=infopanel)

        data = b64decode(encoded)
        timestamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
        key = "%s.png" % timestamp

        size = 0
        try:
            session = boto3.session.Session(
                aws_access_key_id=access_key, aws_secret_access_key=secret_key)
            s3 = session.resource(service_name='s3', endpoint_url=s3_endpoint)
            s3.Bucket(s3_bucket).put_object(Key=key, Body=data)
            obj = s3.Object(s3_bucket, key)
            obj.wait_until_exists()
            size = obj.content_length
        except Exception as e:
            print("Error uploading image: %s" % e)

        return jsonify(size)


@app.route('/imagelist')
def imagelist():
    imagelist = dict()
    try:
        client = boto3.client(service_name='s3', endpoint_url=s3_endpoint,
                          aws_access_key_id=access_key, aws_secret_access_key=secret_key)
        paginator = client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=s3_bucket):
            for obj in page["Contents"]:
                #obj['base64'] = b64encode(obj['Key'])
                imagelist[obj['Key']] = obj
    except Exception as e:
        print("Error reading bucket %s: %s" % (s3_bucket, e))

    return jsonify(imagelist)


def get_all_s3_keys(bucket, s3):
    """Get a list of all keys in an S3 bucket."""
    keys = []

    kwargs = {'Bucket': bucket}
    while True:
        resp = s3.list_objects_v2(**kwargs)
        for obj in resp['Contents']:
            keys.append(obj['Key'])

        try:
            kwargs['ContinuationToken'] = resp['NextContinuationToken']
        except KeyError:
            break

    return keys
