# Import the logic Intern A created
from preprocessing.geometry import calculate_centroid
# The 'X_TOLERANCE' is the number of pixels allowed for horizontal alignment
# between the center of a sticker and the center of a switch.
X_TOLERANCE = 100


def match_stickers_to_switches(stickers, switches):
    """
    Groups switches under their corresponding stickers based on X-axis boundaries.
    Can return multiple switches per sticker (for double-pole breakers).
    """
    mapped_pairs = []

    # Sort stickers from left to right to guarantee correct slot ordering
    stickers = sorted(stickers, key=lambda s: s['box'][0])

    for sticker in stickers:
        st_x1, st_y1, st_x2, st_y2 = sticker['box']
        st_cy = (st_y1 + st_y2) / 2

        matched_switches = []
        for switch in switches:
            sw_x1, sw_y1, sw_x2, sw_y2 = switch['box']
            sw_cx = (sw_x1 + sw_x2) / 2
            sw_cy = (sw_y1 + sw_y2) / 2

            # Switch must be below the sticker
            if sw_cy > st_cy:
                # Switch center must fall within sticker width (+ padding)
                padding = 15
                if (st_x1 - padding) <= sw_cx <= (st_x2 + padding):
                    matched_switches.append(switch)

        # Sort the matched switches left to right inside this specific slot
        matched_switches = sorted(matched_switches, key=lambda s: s['box'][0])

        # We now map ONE sticker to a LIST of switches
        if matched_switches:
            mapped_pairs.append({
                "sticker": sticker,
                "switches": matched_switches
            })

    return mapped_pairs


if __name__ == "__main__":
    # Mock data sorted from left to right (as Intern A provides)
    # Stickers are above the switches (Sticker Y ~ 50, Switch Y ~ 150)
    mock_stickers = [
        {"id": "s1", "box": [50, 40, 100, 60]},
        {"id": "s2", "box": [400, 40, 450, 60]}
    ]
    mock_switches = [
        {"id": "sw1", "box": [55, 140, 95, 160]},  # Aligned with s1
        {"id": "sw2", "box": [410, 140, 450, 160]}  # Aligned with s2
    ]

    match_stickers_to_switches(mock_stickers, mock_switches)
