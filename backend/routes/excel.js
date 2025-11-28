const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const supabase = require('../services/supabaseClient');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload_excel', upload.single('file'), async (req, res) => {
    try {
        console.log('=== Excel Product Upload Started ===');

        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File received:', req.file.originalname, 'Size:', req.file.size, 'Type:', req.file.mimetype);

        // Parse Excel/CSV file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log('Parsed rows:', data.length);

        if (data.length === 0) {
            return res.status(400).json({ error: 'No data found in Excel file' });
        }

        const addedProducts = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                // Expected columns: name, sku_id, category, cost_price, selling_price, initial_stock
                const productData = {
                    name: row.name || row.Name || row.product_name || row['Product Name'],
                    sku_id: row.sku_id || row.sku || row.SKU || row['SKU ID'],
                    category: row.category || row.Category || 'General',
                    cost_price: parseFloat(row.cost_price || row['Cost Price'] || 0),
                    selling_price: parseFloat(row.selling_price || row['Selling Price'] || 0),
                    initial_stock: parseInt(row.stock || row.initial_stock || row['Initial Stock'] || 0)
                };

                // Validate required fields
                if (!productData.name || !productData.sku_id) {
                    errors.push({
                        row: i + 2, // +2 for Excel row (1 = header)
                        error: 'Missing required fields (name or sku_id)',
                        data: row
                    });
                    continue;
                }

                // Check if product already exists
                const { data: existingProduct } = await supabase
                    .from('products')
                    .select('id')
                    .eq('sku_id', productData.sku_id)
                    .single();

                if (existingProduct) {
                    // Update existing product
                    const { error: updateError } = await supabase
                        .from('products')
                        .update({
                            name: productData.name,
                            category: productData.category,
                            cost_price: productData.cost_price,
                            selling_price: productData.selling_price
                        })
                        .eq('id', existingProduct.id);

                    if (updateError) {
                        errors.push({
                            row: i + 2,
                            error: 'Failed to update product: ' + updateError.message,
                            data: row
                        });
                        continue;
                    }

                    // Update stock
                    const { error: stockError } = await supabase
                        .from('stock_levels')
                        .update({ current_stock: productData.initial_stock })
                        .eq('product_id', existingProduct.id);

                    if (stockError) {
                        console.error('Stock update error:', stockError);
                    }

                    addedProducts.push({ ...productData, action: 'updated', id: existingProduct.id });
                } else {
                    // Add new product
                    const { data: product, error: prodError } = await supabase
                        .from('products')
                        .insert([{
                            name: productData.name,
                            sku_id: productData.sku_id,
                            category: productData.category,
                            cost_price: productData.cost_price,
                            selling_price: productData.selling_price,
                            active: true
                        }])
                        .select()
                        .single();

                    if (prodError) {
                        errors.push({
                            row: i + 2,
                            error: 'Failed to insert product: ' + prodError.message,
                            data: row
                        });
                        continue;
                    }

                    // Add stock level
                    const { error: stockError } = await supabase
                        .from('stock_levels')
                        .insert([{
                            product_id: product.id,
                            current_stock: productData.initial_stock
                        }]);

                    if (stockError) {
                        console.error('Stock insert error:', stockError);
                    }

                    addedProducts.push({ ...productData, action: 'added', id: product.id });
                }

                // Audit log
                await supabase.from('audit_logs').insert([{
                    action: 'bulk_upload_product',
                    table_name: 'products',
                    details: { sku_id: productData.sku_id, name: productData.name },
                    timestamp: new Date()
                }]);

            } catch (error) {
                console.error(`Error processing row ${i + 2}:`, error);
                errors.push({
                    row: i + 2,
                    error: error.message,
                    data: row
                });
            }
        }

        console.log('=== Excel Upload Completed ===');
        console.log('Added/Updated:', addedProducts.length);
        console.log('Errors:', errors.length);

        res.json({
            message: `Successfully processed ${addedProducts.length} products`,
            success: addedProducts.length,
            errors: errors.length,
            details: {
                added: addedProducts.filter(p => p.action === 'added').length,
                updated: addedProducts.filter(p => p.action === 'updated').length
            },
            products: addedProducts,
            errorDetails: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('=== Excel Upload Error ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);

        res.status(500).json({
            error: 'Failed to process Excel file: ' + error.message
        });
    }
});

module.exports = router;
