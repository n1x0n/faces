import os
import sys
import datetime
from base64 import b64decode
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
            session = boto3.session.Session(aws_access_key_id=access_key, aws_secret_access_key=secret_key)
            s3 = session.resource(service_name='s3', endpoint_url=s3_endpoint)
            s3.Bucket(s3_bucket).put_object(Key=key, Body=data)
            obj = s3.Object(s3_bucket, key)
            obj.wait_until_exists()
            size = obj.content_length
        except Exception as e:
            print("Error uploading image: %s" % e)

        return jsonify(size)





""" @app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if len(username) < 1:
            flash('Your username must be at least one character.')
        elif len(password) < 5:
            flash('Your password must be at least 5 characters.')
        elif not User(username).register(password):
            flash('A user with that username already exists.')
        else:
            session['username'] = username
            flash('Logged in.')
            return redirect(url_for('index'))

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if not User(username).verify_password(password):
            flash('Invalid login.')
        else:
            session['username'] = username
            flash('Logged in.')
            return redirect(url_for('index'))

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    flash('Logged out.')
    return redirect(url_for('index'))

@app.route('/add_post', methods=['POST'])
def add_post():
    title = request.form['title']
    tags = request.form['tags']
    text = request.form['text']

    if not title:
        flash('You must give your post a title.')
    elif not tags:
        flash('You must give your post at least one tag.')
    elif not text:
        flash('You must give your post a text body.')
    else:
        User(session['username']).add_post(title, tags, text)

    return redirect(url_for('index'))

@app.route('/like_post/<post_id>')
def like_post(post_id):
    username = session.get('username')

    if not username:
        flash('You must be logged in to like a post.')
        return redirect(url_for('login'))

    User(username).like_post(post_id)

    flash('Liked post.')
    return redirect(request.referrer)

@app.route('/profile/<username>')
def profile(username):
    logged_in_username = session.get('username')
    user_being_viewed_username = username

    user_being_viewed = User(user_being_viewed_username)
    posts = user_being_viewed.get_recent_posts()

    similar = []
    common = []

    if logged_in_username:
        logged_in_user = User(logged_in_username)

        if logged_in_user.username == user_being_viewed.username:
            similar = logged_in_user.get_similar_users()
        else:
            common = logged_in_user.get_commonality_of_user(user_being_viewed)

    return render_template(
        'profile.html',
        username=username,
        posts=posts,
        similar=similar,
        common=common
    ) """
