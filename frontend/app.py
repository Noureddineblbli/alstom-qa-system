import streamlit as st
import requests
from pathlib import Path
import time

# Page configuration
st.set_page_config(
    page_title="Alstom QA System",
    page_icon="✓",
    layout="wide"
)

# Title
st.title("🔍 Alstom QA System - Row Validator")
st.write("Upload a factory row image for automatic component validation")

# Sidebar for inputs
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

# Image upload
st.sidebar.header("Upload Image")
uploaded_file = st.sidebar.file_uploader(
    "Choose an image file",
    type=["jpg", "jpeg", "png", "bmp"],
    help="Upload a factory row image"
)

# Main content area
col1, col2 = st.columns([2, 1])

with col2:
    scan_button = st.button("🔍 Scan Row", use_container_width=True)

# Handle scan button click
if scan_button:
    if uploaded_file is None:
        st.error("❌ Please upload an image first!")
    else:
        # Save uploaded file temporarily
        temp_path = f"temp_{uploaded_file.name}"
        with open(temp_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        
        # Show loading spinner and make API call
        with st.spinner("🔄 Processing image... This may take a moment"):
            try:
                # Send POST request to FastAPI
                response = requests.post(
                    "http://localhost:8000/api/validate_slot",
                    json={
                        "image_path": temp_path,
                        "row_id": f"R{row_id}"
                    }
                )
                
                if response.status_code == 200:
                    results = response.json()
                    st.success("✅ Validation Complete!")
                    
                    # Display results
                    st.json(results)
                else:
                    st.error(f"❌ API Error: {response.status_code}")
                    st.write(response.text)
            
            except Exception as e:
                st.error(f"❌ Connection Error: {str(e)}")