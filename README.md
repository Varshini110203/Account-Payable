# 📄 Smart Document Annotation & Viewer Tool

An interactive PDF and JSON viewer that intelligently links OCR-extracted data with form inputs. Built with **React**, **Carbon Design System**, and **react-xarrows**, this tool enables document review, annotation, and validation — tailored for documents like **Bank Statements** and **Paystubs**.

---

## 🚀 Features

- 🧾 PDF Viewer with hoverable text annotations (via OCR)
- 📄 JSON Viewer with field-to-PDF linking
- 🔀 Document Type Switcher (Bank Statement, Paystub)
- 🧠 Dynamic Input Forms driven by document type
- 🧩 Generic reusable input field engine (based on schema)
- 📎 Arrow links between input fields and PDF text (`react-xarrows`)
- 💅 Modern UI built using IBM's Carbon Design System

---

## 📂 Supported Document Types

- ✅ Bank Statement
- ✅ Paystub
- 🛠 Easily extendable to: W2, Schedule E, Credit Report, etc.

---

## ⚙️ Tech Stack

- **React + Vite**
- **Carbon Components React** (IBM Design System)
- **react-pdf** for PDF rendering
- **react-xarrows** for visual linking
- **Context API** for state management

---

## 💾 Installation & Setup

> ⚠️ Make sure Node.js (v16+) and npm are installed.

1. **Clone the repository**

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
