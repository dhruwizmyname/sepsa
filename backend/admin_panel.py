import streamlit as st
import pandas as pd
import os

st.set_page_config(page_title="SEPSA Admin Dashboard", layout="wide")

st.title("🛡️ SEPSA Admin Command Center")

# Sidebar for Navigation
menu = ["Login Logs", "Event Folders", "System Health"]
choice = st.sidebar.selectbox("Menu", menu)

if choice == "Login Logs":
    st.subheader("📊 Recent Login Activities")
    if os.path.exists("storage/login_logs.csv"):
        df = pd.read_csv("storage/login_logs.csv")
        st.dataframe(df, use_container_width=True)
        st.download_button("Download Full Report", df.to_csv(index=False), "logs.csv", "text/csv")
    else:
        st.info("No login logs found yet.")

elif choice == "Event Folders":
    st.subheader("📂 Registered Events")
    if os.path.exists("storage/events_record.csv"):
        df_ev = pd.read_csv("storage/events_record.csv")
        st.table(df_ev)
    
    st.divider()
    st.write("Current Folders in Storage:")
    if os.path.exists("storage/events"):
        st.write(os.listdir("storage/events"))