def calculate_centroid(x1, y1, x2, y2):
    """
    Takes raw YOLO bounding box coordinates (x1, y1, x2, y2)
    and returns the X and Y centroid (center point).
    """
    center_x = (x1 + x2) / 2.0
    center_y = (y1 + y2) / 2.0
    
    return center_x, center_y

def sort_left_to_right(detections):
    """
    Takes a list of detection dictionaries and sorts them from left to right.
    It does this by calculating the X-centroid for each bounding box and using it to sort.
    """
    # We sort using Python's sorted(). The key uses a lambda function that 
    # runs our calculate_centroid function and only looks at the first result (index [0] is center_x)
    return sorted(
        detections,
        key=lambda item: calculate_centroid(item['box'][0], item['box'][1], item['box'][2], item['box'][3])[0]
    )


# --- TEST BLOCK ---
if __name__ == "__main__":
    # Fake mocked YOLO output. Format of box: [x1, y1, x2, y2]
    # I purposely put them out of order (Right, Middle, Left)
    scrambled_boxes =[
        {"id": 1, "label": "switch", "box":[800, 100, 850, 150]},  # Far Right (Center X = 825)
        {"id": 2, "label": "switch", "box":[400, 100, 450, 150]},  # Middle (Center X = 425)
        {"id": 3, "label": "switch", "box":[50, 100, 100, 150]}    # Far Left (Center X = 75)
    ]
    
    print("Before sorting (scrambled IDs):")
    print([d['id'] for d in scrambled_boxes])
    
    sorted_boxes = sort_left_to_right(scrambled_boxes)
    
    print("\nAfter sorting (expected to read purely Left-to-Right: 3 -> 2 -> 1):")
    print([d['id'] for d in sorted_boxes])