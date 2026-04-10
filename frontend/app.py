import streamlit as st
import requests
from pathlib import Path
import json
import os
import sys

# Page configuration
st.set_page_config(
    page_title="Alstom QA System",
    page_icon="✓",
    layout="wide"
)

# Title
st.title("🔍 Alstom QA System - Row Validator")
st.write("Upload a factory row image for automatic component validation")

# Load blueprint directly from JSON file
blueprint_path = Path(__file__).parent.parent / "data" / "blueprint.json"


def load_blueprint():
    """Load the blueprint from JSON file"""
    try:
        with open(blueprint_path, 'r') as f:
            data = json.load(f)
            # Convert list to dictionary format for easier lookup
            blueprint_dict = {}
            for slot in data:
                row_id = slot.get('slot_id', '').split('-')[0]  # e.g., "R1" from "R1-S1"
                if row_id not in blueprint_dict:
                    blueprint_dict[row_id] = {'slots': []}
                blueprint_dict[row_id]['slots'].append(slot)
            return blueprint_dict
    except Exception as e:
        st.warning(f"Could not load blueprint: {e}")
        return {}


# Load blueprint for expected values
blueprint = load_blueprint()


def get_expected_values(slot_id):
    """Get expected calibre and identification for a slot from blueprint"""
    try:
        parts = slot_id.split('-')
        if len(parts) == 2:
            row_num = parts[0]
            slot_num = int(parts[1][1:])

            if row_num in blueprint:
                slots = blueprint[row_num].get('slots', [])
                if slot_num <= len(slots):
                    slot_data = slots[slot_num - 1]
                    return {
                        'calibre': slot_data.get('expected_calibre'),
                        'identification': slot_data.get('expected_identification')
                    }
    except:
        pass

    return {'calibre': 'N/A', 'identification': 'N/A'}


def display_result_card(slot_result):
    """Display a single slot result as a color-coded card"""
    slot_id = slot_result.get('slot_id', 'N/A')
    status = slot_result.get('status', 'UNKNOWN')
    scanned_calibre = slot_result.get('scanned_calibre', 'N/A')
    scanned_id = slot_result.get('scanned_identification', 'N/A')
    message = slot_result.get('message', '')

    # Create card with columns
    col1, col2 = st.columns([1, 4])

    with col1:
        if status == 'PASS':
            st.success(f"✅ PASS")
        elif 'FAIL' in status:
            st.error(f"❌ FAIL")
        else:
            st.warning(f"⚠️ ERROR")

    with col2:
        st.subheader(f"{slot_id}")

        st.write(f"**Scanned Calibre:** `{scanned_calibre}`")
        st.write(f"**Scanned ID:** `{scanned_id}`")

        if 'FAIL' in status:
            expected = get_expected_values(slot_id)
            st.divider()
            st.write("**Expected vs Scanned:**")
            col_exp, col_arrow, col_scan = st.columns([2, 1, 2])
            with col_exp:
                st.write(f"**Expected Calibre:** `{expected['calibre']}`")
                st.write(f"**Expected ID:** `{expected['identification']}`")
            with col_arrow:
                st.write("➜")
            with col_scan:
                st.write(f"**Got:** `{scanned_calibre}`")
                st.write(f"**Got:** `{scanned_id}`")

        if message:
            st.caption(f"ℹ️ {message}")


# --- Sidebar Setup ---
st.sidebar.header("Configuration")

# Row ID input
row_id = st.sidebar.number_input(
    "Enter Row ID",
    min_value=1,
    max_value=10,
    value=1,
    step=1,
    help="Which row number are you scanning?"
)

# Initialize session state for the image
if 'image_path' not in st.session_state:
    st.session_state['image_path'] = None

st.sidebar.header("Image Upload")

# Streamlit File Uploader
uploaded_file = st.sidebar.file_uploader("Upload an image of the row", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Save the uploaded file to a temporary location so the backend can read it
    temp_dir = Path("frontend")
    temp_dir.mkdir(exist_ok=True)
    temp_path = temp_dir / "temp_uploaded_image.jpg"
    
    with open(temp_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
        
    st.session_state['image_path'] = str(temp_path)
    
    st.sidebar.success("Image uploaded successfully!")
    st.sidebar.image(uploaded_file, caption="Preview", use_container_width=True)


# --- Main Content Area ---
col1, col2 = st.columns([2, 1])

with col2:
    scan_button = st.button("🔍 Confirm & Scan", use_container_width=True)

# Handle scan button click
if scan_button:
    if not st.session_state['image_path']:
        st.error("❌ Please upload an image first using the sidebar!")
    else:
        image_to_scan = st.session_state['image_path']

        with st.spinner("🔄 Processing image... This may take a moment"):
            try:
                response = requests.post(
                    "http://localhost:8000/api/validate_slot",
                    json={
                        "image_path": image_to_scan,
                        "row_id": f"R{row_id}"
                    }
                )

                if response.status_code == 200:
                    results = response.json()
                    validation_results = results.get('validation_results', [])
                    
                    if len(validation_results) == 0:
                        st.warning("⚠️ No panel components detected! Please try uploading a different image.")
                    else:
                        st.success("✅ Validation Complete!")

                        st.markdown("---")
                        st.subheader(f"📋 Validation Results for {results.get('row_id', 'Row')}")

                        pass_count = sum(1 for r in validation_results if r.get('status') == 'PASS')
                        fail_count = len(validation_results) - pass_count

                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.metric("Total Slots", len(validation_results))
                        with col2:
                            st.metric("✅ Passed", pass_count, delta=None)
                        with col3:
                            st.metric("❌ Failed", fail_count, delta=None)

                        st.markdown("---")

                        st.subheader("Slot Details")
                        for slot_result in validation_results:
                            display_result_card(slot_result)
                
                else:
                    st.error(f"❌ API Error: {response.status_code}")
                    st.write(response.text)

            except requests.exceptions.ConnectionError:
                st.error("❌ Connection Error: Could not connect to the backend server. Is `uvicorn backend.main:app --reload` running in another terminal?")
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")