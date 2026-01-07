import sys
# Python 3.9 compatibility patch for google-generativeai
if sys.version_info < (3, 10):
    try:
        import importlib.metadata
        import importlib_metadata
        if not hasattr(importlib.metadata, "packages_distributions"):
            importlib.metadata.packages_distributions = importlib_metadata.packages_distributions
            importlib.metadata.version = importlib_metadata.version
            importlib.metadata.PackageNotFoundError = importlib_metadata.PackageNotFoundError
    except ImportError:
        pass

from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import os
import json
import difflib
import shutil
from datetime import datetime
from .browser import extract_license_info
from .browser_lei import extract_lei_info
from .browser2 import extract_website_data
import google.generativeai as genai
from supabase import create_client, Client



# Configure Gemini
GENAI_API_KEY = os.getenv("VITE_GEMINI_API_KEY") 

if not GENAI_API_KEY:
    # Try reading from .env manually if not in environment
    try:
        with open(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'), 'r') as f:
            for line in f:
                if line.startswith("VITE_GEMINI_API_KEY="):
                    GENAI_API_KEY = line.split("=", 1)[1].strip().strip('"')
                    break
    except:
        pass

if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

# Configure Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("Warning: Supabase credentials not found. Zamp features will not persist correctly.")

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"], # Localhost
    allow_origin_regex="https://.*\.vercel\.app", # Allow all Vercel deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LEIRequest(BaseModel):
    leiCode: str

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/verify-lei")
async def verify_lei(request: LEIRequest):
    try:
        print(f"Received request for LEI: {request.leiCode}")
        
        # Run extraction
        data = await extract_lei_info(request.leiCode)
        
        # Handle Video
        video_path = data.get("video_path")
        public_video_path = None
        
        if video_path and os.path.exists(video_path):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            video_filename = f"lei_check_{request.leiCode}_{timestamp}.webm"
            
            if supabase:
                try:
                    with open(video_path, 'rb') as f:
                        supabase.storage.from_("uploads").upload(video_filename, f, {"content-type": "video/webm"})
                    public_video_path = supabase.storage.from_("uploads").get_public_url(video_filename)
                    # Cleanup local file
                    os.remove(video_path)
                except Exception as upload_err:
                    print(f"Supabase upload failed: {upload_err}")
                    public_video_path = None
            else:
                 print("Supabase not configured, skipping video upload")

            data["public_video_path"] = public_video_path
            
        return data

    except Exception as e:
        print(f"Error verifying LEI: {e}")
        raise HTTPException(status_code=500, detail=str(e))





# --- Zamp Dashboard Configuration ---
# REMOVED: Filesystem paths. Using Supabase now.

class LicenseRequest(BaseModel):
    licenseNumber: str

class WebsiteRequest(BaseModel):
    url: str

class ZampInitRequest(BaseModel):
    processName: str
    team: str

class ZampLogRequest(BaseModel):
    processId: str
    log: dict # { title, status, time, artifacts, ... }
    stepId: str = None # Optional ID to identify unique steps for updates
    stepId: str = None # Optional ID to identify unique steps for updates
    keyDetails: dict = None # Optional updates to key details
    metadata: dict = None # Optional updates to top-level process metadata (e.g. status, applicantName)

class HelpChatRequest(BaseModel):
    query: str
    contextData: dict = {}
    stepInfo: str = ""

def get_knowledge_base():
    try:
        kb_path = os.path.join(PROJECT_ROOT, "src", "docs", "knowledge-base.md")
        if os.path.exists(kb_path):
            with open(kb_path, 'r') as f:
                return f.read()
    except Exception as e:
        print(f"Error reading knowledge base: {e}")
    return ""

@app.post("/extract-license")
async def extract_license(request: LicenseRequest):
    try:
        print(f"Received request for license: {request.licenseNumber}")
        
        # Run the extraction logic
        data = await extract_license_info(request.licenseNumber)
        
        # Handle Video
        video_path = data.get("video_path")
        public_video_path = None
        
        if video_path and os.path.exists(video_path):
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            video_filename = f"license_check_{request.licenseNumber}_{timestamp}.webm"
            
            if supabase:
                try:
                    with open(video_path, 'rb') as f:
                        supabase.storage.from_("uploads").upload(video_filename, f, {"content-type": "video/webm"})
                    public_video_path = supabase.storage.from_("uploads").get_public_url(video_filename)
                    os.remove(video_path)
                except Exception as upload_err:
                    print(f"Supabase upload failed: {upload_err}")
            
            data["public_video_path"] = public_video_path
        
        return data
        
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def extract_qr_url(file_path: str):
    """
    Uses Gemini to identify QR code in the image and extract the URL.
    """
    try:
        if not GENAI_API_KEY:
            print("Gemini API Key missing")
            return None

        # Upload file to Gemini
        sample_file = genai.upload_file(file_path)
        print(f"Uploaded file to Gemini: {sample_file.uri}")

        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        
        prompt = """
        Extract the URL encoded in the QR code within this image. 
        Also extract the "License Number" from the text.
        
        You MUST return the result in valid JSON format only. Do not add any conversational text.
        format:
        { 
            "url": "https://...", 
            "licenseNumber": "123..." 
        }
        """
        
        response = model.generate_content([sample_file, prompt])
        print(f"Gemini QR Response: {response.text}")
        
        text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text)
        
        return data

    except Exception as e:
        print(f"Error extracting QR URL with Gemini: {e}")
        return None

