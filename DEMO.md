# KIRANA911 Demo Instructions

## Prerequisites
- Node.js installed
- Supabase Account (URL & Key)
- Gemini API Key

## Setup

1. **Backend Setup**
   - Navigate to `backend` folder: `cd backend`
   - Create `.env` file with your keys (see `.env.example` or code).
   - Run `npm install`
   - Start server: `node server.js`

2. **Frontend Setup**
   - Navigate to `frontend` folder: `cd frontend`
   - Run `npm install`
   - Start dev server: `npm run dev`

3. **Database Setup**
   - Run the SQL script in `setup/schema.sql` in your Supabase SQL Editor.

## Demo Flow

1. **Dashboard**: View the main dashboard with revenue and low stock alerts.
2. **Inventory**: 
   - Go to Inventory page.
   - Click "Add Product" to add a new item manually.
   - View the list of products.
3. **Chatbot**:
   - Click the chat icon (bottom right).
   - Ask: "What is low in stock?" (Ensure you have some low stock items).
   - Ask: "Set budget to 50000".
4. **Finance**:
   - Go to Finance page.
   - Check P&L summary.
   - View Budget status (updated by chatbot or manual input).
5. **Forecast**:
   - Go to Forecast page to see simple sales predictions based on data.

## OCR (Bill Scanning)
- To test OCR, you can use Postman or a simple curl command to POST an image to `http://localhost:3000/api/ocr/upload_bill` with form-data key `bill`.
- (UI for file upload is not explicitly in the main flow but API is ready).

Enjoy KIRANA911!
