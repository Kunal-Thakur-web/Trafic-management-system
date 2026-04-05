import pandas as pd

count_points = pd.read_csv("count_points.csv", low_memory=False)


london_cp = count_points[
    count_points['region_name'].str.contains('London', na=False)
]

london_ids = set(london_cp['count_point_id'].unique())
print(f"London count points: {len(london_ids)}")

input_file = "dft_traffic_counts_raw_counts.csv"
output_file = "london_traffic.csv"

chunksize = 100000  

filtered_chunks = []

print("Processing large dataset in chunks...")

for i, chunk in enumerate(pd.read_csv(
        input_file,
        chunksize=chunksize,
        low_memory=False
    )):
    
   
    chunk = chunk[chunk['count_point_id'].isin(london_ids)]
    
    filtered_chunks.append(chunk)
    
    print(f"Processed chunk {i+1}")


london_df = pd.concat(filtered_chunks, ignore_index=True)

london_df.to_csv(output_file, index=False)

print(f"\nSaved London dataset to: {output_file}")
print(f"Final shape: {london_df.shape}")