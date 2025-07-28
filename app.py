from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timedelta

app = Flask(__name__)

# --- Configuration ---
app.secret_key = os.urandom(24)

# MongoDB Connection
client = MongoClient('mongodb+srv://srini:Sriniyogi27@gamehubcluster.10plk5b.mongodb.net/?retryWrites=true&w=majority&appName=GamehubCluster')
db = client['gamehub'] # Database name: gamehub

# Collections
users_collection = db['users']
plays_collection = db['plays']
contacts_collection = db['contacts'] # Collection for contact messages

# --- Helper Functions ---
def get_user_from_session():
    """Checks session and returns user document if logged in."""
    if 'user_id' in session:
        user_id = session['user_id']
        return users_collection.find_one({'_id': ObjectId(user_id)})
    return None

def format_duration(seconds):
    """Formats seconds into a human-readable string like '1h 15m 30s'."""
    if not isinstance(seconds, (int, float)) or seconds < 0:
        return "0s"
    delta = timedelta(seconds=int(seconds))
    return str(delta)


# --- Main Routes ---
@app.route('/')
def index():
    """Renders the main game hub page and passes user info if logged in."""
    user = get_user_from_session()
    return render_template('index.html', user=user)

# --- Authentication Routes ---
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    if users_collection.find_one({'username': username}):
        return jsonify({'error': 'Username already exists'}), 409

    hashed_password = generate_password_hash(password)
    users_collection.insert_one({
        'username': username,
        'password': hashed_password,
        'created_at': datetime.utcnow(),
        'last_login': None
    })
    return jsonify({'message': 'Registration successful'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = users_collection.find_one({'username': username})

    if user and check_password_hash(user['password'], password):
        session['user_id'] = str(user['_id'])
        # Update the last_login timestamp
        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.utcnow()}}
        )
        return jsonify({'message': 'Login successful', 'username': user['username']})

    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))

@app.route('/profile')
def profile():
    user = get_user_from_session()
    if not user:
        return redirect(url_for('index'))

    # Fetch and process game statistics for the user
    user_plays_cursor = plays_collection.find({'user_id': user['_id']})
    user_plays = []
    
    total_duration_seconds = 0
    total_play_count = 0

    for play in user_plays_cursor:
        # Calculate total stats
        total_duration_seconds += play.get('total_duration', 0)
        total_play_count += play.get('plays', 0)
        
        # Format for display
        play['total_duration_formatted'] = format_duration(play.get('total_duration', 0))
        if 'last_played' in play and play['last_played']:
            play['last_played_formatted'] = play['last_played'].strftime('%Y-%m-%d %H:%M:%S')
        else:
            play['last_played_formatted'] = 'N/A'
        
        user_plays.append(play)

    # Format user data for display
    if user.get('last_login'):
        user['last_login_formatted'] = user['last_login'].strftime('%Y-%m-%d %H:%M:%S UTC')
    else:
        user['last_login_formatted'] = "Never"
        
    if user.get('created_at'):
        user['created_at_formatted'] = user['created_at'].strftime('%Y-%m-%d')
    else:
        user['created_at_formatted'] = "Unknown"


    return render_template('profile.html',
                           user=user,
                           plays=user_plays,
                           total_games_played=len(user_plays),
                           total_play_time_formatted=format_duration(total_duration_seconds),
                           total_play_count=total_play_count)

# --- Other Page Routes ---
@app.route('/contact', methods=['GET', 'POST'])
def contact():
    """Handles the contact page and form submission."""
    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        subject = data.get('subject')
        message = data.get('message')

        if not email or not subject or not message:
            return jsonify({'error': 'Email, subject, and message are required fields.'}), 400
        
        contact_document = {
            'name': name if name else "Anonymous",
            'email': email,
            'subject': subject,
            'message': message,
            'submitted_at': datetime.utcnow()
        }
        
        contacts_collection.insert_one(contact_document)
        return jsonify({'message': 'Your message has been received!'}), 200

    return render_template('contact.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/terms')
def terms():
    return render_template('terms.html')

# --- Game Page Routes ---
# This section creates a unique, clean URL for each game.
@app.route('/2048')
def game_2048():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('2048.html')

@app.route('/checkers')
def checkers():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('checkers.html')

@app.route('/chess')
def chess():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('chess.html')

@app.route('/contra')
def contra():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('contra.html')

@app.route('/flappy')
def flappy():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('flappy.html')

@app.route('/galaxy')
def galaxy():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('galaxy.html')

@app.route('/hand')
def hand():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('hand.html')


@app.route('/ludo')
def ludo():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('ludo.html')

@app.route('/mario')
def mario():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('mario.html')

@app.route('/maze')
def maze():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('maze.html')

@app.route('/memory')
def memory():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('memory.html')

@app.route('/mine')
def mine():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('mine.html')

@app.route('/monopoly')
def monopoly():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('monopoly.html')

@app.route('/nokiagame')
def nokiagame():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('nokiagame.html')

@app.route('/rabbit')
def rabbit():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('rabbit.html')

@app.route('/rps')
def rps():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('rps.html')

@app.route('/snake')
def snake():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('snake.html')

@app.route('/snakeandladder')
def snakeandladder():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('snakeandladder.html')

# Corrected typo from 'solitare' to 'solitaire'
@app.route('/solitaire')
def solitaire():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('solitaire.html')

@app.route('/tetra')
def tetra():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('tetra.html')

@app.route('/tictactoe')
def tictactoe():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('tictactoe.html')

@app.route('/truth')
def truth():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('truth.html')

@app.route('/water')
def water():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('water.html')

@app.route('/whackamole')
def whackamole():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('whackamole.html')

@app.route('/word')
def word():
    if not get_user_from_session():
        return redirect(url_for('index'))
    return render_template('word.html')


# --- API Routes ---
@app.route('/api/track_play', methods=['POST'])
def track_play():
    user = get_user_from_session()
    if not user:
        return jsonify({'error': 'User not logged in'}), 401
    
    data = request.get_json()
    game_title = data.get('gameTitle')
    duration = data.get('duration') # Expecting duration in seconds from the frontend

    if not game_title or duration is None:
        return jsonify({'error': 'Game title and duration are required'}), 400

    plays_collection.update_one(
        {'user_id': user['_id'], 'game_title': game_title},
        {
            '$inc': {
                'plays': 1,
                'total_duration': float(duration)
            },
            '$set': {
                'last_played': datetime.utcnow()
            }
        },
        upsert=True
    )
    return jsonify({'message': 'Play tracked successfully'}), 200

@app.route('/api/leaderboards', methods=['GET'])
def get_leaderboards():
    top_games_pipeline = [
        {"$group": {"_id": "$game_title", "totalPlays": {"$sum": "$plays"}}},
        {"$sort": {"totalPlays": -1}},
        {"$limit": 5}
    ]
    top_games = list(plays_collection.aggregate(top_games_pipeline))

    top_players_pipeline = [
        {"$group": {"_id": "$user_id", "totalPlays": {"$sum": "$plays"}}},
        {"$sort": {"totalPlays": -1}},
        {"$limit": 5},
        {"$lookup": {"from": "users", "localField": "_id", "foreignField": "_id", "as": "userInfo"}},
        {"$unwind": "$userInfo"},
        {"$project": {"username": "$userInfo.username", "totalPlays": 1, "_id": 0}}
    ]
    top_players = list(plays_collection.aggregate(top_players_pipeline))

    return jsonify({
        'top_games': top_games,
        'top_players': top_players
    })

if __name__ == '__main__':
    app.run(debug=True)