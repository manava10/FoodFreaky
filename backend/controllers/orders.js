const Order = require('../models/Order');
const PDFDocument = require('pdfkit');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { 
            items, 
            shippingAddress, 
            itemsPrice, 
            taxPrice, 
            shippingPrice, 
            totalPrice,
            couponUsed
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ msg: 'No order items' });
        }

        const order = new Order({
            user: req.user.id,
            items,
            shippingAddress,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            couponUsed
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Check if the order belongs to the user
        if (order.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Check if the order is in a cancellable state
        if (order.status !== 'Waiting for Acceptance') {
            return res.status(400).json({ msg: 'Order cannot be cancelled at this stage' });
        }

        order.status = 'Cancelled';
        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};


// @desc    Get invoice for an order
// @route   GET /api/orders/:id/invoice
// @access  Private
exports.getOrderInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email contactNumber');
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Check if the order belongs to the user making the request
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') { // Allow admin to download any invoice
            return res.status(401).json({ msg: 'Not authorized to access this order' });
        }

        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${order._id}.pdf"`);

        doc.pipe(res);

        // --- PDF Design Starts Here ---

        const brandColor = '#F97316'; // Orange-500

        // Header Section
        doc.fillColor(brandColor)
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('FoodFreaky', 50, 50);
        
        doc.fillColor('#333')
           .fontSize(10)
           .text('FoodFreaky Inc.', 200, 65, { align: 'right' })
           .text('VIT AP UNIVERSITY', 200, 80, { align: 'right' })
           .text('Andhra Pradesh, 522237', 200, 95, { align: 'right' });

        doc.rect(50, 125, 500, 2).fill(brandColor); // Header line

        // Info Section (Billed To & Invoice Details)
        const infoTop = 150;
        doc.fontSize(10).font('Helvetica-Bold').text('Billed To:', 50, infoTop);
        doc.font('Helvetica').text(order.user.name, 50, infoTop + 15);
        doc.text(order.user.email, 50, infoTop + 30);
        doc.text(order.shippingAddress, 50, infoTop + 45, { width: 250 });

        doc.font('Helvetica-Bold').text('Invoice Number:', 300, infoTop);
        doc.font('Helvetica').text(order._id.toString(), 400, infoTop);
        doc.font('Helvetica-Bold').text('Date of Issue:', 300, infoTop + 15);
        doc.font('Helvetica').text(new Date(order.createdAt).toLocaleDateString(), 400, infoTop + 15);
        doc.font('Helvetica-Bold').text('Status:', 300, infoTop + 30);
        doc.font('Helvetica').text(order.status, 400, infoTop + 30);
        
        doc.moveDown(5);

        // Invoice Table
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        
        // Draw table header background
        doc.rect(50, tableTop - 5, 500, 20).fill(brandColor);
        
        // Write table header text
        doc.fillColor('#FFF')
           .fontSize(10)
           .text('Item', 60, tableTop)
           .text('Qty', 300, tableTop, { width: 50, align: 'center' })
           .text('Unit Price', 370, tableTop, { width: 70, align: 'right' })
           .text('Total', 0, tableTop, { align: 'right' });
        
        doc.fillColor('#333');

        let i = 0;
        order.items.forEach(item => {
            const y = tableTop + 25 + (i * 25);
            doc.fontSize(10).font('Helvetica');
            doc.text(item.name, 60, y, { width: 230 });
            doc.text(item.quantity.toString(), 300, y, { width: 50, align: 'center' });
            doc.text(`₹${item.price.toFixed(2)}`, 370, y, { width: 70, align: 'right' });
            doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 0, y, { align: 'right' });
            
            // Draw line below item
            if (i < order.items.length) {
                 doc.moveTo(50, y + 18).lineTo(550, y + 18).strokeOpacity(0.2).stroke();
            }
            i++;
        });

        // Summary Section
        const summaryTop = tableTop + 30 + (order.items.length * 25);
        doc.font('Helvetica');
        
        doc.text(`Subtotal:`, 370, summaryTop, { width: 70, align: 'right' });
        doc.text(`₹${order.itemsPrice.toFixed(2)}`, 0, summaryTop, { align: 'right' });
        
        doc.text(`Taxes:`, 370, summaryTop + 20, { width: 70, align: 'right' });
        doc.text(`₹${order.taxPrice.toFixed(2)}`, 0, summaryTop + 20, { align: 'right' });

        doc.text(`Service Charges:`, 370, summaryTop + 40, { width: 70, align: 'right' });
        doc.text(`₹${order.shippingPrice.toFixed(2)}`, 0, summaryTop + 40, { align: 'right' });

        let finalTotalTop = summaryTop + 60;

        // Display discount if it was applied
        const subtotalWithCharges = order.itemsPrice + order.taxPrice + order.shippingPrice;
        if (order.totalPrice < subtotalWithCharges) {
            const discount = subtotalWithCharges - order.totalPrice;
            const discountLabel = order.couponUsed ? `Discount (${order.couponUsed})` : 'Discount';
            doc.fillColor('#059669'); // Green color for discount
            doc.text(`${discountLabel}:`, 370, summaryTop + 60, { width: 70, align: 'right' });
            doc.text(`- ₹${discount.toFixed(2)}`, 0, summaryTop + 60, { align: 'right' });
            finalTotalTop += 20; // Move grand total down
        }

        const totalTop = finalTotalTop;
        doc.rect(360, totalTop - 5, 190, 20).fill('#EEE');
        doc.font('Helvetica-Bold');
        doc.fillColor('#000').text(`Grand Total:`, 370, totalTop, { width: 70, align: 'right' });
        doc.text(`₹${order.totalPrice.toFixed(2)}`, 0, totalTop, { align: 'right' });

        // Footer Section
        const signatureY = 650; // Using a fixed, safe Y coordinate
        
        // Signature
        doc.font('Helvetica-Oblique').fontSize(10).fillColor('#333').text('Signature:', 50, signatureY + 15);
        
        doc.font('Times-BoldItalic')
           .fontSize(18)
           .fillColor('#002266')
           .text('Yoginder', 360, signatureY, {
            width: 190,
            align: 'center'
        });
        
        // Line for signature
        doc.moveTo(360, signatureY + 25)
           .lineTo(550, signatureY + 25)
           .strokeColor('#333')
           .stroke();
        
        // Title
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333').text('Authorized Signatory', 360, signatureY + 30, {
            width: 190,
            align: 'center'
        });

        doc.fillColor('#777')
           .fontSize(8)
           .text('Thank you for your business!', 50, doc.page.height - 50, { align: 'center', width: 500 });

        doc.end();

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};
