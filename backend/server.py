from flask import Flask, request, Response
import os
from dotenv import load_dotenv
import logging
from flask_cors import CORS
import database
import csv
import io

# Load environment variables
load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Initialize DB
database.init_db()

@app.route('/connect-to-uv', methods=['POST', 'GET'])
def connect_to_uv():
    """Returns ExoML to Exotel to connect the call to Ultravox."""
    join_url = request.args.get('joinUrl')
    if not join_url:
        return Response("Missing joinUrl", status=400)
    
    exoml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{join_url}">
            <Parameter name="a" value="b" />
        </Stream>
    </Connect>
</Response>
"""
    return Response(exoml_response, mimetype='application/xml')

@app.route('/webhook/ultravox', methods=['POST'])
def handle_call_end():
    """Receives call summary from Ultravox after call ends."""
    try:
        data = request.json
        logging.info(f"Received Webhook from Ultravox: {data}")
        
        if data.get('event') == 'call.ended':
            call_id = data['call']['callId']
            summary = data['call'].get('shortSummary', 'No summary available')
            sentiment = data['call'].get('sentiment', 'Unknown')
            recording_url = data['call'].get('recordingUrl', '')
            
            # Extract duration (handle '30s' or 30)
            duration_raw = data['call'].get('duration', 0)
            duration_seconds = 0
            try:
                if isinstance(duration_raw, str):
                    duration_seconds = int(duration_raw.replace('s', ''))
                else:
                    duration_seconds = int(duration_raw)
            except:
                duration_seconds = 60 # Fallback to 1 min if parsing fails
            
            # Update DB
            database.update_call_result(call_id, summary, sentiment, recording_url, duration_seconds)
            logging.info(f"Updated DB for Call ID: {call_id} with duration {duration_seconds}s")

        return "", 204
    except Exception as e:
        logging.error(f"Error processing webhook: {e}")
        return "Error", 500

@app.route('/webhook/exotel_status', methods=['POST'])
def handle_exotel_status():
    data = request.form
    logging.info(f"Exotel Status Update: {data}")
    return "", 200

# --- API for React Dashboard ---

@app.route('/api/upload', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return {"error": "No file uploaded"}, 400
    
    file = request.files['file']
    if file.filename == '':
        return {"error": "No file selected"}, 400
        
    try:
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_input = csv.DictReader(stream)
        
        leads = []
        for row in csv_input:
            # Normalize keys
            # Expecting Name, Phone
            logging.info(f"Parsing Row: {row}")
            if 'Name' in row and 'Phone' in row:
                leads.append({'Name': row['Name'], 'Phone': row['Phone']})
                
        count = database.add_leads(leads)
        return {"message": f"Successfully added {count} leads", "count": count}
    
    except Exception as e:
        logging.error(f"CSV Parse Error: {e}")
        return {"error": "Failed to parse CSV"}, 500

@app.route('/api/start_campaign', methods=['POST'])
def start_campaign():
    try:
        count = database.start_campaign()
        return {"message": "Campaign started", "leads_activated": count}
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/api/dashboard', methods=['GET'])
def api_dashboard():
    try:
        stats = database.get_dashboard_stats()
        return stats
    except Exception as e:
        logging.error(f"Error fetching stats: {e}")
        return {"error": str(e)}, 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
