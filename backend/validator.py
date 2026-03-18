import sys
import os

# Append the root project directory so Python can find your 'data' folder from Round 1
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import your real database loader!
from data.blueprint_loader import get_slot_info

def check_assembly(slot_id, extracted_calibre, extracted_identification):
    """
    Validates OCR string against Blueprint expectation and returns exact match state.
    """
    # 1. Fetch expected schema from Round 1 DB
    expected_data = get_slot_info(slot_id)
    
    # 2. Check if the blueprint actually knows this slot
    if not expected_data:
        return {"status": "ERROR", "message": f"Slot ID '{slot_id}' not found in blueprint"}
    
    # 3. Extract ground truth variables (Updated to match your actual blueprint keys!)
    expected_cal = expected_data.get("expected_calibre")
    expected_id = expected_data.get("expected_identification")
    
    # 4. Simple boolean matches
    calibre_match = (extracted_calibre == expected_cal)
    id_match = (extracted_identification == expected_id)
    
    # 5. Strict Routing conditionals
    if calibre_match and id_match:
        status = "PASS"
        message = "Assembly is correct."
    elif not calibre_match and id_match:
        status = "FAIL_CALIBRE"
        message = "Wrong Calibre installed."
    elif calibre_match and not id_match:
        status = "FAIL_IDENTIFICATION"
        message = "Wrong Identification sticker applied."
    else:
        status = "FAIL_BOTH"
        message = "Both Calibre and Identification are incorrect."
        
    # 6. Build structured payload for the frontend UI
    return {
        "status": status,
        "message": message,
        "expected": {"calibre": expected_cal, "identification": expected_id},
        "actual": {"calibre": extracted_calibre, "identification": extracted_identification}
    }


# --- TEST BLOCK ---
if __name__ == "__main__":
    # Now using your actual database keys and values!
    print("--- Test 1: Perfect Match ---")
    print(check_assembly("R1-S1", "1A", "DIS-001"))
    
    print("\n--- Test 2: Bad Switch Rating ---")
    print(check_assembly("R1-S1", "3A", "DIS-001"))
    
    print("\n--- Test 3: Total Failure ---")
    print(check_assembly("R1-S2", "0.5A", "XXXX"))
    
    print("\n--- Test 4: Missing Blueprint ID ---")
    print(check_assembly("invalid_slot", "1A", "DIS-001"))