import re


def format_calibre(raw_text):
    """ Cleans calibre strings: Converts 'L' to '1' and keeps digits/'A'. """
    # 1. Force Upper and strip junk spaces
    clean = raw_text.upper().strip()
    # 2. Fix the specific 'l'/'L' to '1' confusion
    # (Do this BEFORE deleting everything else)
    clean = clean.replace('L', '1')
    # 3. Finally, strip out anything that isn't a digit or 'A'
    clean = re.sub(r'[^0-9A]', '', clean)
    return clean


def format_identification(raw_text):
    """ Cleans ID strings: removes junk and fixes 'O' -> '0'. """
    # 1. Remove non-alphanumeric except simple punctuation we might want to strip later
    clean = re.sub(r'[^A-Z0-9]', '', raw_text.upper())
    # 2. Fix the specific 'O' vs '0' confusion
    # (Assuming labels look like numbers)
    clean = clean.replace('O', '0')
    return clean


# --- TEST BLOCK ---
if __name__ == "__main__":
    messy_calibres = [" 1 A ", "1a.", "[3A]", "lA"]
    messy_ids = ["94O11", "94 011 -", "S4011"]

    print("--- Calibre Cleaning ---")
    for text in messy_calibres:
        print(f"Original: '{text}' -> Clean: '{format_calibre(text)}'")

    print("\n--- Identification Cleaning ---")
    for text in messy_ids:
        print(f"Original: '{text}' -> Clean: '{format_identification(text)}'")
