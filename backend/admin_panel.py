import streamlit as st
import pandas as pd
import json
import os
from datetime import datetime

st.set_page_config(page_title="SEPSA Admin Dashboard", layout="wide")
st.title("🛡️ SEPSA Admin Command Center")

# Auto-refresh every 15 seconds
st.markdown(
    '<meta http-equiv="refresh" content="15">',
    unsafe_allow_html=True,
)

menu = ["📊 Login Logs", "👥 Users Registry", "📂 Events", "💻 System Health"]
choice = st.sidebar.selectbox("Menu", menu)

# ─────────────────────────────────────────────
# 1. LOGIN LOGS
# ─────────────────────────────────────────────
if choice == "📊 Login Logs":
    st.subheader("📊 Recent Login Activities")
    log_path = "storage/login_logs.csv"
    if os.path.exists(log_path) and os.path.getsize(log_path) > 0:
        df = pd.read_csv(log_path)
        if not df.empty:
            # Summary metrics
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Total Events", len(df))
            col2.metric("Unique Users", df[df["role"] == "user"]["identifier"].nunique())
            col3.metric("Photographer Logins", len(df[df["role"] == "photographer"]))
            col4.metric("Failed Attempts", len(df[df["status"] == "failed"]))

            st.divider()

            # Filter controls
            col_r, col_s = st.columns(2)
            role_filter = col_r.selectbox("Filter by Role", ["All", "user", "photographer"])
            status_filter = col_s.selectbox("Filter by Status", ["All", "success", "failed"])

            filtered = df.copy()
            if role_filter != "All":
                filtered = filtered[filtered["role"] == role_filter]
            if status_filter != "All":
                filtered = filtered[filtered["status"] == status_filter]

            st.dataframe(filtered.sort_values("timestamp", ascending=False), use_container_width=True)
            st.download_button("⬇️ Download CSV", df.to_csv(index=False), "login_logs.csv", "text/csv")
        else:
            st.info("No login logs found yet.")
    else:
        st.info("No login logs found yet.")

# ─────────────────────────────────────────────
# 2. USERS REGISTRY
# ─────────────────────────────────────────────
elif choice == "👥 Users Registry":
    st.subheader("👥 Registered Users")
    registry_path = "storage/users_registry.json"
    user_photos_path = "storage/user_photos.json"

    if os.path.exists(registry_path):
        with open(registry_path) as f:
            registry = json.load(f)

        user_photos = {}
        if os.path.exists(user_photos_path):
            with open(user_photos_path) as f:
                user_photos = json.load(f)

        rows = []
        for phone, info in registry.items():
            rows.append({
                "Phone": phone,
                "Name": info.get("name") or "—",
                "Email": info.get("email") or "—",
                "City": info.get("city") or "—",
                "Selfie ✅": "✅" if info.get("selfie_registered") else "❌",
                "Photos Matched": len(user_photos.get(phone, [])),
                "Login Count": info.get("login_count", 1),
                "Registered At": info.get("registered_at", "—"),
                "Last Login": info.get("last_login", "—"),
            })

        if rows:
            df_users = pd.DataFrame(rows)

            col1, col2, col3 = st.columns(3)
            col1.metric("Total Users", len(df_users))
            col2.metric("Selfie Registered", int((df_users["Selfie ✅"] == "✅").sum()))
            col3.metric("Total Photos Matched", int(df_users["Photos Matched"].sum()))

            st.divider()
            st.dataframe(df_users, use_container_width=True)
            st.download_button("⬇️ Download Users CSV", df_users.to_csv(index=False), "users_registry.csv", "text/csv")
        else:
            st.info("No users registered yet.")
    else:
        st.info("No users registered yet.")

# ─────────────────────────────────────────────
# 3. EVENTS
# ─────────────────────────────────────────────
elif choice == "📂 Events":
    st.subheader("📂 Events Overview")
    events_path = "storage/events.json"
    event_photos_path = "storage/event_photos.json"

    if os.path.exists(events_path):
        with open(events_path) as f:
            events = json.load(f)

        event_photos = {}
        if os.path.exists(event_photos_path):
            with open(event_photos_path) as f:
                event_photos = json.load(f)

        if events:
            rows = [{
                "Event Name": e["name"],
                "Date": e.get("date", "—"),
                "Photos Uploaded": len(event_photos.get(e["name"], [])),
            } for e in events]
            df_ev = pd.DataFrame(rows)
            col1, col2 = st.columns(2)
            col1.metric("Total Events", len(df_ev))
            col2.metric("Total Photos", int(df_ev["Photos Uploaded"].sum()))
            st.divider()
            st.dataframe(df_ev, use_container_width=True)
        else:
            st.info("No events created yet.")
    else:
        st.info("No events found.")

# ─────────────────────────────────────────────
# 4. SYSTEM HEALTH
# ─────────────────────────────────────────────
elif choice == "💻 System Health":
    st.subheader("💻 System Health")

    def count_files(directory):
        if os.path.exists(directory):
            return len([f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))])
        return 0

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Uploads", count_files("storage/uploads"))
    col2.metric("Thumbnails", count_files("storage/thumbnails"))
    col3.metric("Known Faces", count_files("storage/known_faces"))

    mappings_count = 0
    if os.path.exists("storage/photo_mappings.json"):
        with open("storage/photo_mappings.json") as f:
            mappings_count = len(json.load(f))
    col4.metric("Face Embeddings", mappings_count)

    st.divider()
    st.subheader("Storage Files")
    storage_files = []
    for fname in os.listdir("storage"):
        fpath = os.path.join("storage", fname)
        if os.path.isfile(fpath):
            size_kb = os.path.getsize(fpath) / 1024
            storage_files.append({"File": fname, "Size (KB)": round(size_kb, 1)})
    if storage_files:
        st.dataframe(pd.DataFrame(storage_files), use_container_width=True)
