import requests
import time
import os
from dotenv import load_dotenv
import logging
import database

# Load environment variables
load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Configuration
ULTRAVOX_API_KEY = os.getenv("ULTRAVOX_API_KEY")
EXOTEL_SID = os.getenv("EXOTEL_SID")
EXOTEL_API_KEY = os.getenv("EXOTEL_API_KEY")
EXOTEL_API_TOKEN = os.getenv("EXOTEL_API_TOKEN")
EXOTEL_PHONE_NUMBER = os.getenv("EXOTEL_PHONE_NUMBER")
SERVER_BASE_URL = os.getenv("SERVER_BASE_URL")
SYSTEM_PROMPT_TEMPLATE = os.getenv("SYSTEM_PROMPT", "You are calling {name}. Your goal is to qualify the lead.")

# Initialize DB if not exists
database.init_db()

def trigger_outbound_call(phone, name):
    logging.info(f"Initiating call for {name} ({phone})...")
    
    # Format the prompt with the lead's name
    formatted_prompt = SYSTEM_PROMPT_TEMPLATE.replace("{name}", name)
    
    try:
        # 1. Create Ultravox Call to get the 'joinUrl'
        uv_response = requests.post(
            "https://api.ultravox.ai/api/calls",
            headers={"X-API-Key": ULTRAVOX_API_KEY},
            json={
                "systemPrompt": formatted_prompt,
                "firstSpeakerSettings": {"user": {}}, 
                "medium": {"twilio": {}} 
            }
        )
        uv_response.raise_for_status()
        uv_data = uv_response.json()
        join_url = uv_data['joinUrl']
        logging.info(f"Ultravox Call Created. Join URL: {join_url}")

        # 2. Trigger Exotel
        callback_url = f"{SERVER_BASE_URL}/connect-to-uv?joinUrl={join_url}"
        
        # specific to Mumbai cluster as requested
        exotel_url = f"https://api.in.exotel.com/v1/Accounts/{EXOTEL_SID}/Calls/connect"
        exotel_data = {
            "From": phone,
            "CallerId": EXOTEL_PHONE_NUMBER,
            "Url": callback_url,
            "StatusCallback": f"{SERVER_BASE_URL}/webhook/exotel_status", 
            "StatusCallbackEvents[0]": "terminal"
        }
        
        exotel_response = requests.post(
            exotel_url, 
            auth=(EXOTEL_API_KEY, EXOTEL_API_TOKEN),
            data=exotel_data
        )
        exotel_response.raise_for_status()
        logging.info(f"Exotel Call Triggered: {exotel_response.text}")
        
        return uv_data.get('callId') 

    except Exception as e:
        logging.error(f"Error triggering call: {e}")
        return False

def main():
    logging.info("Observer started. Monitoring DB for 'Ready' leads...")
    while True:
        try:
            # 1. Check Balance
            balance = database.get_wallet_balance()
            if balance < 10.0: # Minimum threshold to start a call
                logging.warning(f"Low Balance: ₹{balance}. Pausing calls.")
                time.sleep(10)
                continue

            # 2. Fetch Ready leads from DB
            leads = database.get_ready_leads()
            
            for lead in leads:
                # Re-check balance before every single call to be safe
                if database.get_wallet_balance() < 10.0:
                    logging.warning("Balance depleted during campaign. Stopping.")
                    break

                logging.info(f"Found Ready lead: {lead['name']}")
                
                # Mark as Calling immediately to prevent double pick-up
                database.update_lead_status(lead['id'], "Calling")
                
                call_id = trigger_outbound_call(lead['phone'], lead['name'])
                
                if call_id:
                    database.update_lead_status(lead['id'], "Calling", call_id=call_id)
                else:
                    database.update_lead_status(lead['id'], "Failed")
                        
            time.sleep(5)
            
        except Exception as e:
            logging.error(f"Error in main loop: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
