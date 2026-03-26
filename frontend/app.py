import streamlit as st
import requests
from pathlib import Path
import time
import json
import os
import sys

# Ensure we can import from the frontend directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from camera import capture_frame

# Page configuration
st.set_page_config(
    page_title="Alstom QA System",
    page_icon="✓",
    layout="wide"
)

# Title
st.title("🔍 Alstom QA System - Row Validator")
st.write("Capture a factory row image using your camera for automatic component validation")

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
                row_id = slot.get('slot_id', '').split(
                    '-')[0]  # e.g., "R1" from "R1-S1"
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
        # Extract slot info from blueprint
        # Format is like "R1-S1" so we need to parse it
        parts = slot_id.split('-')
        if len(parts) == 2:
            row_num = parts[0]  # e.g., "R1"
            slot_num = int(parts[1][1:])  # e.g., "S1" -> 1

            # Get from blueprint
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

    # Determine color based on status
    if status == 'PASS':
        color = '#00CC44'  # Green
        bg_color = '#E8F5E9'
        emoji = '✅'
    elif 'FAIL' in status:
        color = '#FF3333'  # Red
        bg_color = '#FFEBEE'
        emoji = '❌'
    else:
        color = '#FF9800'  # Orange for ERROR
        bg_color = '#FFF3E0'
        emoji = '⚠️'

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

        # Show scanned values
        st.write(f"**Scanned Calibre:** `{scanned_calibre}`")
        st.write(f"**Scanned ID:** `{scanned_id}`")

        # Show expected values for FAIL statuses
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

# Initialize session state for the captured image
if 'capture_path' not in st.session_state:
    st.session_state['capture_path'] = None

st.sidebar.header("Camera Input")

# Button to trigger OpenCV Camera
if st.sidebar.button("📸 Capture Image", use_container_width=True):
    st.sidebar.info("Look for the camera window! Press Spacebar to capture.")
    
    # Call our new function
    captured_path = capture_frame()
    
    # Save to session state so it doesn't disappear when Streamlit reruns
    if captured_path:
        st.session_state['capture_path'] = captured_path

# Show the preview in the sidebar if an image was captured
if st.session_state['capture_path'] and os.path.exists(st.session_state['capture_path']):
    st.sidebar.success("Image ready for scanning!")
    st.sidebar.image(st.session_state['capture_path'], caption="Captured Frame")


# --- Main Content Area ---
col1, col2 = st.columns([2, 1])

with col2:
    scan_button = st.button("🔍 Confirm & Scan", use_container_width=True)

# Handle scan button click
if scan_button:
    if not st.session_state['capture_path']:
        st.error("❌ Please capture an image first using the sidebar button!")
    else:
        image_to_scan = st.session_state['capture_path']

        # Show loading spinner and make API call
        with st.spinner("🔄 Processing image... This may take a moment"):
            try:
                # Send POST request to FastAPI
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
                    
                    # NEW CHECK: Did YOLO actually find anything?
                    if len(validation_results) == 0:
                        st.warning("⚠️ No panel components detected! Please ensure the camera is pointed clearly at the switches and stickers, then try capturing again.")
                    else:
                        st.success("✅ Validation Complete!")

                        # Display results header
                        st.markdown("---")
                        st.subheader(f"📋 Validation Results for {results.get('row_id', 'Row')}")

                        # Count pass/fail
                        pass_count = sum(1 for r in validation_results if r.get('status') == 'PASS')
                        fail_count = len(validation_results) - pass_count

                        # Summary metrics
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.metric("Total Slots", len(validation_results))
                        with col2:
                            st.metric("✅ Passed", pass_count, delta=None)
                        with col3:
                            st.metric("❌ Failed", fail_count, delta=None)

                        st.markdown("---")

                        # Display individual slot cards
                        st.subheader("Slot Details")
                        for slot_result in validation_results:
                            display_result_card(slot_result)
                
                
                else:
                    st.error(f"❌ API Error: {response.status_code}")
                    st.write(response.text)

            except Exception as e:
                st.error(f"❌ Connection Error: {str(e)}")