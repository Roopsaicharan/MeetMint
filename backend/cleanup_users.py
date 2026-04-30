import sqlite3
import os

db_path = 'meetmint.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Delete by email
email = 'testmeetmint1@gmail.com'
cursor.execute("DELETE FROM users WHERE email=?", (email,))
rows_deleted = cursor.rowcount
print(f"Deleted {rows_deleted} users with email '{email}'.")

# Delete by name like Ashmitha
name_pattern = '%ashm%'
cursor.execute("DELETE FROM users WHERE name LIKE ? COLLATE NOCASE", (name_pattern,))
rows_deleted_name = cursor.rowcount
print(f"Deleted {rows_deleted_name} users with name matching '{name_pattern}'.")

conn.commit()
conn.close()
print("Database cleanup complete.")
