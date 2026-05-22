import pandas as pd
from typing import List

def parse_reference_file(file_path: str) -> List[dict]:
    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path, header=None)
        else:
            df = pd.read_excel(file_path, header=None)

        slots = []

        for row_idx in range(2, len(df)):
            row_data = df.iloc[row_idx]
            row_number = int(row_data[0])

            col = 1
            slot_number = 1
            while col + 1 < len(row_data):
                id_val = row_data[col]
                amp_val = row_data[col + 1]

                if pd.notna(id_val) and pd.notna(amp_val):
                    slots.append({
                        "slotId": f"R{row_number}-S{slot_number}",
                        "identification_id": str(id_val).strip(),
                        "amperage": str(amp_val).strip()
                    })
                col += 2
                slot_number += 1

        return slots

    except Exception as e:
        raise ValueError(f"Failed to parse file: {str(e)}")