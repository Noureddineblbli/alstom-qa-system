import json
import os

def get_slot_info(slot_id):
    json_path = os.path.join(os.path.dirname(__file__), "blueprint.json")
    
    with open(json_path, "r") as f:
        blueprint = json.load(f)
    
    for slot in blueprint:
        if slot["slot_id"] == slot_id:
            return slot
    
    print(f"WARNING: slot_id '{slot_id}' not found in blueprint!")
    return None


if __name__ == "__main__":
    # Test with a valid slot_id
    result = get_slot_info("R1-S3")
    print("Valid slot:", result)

    # Test with an invalid slot_id
    result = get_slot_info("R99-S99")
    print("Invalid slot:", result)