@app.post("/verify-trade-license-file")
async def verify_trade_license_file(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        temp_filename = f"temp_upload_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
        # Use /tmp for railway/cloud
        temp_dir = "/tmp" if os.path.exists("/tmp") else "."
        temp_path = os.path.join(temp_dir, temp_filename)
        
        with open(temp_path, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        print(f"File saved for QR scan: {temp_path}")
        
        # 1. Extract URL via Gemini
        qr_data = await extract_qr_url(temp_path)
        
        url = qr_data.get("url") if qr_data else None
        license_number_ocr = qr_data.get("licenseNumber") if qr_data else "Unknown"

        if not url:
            print("No QR code URL found by Gemini.")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return {"error": "Could not identify a QR code in the document. Please ensure the QR code is clear."}
            
        print(f"Extracted URL from QR: {url}")
        
        # 2. Run Browser Agent Verification on that URL
        data = await extract_license_info(direct_url=url)
        
        # 3. Handle Video
        video_path = data.get("video_path")
        public_video_path = None
        
        if video_path and os.path.exists(video_path):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            video_filename = f"license_check_qr_{timestamp}.webm"
            
            if supabase:
                 try:
                    with open(video_path, 'rb') as f:
                        supabase.storage.from_("uploads").upload(video_filename, f, {"content-type": "video/webm"})
                    public_video_path = supabase.storage.from_("uploads").get_public_url(video_filename)
                    os.remove(video_path)
                 except Exception as ue:
                     print(f"Video upload failed: {ue}")

            data["public_video_path"] = public_video_path
            
        # Upload the user's file to supabase as well for reference
        uploaded_file_url = None
        if supabase:
             try:
                 with open(temp_path, 'rb') as f:
                     supabase.storage.from_("uploads").upload(temp_filename, f)
                 uploaded_file_url = supabase.storage.from_("uploads").get_public_url(temp_filename)
             except Exception as ue:
                 print(f"File upload failed: {ue}")
        
        # Add the uploaded file path as a reference
        data["uploaded_file_path"] = uploaded_file_url
        
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return data

    except Exception as e:
        print(f"Error verifying trade license file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verify-website")
async def verify_website(request: WebsiteRequest):
    try:
        print(f"Received request for website: {request.url}")
        
        # Run extraction
        data = await extract_website_data(request.url)
        
        # Handle Video
        video_path = data.get("video_path")
        public_video_path = None
        
        if video_path and os.path.exists(video_path):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            video_filename = f"website_check_{timestamp}.webm"
            
            if supabase:
                 try:
                    with open(video_path, 'rb') as f:
                        supabase.storage.from_("uploads").upload(video_filename, f, {"content-type": "video/webm"})
                    public_video_path = supabase.storage.from_("uploads").get_public_url(video_filename)
                    os.remove(video_path)
                 except Exception as ue:
                     print(f"Video upload failed: {ue}")

            data["public_video_path"] = public_video_path
            
        return data

    except Exception as e:
        print(f"Error verifying website: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Address verification now handled securely via Frontend Google Maps integration.
# Legacy endpoint removed.


class AddressMatchRequest(BaseModel):
    address1: str
    address2: str

@app.post("/match-addresses")
async def match_addresses(request: AddressMatchRequest):
    try:
        print(f"Matching addresses: '{request.address1}' vs '{request.address2}'")
        
        if not GENAI_API_KEY:
             # Fallback if no API key: Simple loose match
             ratio = 0
             # Simple exact set match (very weak, but fallback)
             s1 = set(request.address1.lower().split())
             s2 = set(request.address2.lower().split())
             intersection = s1.intersection(s2)
             if len(intersection) / float(len(s1) + len(s2)) > 0.3:
                 return {"match": True, "reason": "Keyword fallback match"}
             return {"match": False, "reason": "Fallback mismatch"}

        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        prompt = f"""
        Compare these two addresses and determine if they refer to the same location/building/entity.
        Address 1: "{request.address1}"
        Address 2: "{request.address2}"
        
        Strictness: Moderate. Different formats (e.g. "St." vs "Street", "Dubai" included or not) are accepable.
        Return ONLY valid JSON with format: {{ "match": boolean, "reason": "short explanation" }}
        """
        
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text)
        
        print(f"Match result: {data}")
        return data

    except Exception as e:
        print(f"Error matching addresses: {e}")
        return {"match": False, "reason": str(e)}

# --- Name Matching Endpoint ---
# --- Name Matching Endpoint ---
class NameMatchRequest(BaseModel):
    name1: str
    name2: str

@app.post("/match-names")
async def match_names(request: NameMatchRequest):
    try:
        if not request.name1 or not request.name2:
            print(f"Empty names received: '{request.name1}' vs '{request.name2}'")
            return {"match": False, "confidence": 0.0, "reason": "One or both names are empty"}

        n1 = request.name1.lower().strip()
        n2 = request.name2.lower().strip()
        print(f"Matching names (normalized): '{n1}' vs '{n2}'")
        
        # 1. Exact Match Check
        if n1 == n2:
             return {"match": True, "confidence": 1.0, "reason": "Exact match detected"}
        
        # 1.5 Aggressive Alphanumeric Match (ignores spaces/symbols)
        # removes anything that is NOT alphanumeric
        import re
        n1_alpha = re.sub(r'[^a-z0-9]', '', n1)
        n2_alpha = re.sub(r'[^a-z0-9]', '', n2)
        if n1_alpha and n2_alpha and n1_alpha == n2_alpha:
             return {"match": True, "confidence": 0.99, "reason": "Alphanumeric strict match (ignored spaces/symbols)"}

        # 2. Fuzzy Match Check (Deterministic fallback for typos)
        similarity = difflib.SequenceMatcher(None, n1, n2).ratio()
        print(f"Fuzzy similarity ratio: {similarity}")
        if similarity > 0.85:
             return {"match": True, "confidence": similarity, "reason": f"High confidence fuzzy match ({similarity:.2f})"}

        if not GENAI_API_KEY:
             return {"match": False, "confidence": similarity, "reason": f"No AI Key. Similarity {similarity:.2f} too low."}

        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        prompt = f"""
        Compare these two names and determine if they refer to the same person.
        Name 1 (User entered): "{request.name1}"
        Name 2 (ID Document): "{request.name2}"
        
        Strictness: High. Minor typos or middle name variations are acceptable, but completely different names are not.
        Return ONLY valid JSON with format: {{ "match": boolean, "confidence": float (0.0-1.0), "reason": "explanation" }}
        """
        
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text)
        
        print(f"Name match result: {data}")
        return data

    except Exception as e:
        print(f"Error matching names: {e}")
        # Default fail open or closed? Let's fail safe (allow) or strict? 
        # Requirement says "check... has to match". So fail if we can't verify?
        # Let's return error but frontend can choose to proceed or block.
        return {"match": False, "confidence": 0.0, "reason": str(e)}

# --- Zamp Integration Endpoints ---

@app.get("/zamp/processes")
async def get_processes():
    try:
        if not supabase:
             return []
        response = supabase.table("processes").select("*").execute()
        return response.data
    except Exception as e:
        print(f"Error fetching processes: {e}")
        return []

@app.get("/zamp/process/{processId}")
async def get_process_details(processId: str):
    try:
        if not supabase:
             return None
        # fetch state
        response = supabase.table("process_states").select("state").eq("process_id", processId).execute()
        if response.data:
            return response.data[0]["state"]
        return None
    except Exception as e:
         print(f"Error fetching process details: {e}")
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/zamp/init")
async def zamp_init(request: ZampInitRequest):
    try:
        if not supabase:
             raise HTTPException(status_code=500, detail="Supabase not configured")

        # Generate new ID
        # For simplicity, let's just count existing or use UUID? 
        # Existing logic used incremental ID. Let's try to maintain that or just use random string.
        # DB Auto-increment ID is available in 'id' column but we need a string process_id.
        # Let's count rows for simplicity to keep "Stock #1" format approximately working
        count_res = supabase.table("processes").select("process_id", count="exact").execute()
        new_id = str(count_res.count + 1)
        
        today = datetime.now().strftime("%Y-%m-%d")

        # Create new process entry
        new_process = {
            "process_id": new_id,
            "stock_id": f"{request.processName} #{new_id}",
            "name": "Applicant", 
            "year": today,
            "status": "In Progress"
        }
        
        supabase.table("processes").insert(new_process).execute()

        # Initialize process details
        initial_data = {
            "id": new_id,
            "sections": {
                "overview": {"title": "Overview", "content": "Process Overview"},
                "activityLogs": {"title": "Activity Logs", "items": []},
                "keyDetails": {"title": "Key Details", "items": []}
            }
        }
        
        supabase.table("process_states").insert({"process_id": new_id, "state": initial_data}).execute()
            
        return {"processId": new_id}
        
    except Exception as e:
        print(f"Error initializing Zamp process: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/zamp/log")
async def zamp_log(request: ZampLogRequest):
    try:
        if not supabase:
             raise HTTPException(status_code=500, detail="Supabase not configured")

        # Fetch current state
        res = supabase.table("process_states").select("state").eq("process_id", request.processId).execute()
        if not res.data:
             # If not found, init?
             process_data = {
                "id": request.processId,
                "sections": {
                    "overview": {"title": "Overview", "content": "Process Overview"},
                    "activityLogs": {"title": "Activity Logs", "items": []},
                    "keyDetails": {"title": "Key Details", "items": []}
                }
            }
        else:
            process_data = res.data[0]["state"]
            
        # Add timestamp if not present
        if "time" not in request.log:
            request.log["time"] = datetime.now().strftime("%I:%M %p")
            
        # Store stepId
        if request.stepId:
            request.log["stepId"] = request.stepId

        # --- UPDATE LOGIC ---
        updated = False
        if request.stepId:
            items = process_data.get("sections", {}).get("activityLogs", {}).get("items", [])
            for i, item in enumerate(items):
                if item.get("stepId") == request.stepId:
                    # Update existing item
                    print(f"Updating existing log step: {request.stepId}")
                    items[i].update(request.log)
                    updated = True
                    break
        
        if not updated:
            # Append new log
            if "sections" not in process_data: process_data["sections"] = {}
            if "activityLogs" not in process_data["sections"]: process_data["sections"]["activityLogs"] = {"title":"Activity Logs","items":[]}
            process_data["sections"]["activityLogs"]["items"].append(request.log)

        # --- ARTIFACT SYNC LOGIC ---
        if "artifacts" in request.log and request.log["artifacts"]:
            if "sidebarArtifacts" not in process_data["sections"]:
                process_data["sections"]["sidebarArtifacts"] = {"title": "Artifacts", "items": []}
            
            existing_ids = set(item.get("id") for item in process_data["sections"]["sidebarArtifacts"]["items"])
            
            for artifact in request.log["artifacts"]:
                if artifact.get("id") not in existing_ids:
                    process_data["sections"]["sidebarArtifacts"]["items"].append(artifact)

        # Update Key Details if provided
        if request.keyDetails:
             if "keyDetails" not in process_data["sections"]: process_data["sections"]["keyDetails"] = {"title":"Key Details","items":[]}
             
             if isinstance(request.keyDetails, dict):
                 process_data["sections"]["keyDetails"]["items"].append(request.keyDetails)
             elif isinstance(request.keyDetails, list):
                  process_data["sections"]["keyDetails"]["items"].extend(request.keyDetails)

        # Update DB State
        supabase.table("process_states").update({"state": process_data}).eq("process_id", request.processId).execute()

        # --- METADATA UPDATE LOGIC (processes table) ---
        if request.metadata:
            print(f"Updating process metadata: {request.metadata}")
            update_payload = {}
            # Map known fields
            if "status" in request.metadata: update_payload["status"] = request.metadata["status"]
            if "applicantName" in request.metadata: update_payload["applicant_name"] = request.metadata["applicantName"]
            
            if update_payload:
                supabase.table("processes").update(update_payload).eq("process_id", request.processId).execute()
            
        return {"status": "success"}
        
    except Exception as e:
        print(f"Error logging to Zamp: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/zamp/upload")
async def zamp_upload(file: UploadFile = File(...)):
    try:
        if not supabase:
             raise HTTPException(status_code=500, detail="Supabase not configured")

        temp_filename = f"zamp_upload_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
        
        # Read file into memory to upload (careful with large files, but UploadFile spooled it anyway)
        # Verify if supabase-py supports file object directly
        file_bytes = await file.read()
        
        supabase.storage.from_("uploads").upload(temp_filename, file_bytes)
        public_url = supabase.storage.from_("uploads").get_public_url(temp_filename)
            
        return {"path": public_url}
        
    except Exception as e:
        print(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/help")
async def chat_help(request: HelpChatRequest):
    try:
        if not GENAI_API_KEY:
            raise HTTPException(status_code=500, detail="Gemini API Key not configured")

        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
        # Load knowledge base
        knowledge_base_content = get_knowledge_base()
        
        # Construct dynamic context-aware prompt
        system_instruction = f"""You are a helpful, friendly AI assistant built into the Business Onboarding dashboard.
Your goal is to assist the user with their current onboarding step.

KNOWLEDGE BASE:
Here is the official documentation for the onboarding process. Use this to answer user questions accurately.
{knowledge_base_content}

CURRENT CONTEXT:
The user is currently on step: "{request.stepInfo}".
They have provided the following data so far in the form:
{json.dumps(request.contextData, indent=2)}

INSTRUCTIONS:
1. Answer the user's question clearly and concisely.
2. Use the provided KNOWLEDGE BASE and CONTEXT to maximize relevance.
3. Be encouraging and professional.
4. Keep answers short (under 3 sentences) unless complex explanation is needed.
5. CRITICAL: After answering, ALWAYS gently prompt the user back to the current step (e.g., "Now, please enter your [Field Name] to continue.").
"""
        
        chat = model.start_chat(history=[
            {"role": "user", "parts": [system_instruction + f"\n\nUSER QUERY: {request.query}"]}
        ])
        
        response = chat.send_message(request.query)
        return {"response": response.text}

    except Exception as e:
        print(f"Error in help chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ...

class MessageRequest(BaseModel):
    processId: str
    sender: str  # "Zamp" or "Applicant"
    content: str

class ApproveRequest(BaseModel):
    processId: str

@app.post("/zamp/message")
async def send_message(request: MessageRequest):
    try:
        if not supabase:
             raise HTTPException(status_code=500, detail="Supabase not configured")

        res = supabase.table("process_states").select("state").eq("process_id", request.processId).execute()
        if not res.data:
             raise HTTPException(status_code=404, detail="Process not found")
        
        process_data = res.data[0]["state"]

        # Ensure messages section exists
        if "messages" not in process_data.get("sections", {}):
            if "sections" not in process_data: process_data["sections"] = {}
            process_data["sections"]["messages"] = {"title": "Messages", "items": []}

        new_message = {
            "id": f"msg-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "sender": request.sender,
            "content": request.content,
            "time": datetime.now().strftime("%I:%M %p"),
            "timestamp": datetime.now().isoformat()
        }

        process_data["sections"]["messages"]["items"].append(new_message)

        supabase.table("process_states").update({"state": process_data}).eq("process_id", request.processId).execute()

        return {"status": "success", "message": new_message}

    except Exception as e:
        print(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/zamp/messages/{processId}")
async def get_messages(processId: str):
    try:
        if not supabase: return {"messages": []}
        res = supabase.table("process_states").select("state").eq("process_id", processId).execute()
        if not res.data: return {"messages": []}

        process_data = res.data[0]["state"]
        messages = process_data.get("sections", {}).get("messages", {}).get("items", [])
        return {"messages": messages}
    except Exception as e:
        print(f"Error getting messages: {e}")
        return {"messages": []}

@app.get("/zamp/status/{processId}")
async def get_process_status(processId: str):
    try:
        if not supabase: return {"status": "Unknown"}
        res = supabase.table("processes").select("status").eq("process_id", processId).execute()
        if res.data:
            return {"status": res.data[0]["status"]}
        return {"status": "Unknown"}
    except Exception as e:
        return {"status": "Unknown"}

@app.post("/zamp/approve/{processId}")
async def approve_application(processId: str):
    try:
        if not supabase:
             raise HTTPException(status_code=500, detail="Supabase not configured")

        # 1. Update processes
        supabase.table("processes").update({"status": "Done"}).eq("process_id", processId).execute()

        # 2. Update process_states (Log the approval)
        res = supabase.table("process_states").select("state").eq("process_id", processId).execute()
        if res.data:
            process_data = res.data[0]["state"]
            
            # Add Approval Log
            approval_log = {
                "title": "Application Approved",
                "status": "success",
                "type": "success",
                "time": datetime.now().strftime("%I:%M %p"),
                "description": "Application has been approved by the Zamp team."
            }
            if "activityLogs" in process_data.get("sections", {}):
                 process_data["sections"]["activityLogs"]["items"].append(approval_log)
            
            # CRITICAL: Update Key Details Status
            if "keyDetails" in process_data.get("sections", {}):
                kd_items = process_data["sections"]["keyDetails"].get("items", [])
                if isinstance(kd_items, list):
                    if kd_items:
                        kd_items[-1]["status"] = "Done"
                    else:
                        kd_items.append({"status": "Done"})
            
            supabase.table("process_states").update({"state": process_data}).eq("process_id", processId).execute()

        return {"status": "success"}

    except Exception as e:
        print(f"Error approving application: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
