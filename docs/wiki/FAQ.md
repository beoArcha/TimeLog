# ❓ Frequently Asked Questions (FAQ)

🌐 **Language / Język**: **English** | [Polski](pl/FAQ.md) | [Deutsch](de/FAQ.md) | [Español](es/FAQ.md) | [Français](fr/FAQ.md) | [Português (Brasil)](pt-br/FAQ.md)

---

Here are clear, simple answers to the most common questions about using oXyFlow.

---

## 1. Where is my data saved?

**100% on your local computer.**  
oXyFlow stores everything in a local file on your hard drive:

- **Windows**: `%APPDATA%\com.oxytime.oxyflow\timelog.db`
- **Linux**: `~/.local/share/com.oxytime.oxyflow/timelog.db`
- **macOS**: `~/Library/Application Support/com.oxytime.oxyflow/timelog.db`

No cloud servers are used. Nobody else can see your client names, task titles, or recorded hours.

---

## 2. Can I use oXyFlow without an internet connection?

**Yes, completely.**  
oXyFlow works 100% offline. You can track time on airplanes, trains, or anywhere without Wi-Fi.

---

## 3. Why does Windows show a blue "SmartScreen" warning when I install?

Microsoft Defender SmartScreen displays a warning for newly downloaded software that is not signed with an expensive corporate certificate. Because oXyFlow is a free, community open-source project, it does not carry an expensive corporate signature.

**How to open safely:**

1. Click **"More info"** on the blue SmartScreen dialog.
2. Click **"Run anyway"**.  
Windows will remember your approval for future updates.

---

## 4. What happens if I forget to stop my timer overnight?

oXyFlow has built-in smart safeguards!

- By default, it detects when a timer crosses midnight or runs continuously for more than a set number of hours (e.g. 10 hours).
- It will automatically pause the timer and notify you so your daily reports don't show an unrealistic 24-hour workday.

---

## 5. How do I export my hours to Excel or send an invoice?

1. Open the **Reports** tab.
2. Select your date range (e.g. *This Week* or *This Month*).
3. Click **"Export CSV"** to open directly in Microsoft Excel, Google Sheets, or Apple Numbers.
4. Or click **"Export HTML"** to get a clean, beautifully formatted invoice summary ready to print or save as a PDF.

---

## 6. How do I backup or transfer my data to a new computer?

1. Open **Settings $\to$ Database**.
2. Click **"Create Backup"** and save the `.sqlite` file to a folder or USB drive.
3. On your new computer, open oXyFlow, go to **Settings $\to$ Database**, and click **"Restore Database"**. All your projects, tasks, and history will be instantly restored!

---

## 7. How do I change the language or color theme?

- To change the language: Open **Settings $\to$ Language** and pick from English, Polski, Deutsch, Español, Français, or Português (Brasil).
- To change the color theme: Open **Settings $\to$ Appearance** and select from the 12 available color palettes.
