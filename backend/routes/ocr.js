const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeImage } = require('../services/geminiService');
const supabase = require('../services/supabaseClient');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload_bill', upload.single('bill'), async (req, res) => {
    try {
        console.log('=== OCR Bill Upload Started ===');

        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File received:', req.file.originalname, 'Size:', req.file.size, 'Type:', req.file.mimetype);

        // 1. Analyze with Gemini
        console.log('Calling Gemini Vision API...');
        const billData = await analyzeImage(req.file.buffer, req.file.mimetype);
        console.log('Extracted Bill Data:', JSON.stringify(billData, null, 2));

        if (!billData.items || billData.items.length === 0) {
            console.error('No items found in bill');
            return res.status(400).json({ error: 'No items could be extracted from the bill image. Please try a clearer image.' });
        }

        // 2. Process items
        const processedItems = [];
        let totalSaleAmount = 0;

        for (const item of billData.items) {
            console.log(`Processing item: ${item.name}`);

            // Find product by name (fuzzy match or exact)
            const { data: products } = await supabase
                .from('products')
                .select('id, selling_price')
                .ilike('name', `%${item.name}%`)
                .limit(1);

            let productId = null;
            let unitPrice = item.unit_price;

            if (products && products.length > 0) {
                productId = products[0].id;
                console.log(`Matched product: ${item.name} -> ${productId}`);
            } else {
                console.warn(`Product not found in inventory: ${item.name}`);
            }

            const total = item.qty * unitPrice;
            totalSaleAmount += total;

            // 3. Insert Sale
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    product_id: productId,
                    date: billData.date || new Date(),
                    qty_sold: item.qty,
                    unit_price: unitPrice,
                    total_price: total,
                    source: 'ocr'
                }])
                .select()
                .single();

            if (saleError) {
                console.error('Sale Insert Error:', saleError);
                throw new Error(`Failed to insert sale for ${item.name}: ${saleError.message}`);
            }

            // 4. Update Stock
            if (productId) {
                const { data: stock } = await supabase
                    .from('stock_levels')
                    .select('current_stock')
                    .eq('product_id', productId)
                    .single();

                if (stock) {
                    const newStock = stock.current_stock - item.qty;
                    console.log(`Updating stock for product ${productId}: ${stock.current_stock} -> ${newStock}`);

                    await supabase
                        .from('stock_levels')
                        .update({ current_stock: newStock })
                        .eq('product_id', productId);
                }
            }

            processedItems.push({ ...item, sale_id: sale?.id, matched: !!productId });
        }

        // 5. Record Transaction (Income)
        const { error: transError } = await supabase.from('transactions').insert([{
            date: billData.date || new Date(),
            type: 'sale',
            category: 'Bill Scan',
            amount: totalSaleAmount,
            note: `Bill processed via OCR. ${processedItems.length} items.`,
            added_by: null
        }]);

        if (transError) {
            console.error('Transaction Insert Error:', transError);
        }

        // 6. Audit Log
        await supabase.from('audit_logs').insert([{
            action: 'process_bill',
            details: { items_count: processedItems.length, total: totalSaleAmount },
            timestamp: new Date()
        }]);

        console.log('=== OCR Bill Upload Completed Successfully ===');
        res.json({
            message: 'Bill processed successfully',
            data: {
                ...billData,
                total_amount: totalSaleAmount,
                items_processed: processedItems.length,
                items: processedItems
            }
        });

    } catch (error) {
        console.error('=== OCR Error ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        res.status(500).json({
            error: error.message || 'Failed to process bill. Please check server logs for details.'
        });
    }
});

module.exports = router;
