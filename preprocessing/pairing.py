# Import the logic Intern A created
from geometry import calculate_centroid

# The 'X_TOLERANCE' is the number of pixels allowed for horizontal alignment
# between the center of a sticker and the center of a switch.
X_TOLERANCE = 25 

def match_stickers_to_switches(stickers, switches):
    mapped_pairs = []
    
    print(f"Matching {len(stickers)} stickers and {len(switches)} switches.")

    for switch in switches:
        sw_cx, sw_cy = calculate_centroid(*switch['box'])
        best_match = None

        for sticker in stickers:
            st_cx, st_cy = calculate_centroid(*sticker['box'])
            
            # 1. Horizontal check: Are their centers close on the X-axis?
            dist_x = abs(sw_cx - st_cx)
            
            # 2. Vertical check: Is the sticker clearly above the switch?
            # (In images, smaller Y values are higher up)
            is_above = st_cy < sw_cy
            
            if dist_x <= X_TOLERANCE and is_above:
                best_match = sticker
                break
        
        if best_match:
            mapped_pairs.append({"switch": switch, "sticker": best_match})
            print(f"Matched {switch['id']} with {best_match['id']}")
        else:
            print(f"WARNING: No sticker found for {switch['id']}")
            
    return mapped_pairs

if __name__ == "__main__":
    # Mock data sorted from left to right (as Intern A provides)
    # Stickers are above the switches (Sticker Y ~ 50, Switch Y ~ 150)
    mock_stickers = [
        {"id": "s1", "box": [50, 40, 100, 60]}, 
        {"id": "s2", "box": [400, 40, 450, 60]}
    ]
    mock_switches = [
        {"id": "sw1", "box": [55, 140, 95, 160]}, # Aligned with s1
        {"id": "sw2", "box": [410, 140, 450, 160]} # Aligned with s2
    ]
    
    match_stickers_to_switches(mock_stickers, mock_switches)